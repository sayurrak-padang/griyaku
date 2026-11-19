// Pembayaran pesanan jasa lewat Midtrans (Snap). Kunci rahasia Midtrans hanya ada di
// Supabase Edge Function "payment" (supabase/functions/payment), tidak pernah di aplikasi.
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import type { Booking } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export type PaymentStatus = NonNullable<Booking['paymentStatus']>;

export const PAYMENT_LABEL: Record<PaymentStatus, { label: string; bg: string; fg: string }> = {
  belum_bayar: { label: 'Belum dibayar', bg: '#FFF4D6', fg: '#8A6100' },
  menunggu: { label: 'Menunggu pembayaran', bg: '#FFF4D6', fg: '#8A6100' },
  lunas: { label: 'Lunas', bg: '#DDF5EF', fg: '#0B6E61' },
  gagal: { label: 'Pembayaran gagal', bg: '#FDE2E2', fg: '#B42318' },
  kedaluwarsa: { label: 'Kedaluwarsa', bg: '#FDE2E2', fg: '#B42318' },
  dikembalikan: { label: 'Dana dikembalikan', bg: '#E5E7EB', fg: '#374151' },
};

export const METHOD_LABEL: Record<string, string> = {
  qris: 'QRIS',
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
  bank_transfer: 'Transfer VA',
  echannel: 'Mandiri Bill',
  credit_card: 'Kartu kredit',
  cstore: 'Indomaret/Alfamart',
  akulaku: 'Akulaku',
};

/** Pesanan ini bisa (dan perlu) dibayar sekarang? */
export function canPay(b: Booking) {
  return (
    !!supabase &&
    b.price > 0 &&
    b.status !== 'Dibatalkan' &&
    !!b.paymentStatus &&
    ['belum_bayar', 'menunggu', 'gagal', 'kedaluwarsa'].includes(b.paymentStatus)
  );
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Pembayaran hanya tersedia saat tersambung ke server.');
  const { data, error } = await supabase.functions.invoke('payment', { body });
  if (error) throw new Error(await explain(error));
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** Ubah error Edge Function menjadi pesan yang jelas + petunjuk perbaikan. */
async function explain(error: Error & { context?: unknown }): Promise<string> {
  const res = error.context instanceof Response ? error.context : null;
  if (!res) {
    // Tidak sampai ke server: fungsi belum ada / nama salah / internet
    return `Tidak bisa menghubungi fungsi "payment". Pastikan fungsi bernama persis payment sudah di-Deploy di Supabase → Edge Functions, dan internet HP aktif. (${error.message})`;
  }
  let detail = '';
  try {
    const text = await res.clone().text();
    try {
      const j = JSON.parse(text);
      detail = j.error || j.message || j.msg || j.code || text;
    } catch {
      detail = text;
    }
  } catch {}
  const code = res.status;
  const hint =
    code === 404 && !/Pesanan/.test(detail)
      ? 'Fungsi "payment" belum di-Deploy atau namanya berbeda.'
      : code === 401
        ? 'Login ditolak oleh fungsi. Buka Supabase → Edge Functions → payment → Details, matikan "Verify JWT" lalu simpan (fungsi tetap memeriksa login sendiri). Bila masih gagal, keluar lalu masuk lagi di aplikasi.'
        : code === 500 && /MIDTRANS_SERVER_KEY/.test(detail)
          ? 'Tambahkan secret MIDTRANS_SERVER_KEY di Supabase → Edge Functions → Secrets.'
          : code === 502
            ? 'Midtrans menolak. Pastikan Server Key dari lingkungan Sandbox (diawali SB-Mid-server-) dan tidak ada spasi.'
            : code === 546 || code === 503
              ? 'Fungsi error saat berjalan. Lihat Supabase → Edge Functions → payment → Logs.'
              : '';
  return [detail || error.message, hint, `(kode ${code})`].filter(Boolean).join('\n\n');
}

export async function checkPayment(bookingId: string): Promise<PaymentStatus> {
  const r = await call<{ payment_status: PaymentStatus }>({ action: 'check', booking_id: bookingId });
  return r.payment_status;
}

/** Buka halaman bayar Midtrans (QRIS, VA, e-wallet, dll). Mengembalikan status setelah halaman ditutup. */
export async function payBooking(bookingId: string): Promise<PaymentStatus> {
  if (Platform.OS === 'web') {
    // Buka tab baru langsung saat tombol diketuk agar tidak diblokir pop-up blocker
    const tab = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    try {
      const { redirect_url } = await call<{ redirect_url: string }>({ action: 'create', booking_id: bookingId });
      if (tab) tab.location.href = redirect_url;
      else window.location.href = redirect_url;
    } catch (e) {
      tab?.close();
      throw e;
    }
    // Status diperbarui otomatis (notifikasi realtime) setelah pembayaran selesai di tab itu.
    return 'menunggu';
  }
  const { redirect_url } = await call<{ redirect_url: string }>({ action: 'create', booking_id: bookingId });
  await WebBrowser.openBrowserAsync(redirect_url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    dismissButtonStyle: 'close',
  });
  return checkPayment(bookingId);
}
