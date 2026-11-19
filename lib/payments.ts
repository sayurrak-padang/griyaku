// Pembayaran pesanan jasa lewat Midtrans (Snap). Kunci rahasia Midtrans hanya ada di
// Supabase Edge Function "payment" (supabase/functions/payment), tidak pernah di aplikasi.
import * as WebBrowser from 'expo-web-browser';

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
  if (error) {
    // Ambil pesan error dari fungsi bila ada
    const ctx = (error as { context?: Response }).context;
    let msg = error.message;
    try {
      const j = ctx ? await ctx.json() : null;
      if (j?.error) msg = j.error;
    } catch {}
    if (/not found|404/i.test(msg)) msg = 'Fungsi pembayaran belum dipasang di Supabase (Edge Function "payment").';
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export async function checkPayment(bookingId: string): Promise<PaymentStatus> {
  const r = await call<{ payment_status: PaymentStatus }>({ action: 'check', booking_id: bookingId });
  return r.payment_status;
}

/** Buka halaman bayar Midtrans (QRIS, VA, e-wallet, dll). Mengembalikan status setelah halaman ditutup. */
export async function payBooking(bookingId: string): Promise<PaymentStatus> {
  const { redirect_url } = await call<{ redirect_url: string }>({ action: 'create', booking_id: bookingId });
  await WebBrowser.openBrowserAsync(redirect_url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    dismissButtonStyle: 'close',
  });
  return checkPayment(bookingId);
}
