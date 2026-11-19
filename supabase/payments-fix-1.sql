-- Griyaku: perbaikan pembayaran "Pesanan tidak ditemukan" (kode 404)
-- Edge Function berjalan sebagai service_role, yang di proyek Supabase baru belum diberi izin tabel.
grant usage on schema public to service_role;
grant select, update on public.bookings to service_role;
grant select on public.service_prices to service_role;
grant insert on public.notifications to service_role;
