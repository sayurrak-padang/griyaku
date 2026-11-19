// Supabase Edge Function "midtrans-webhook": menerima notifikasi pembayaran dari Midtrans.
// WAJIB: matikan "Verify JWT" / "Enforce JWT verification" untuk fungsi ini (Midtrans tidak punya token login).
// Secret: MIDTRANS_SERVER_KEY (sama dengan fungsi "payment").
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') ?? '';
const PROD = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
const API_URL = PROD ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

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

async function sha512(text: string) {
  const buf = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  let n: Record<string, string>;
  try {
    n = await req.json();
  } catch {
    return new Response('bad request', { status: 400 });
  }
  const orderId = n.order_id ?? '';
  // Tombol "Test notification URL" di dasbor Midtrans mengirim order_id contoh → cukup balas OK.
  if (!/^[0-9a-f-]{36}-\d+$/.test(orderId)) return new Response('ignored');

  const expected = await sha512(orderId + n.status_code + n.gross_amount + SERVER_KEY);
  if (expected !== n.signature_key) return new Response('invalid signature', { status: 403 });

  // Ambil status langsung dari Midtrans agar tidak bisa dipalsukan
  const r = await fetch(`${API_URL}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: 'application/json', Authorization: 'Basic ' + btoa(SERVER_KEY + ':') },
  });
  const t = await r.json();
  if (!r.ok) return new Response('status error', { status: 502 });
  const status = mapStatus(t);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const bookingId = orderId.slice(0, 36);
  const { data: b, error } = await admin.from('bookings').select('id, payment_status, payment_order_id, paid_at').eq('id', bookingId).maybeSingle();
  if (error) {
    console.error('Gagal membaca pesanan', error);
    return new Response('db error', { status: 500 }); // Midtrans akan mencoba lagi
  }
  if (!b) return new Response('not found');

  // Pembayaran lunas dari order mana pun untuk pesanan ini diterima.
  // Status lain hanya berlaku untuk order terbaru dan tidak menimpa status lunas (kecuali refund).
  const isCurrent = b.payment_order_id === orderId;
  const apply = status === 'lunas' || status === 'dikembalikan' || (isCurrent && b.payment_status !== 'lunas');
  if (apply) {
    await admin
      .from('bookings')
      .update({
        payment_status: status,
        payment_method: t.payment_type ?? null,
        payment_order_id: orderId,
        paid_at: status === 'lunas' ? b.paid_at ?? new Date().toISOString() : b.paid_at,
      })
      .eq('id', bookingId);
  }
  return new Response('ok');
});
