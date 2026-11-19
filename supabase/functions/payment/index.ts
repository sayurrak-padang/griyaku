// Supabase Edge Function "payment": membuat & mengecek pembayaran Midtrans untuk pesanan jasa.
// Secret yang dibutuhkan (Edge Functions → Secrets): MIDTRANS_SERVER_KEY, opsional MIDTRANS_IS_PRODUCTION=true.
// SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah otomatis tersedia.
// Boleh mematikan "Verify JWT" untuk fungsi ini: login tetap diperiksa di bawah.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') ?? '';
const PROD = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
const SNAP_URL = PROD ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
const API_URL = PROD ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const midtransAuth = () => 'Basic ' + btoa(SERVER_KEY + ':');

/** Status Midtrans → status pembayaran Griyaku */
function mapStatus(t: { transaction_status?: string; fraud_status?: string }): string {
  switch (t.transaction_status) {
    case 'settlement':
      return 'lunas';
    case 'capture':
      return t.fraud_status === 'accept' || !t.fraud_status ? 'lunas' : 'menunggu';
    case 'pending':
      return 'menunggu';
    case 'expire':
      return 'kedaluwarsa';
    case 'refund':
    case 'partial_refund':
      return 'dikembalikan';
    case 'deny':
    case 'cancel':
    case 'failure':
      return 'gagal';
    default:
      return 'menunggu';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!SERVER_KEY) return json({ error: 'MIDTRANS_SERVER_KEY belum diisi di Supabase → Edge Functions → Secrets.' }, 500);

  const url = Deno.env.get('SUPABASE_URL')!;
  const authHeader = req.headers.get('Authorization') ?? '';
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: auth } = await admin.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''));
  if (!auth?.user) return json({ error: 'Sesi login tidak valid. Keluar lalu masuk lagi di aplikasi.' }, 401);

  let body: { action?: string; booking_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Permintaan tidak valid.' }, 400);
  }
  const { data: booking, error } = await admin.from('bookings').select('*').eq('id', body.booking_id ?? '').maybeSingle();
  if (error || !booking) return json({ error: 'Pesanan tidak ditemukan.' }, 404);
  if (booking.user_id !== auth.user.id) return json({ error: 'Ini bukan pesanan Anda.' }, 403);

  // ---- cek status ----
  if (body.action === 'check') {
    if (!booking.payment_order_id) return json({ payment_status: booking.payment_status });
    const r = await fetch(`${API_URL}/v2/${encodeURIComponent(booking.payment_order_id)}/status`, {
      headers: { Accept: 'application/json', Authorization: midtransAuth() },
    });
    const t = await r.json();
    if (!r.ok || t.status_code === '404') return json({ payment_status: booking.payment_status });
    const status = mapStatus(t);
    if (booking.payment_status !== 'lunas' || status === 'dikembalikan') {
      await admin
        .from('bookings')
        .update({
          payment_status: status,
          payment_method: t.payment_type ?? booking.payment_method,
          paid_at: status === 'lunas' ? booking.paid_at ?? new Date().toISOString() : booking.paid_at,
        })
        .eq('id', booking.id);
    }
    return json({ payment_status: status });
  }

  // ---- buat pembayaran ----
  if (booking.payment_status === 'lunas') return json({ error: 'Pesanan ini sudah lunas.' }, 400);
  if (booking.status === 'Dibatalkan') return json({ error: 'Pesanan ini sudah dibatalkan.' }, 400);
  const amount = Number(booking.price);
  if (!(amount > 0)) return json({ error: 'Pesanan ini gratis, tidak perlu dibayar.' }, 400);

  const orderId = `${booking.id}-${Date.now()}`; // maks 50 karakter
  const snapRes = await fetch(SNAP_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: midtransAuth() },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [
        { id: booking.service_id, price: amount, quantity: 1, name: `${booking.service_name} - ${booking.package_name}`.slice(0, 50) },
      ],
      customer_details: { first_name: (auth.user.user_metadata?.name as string) || 'Pelanggan', email: auth.user.email },
      expiry: { unit: 'hours', duration: 24 },
    }),
  });
  const snap = await snapRes.json();
  if (!snapRes.ok || !snap.redirect_url) {
    return json({ error: 'Midtrans menolak: ' + (snap.error_messages?.join(', ') ?? snapRes.statusText) }, 502);
  }
  await admin
    .from('bookings')
    .update({ payment_status: 'menunggu', payment_order_id: orderId, payment_url: snap.redirect_url })
    .eq('id', booking.id);
  return json({ redirect_url: snap.redirect_url, order_id: orderId });
});
