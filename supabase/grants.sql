-- Griyaku: izin akses tabel untuk aplikasi
-- Proyek Supabase baru tidak lagi otomatis memberi izin tabel ke peran "anon" dan "authenticated".
-- Jalankan sekali di SQL Editor (aman dijalankan ulang). Keamanan baris tetap dijaga oleh RLS.

grant usage on schema public to anon, authenticated;

-- Pengunjung tanpa login hanya boleh membaca iklan
grant select on public.properties to anon;

-- Pengguna yang sudah masuk
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert on public.bookings to authenticated;

-- Chat & notifikasi (jika chat.sql sudah dijalankan)
do $fn$
begin
  if to_regclass('public.conversations') is not null then
    grant select, insert on public.conversations to authenticated;
    grant select, insert, update on public.messages to authenticated;
    grant select, update, delete on public.notifications to authenticated;
    grant execute on function public.is_participant(uuid) to authenticated;
  end if;
end $fn$;
grant usage on schema public to service_role;
grant select, update on public.bookings to service_role;
grant select on public.service_prices to service_role;
grant insert on public.notifications to service_role;
