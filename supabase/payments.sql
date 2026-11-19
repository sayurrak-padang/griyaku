-- Griyaku: pembayaran pesanan jasa (Midtrans, mode sandbox)
-- Jalankan SETELAH schema.sql, chat.sql, grants.sql, dan admin.sql. Aman dijalankan ulang.

-- ============ DAFTAR HARGA (sumber harga yang dipercaya server) ============
-- Harga di aplikasi bisa diakali, jadi harga pesanan selalu dihitung ulang dari tabel ini.
create table if not exists public.service_prices (
  service_id text not null,
  service_name text not null,
  package_name text not null,
  price bigint not null check (price >= 0),
  primary key (service_id, package_name)
);

alter table public.service_prices enable row level security;
drop policy if exists "harga: semua orang bisa melihat" on public.service_prices;
create policy "harga: semua orang bisa melihat" on public.service_prices for select using (true);
drop policy if exists "harga: admin kelola" on public.service_prices;
create policy "harga: admin kelola" on public.service_prices
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.service_prices (service_id, service_name, package_name, price) values
  ('s1', 'Bersih Rumah Harian', '2 jam (1 petugas)', 120000),
  ('s1', 'Bersih Rumah Harian', '3 jam (1 petugas)', 165000),
  ('s1', 'Bersih Rumah Harian', '4 jam (2 petugas)', 310000),
  ('s2', 'Deep Cleaning', 'Kamar mandi', 180000),
  ('s2', 'Deep Cleaning', 'Dapur', 250000),
  ('s2', 'Deep Cleaning', 'Satu rumah (≤ 70 m²)', 650000),
  ('s3', 'Cuci Kasur & Sofa', 'Kasur single', 150000),
  ('s3', 'Cuci Kasur & Sofa', 'Kasur queen/king', 220000),
  ('s3', 'Cuci Kasur & Sofa', 'Sofa per dudukan', 70000),
  ('s4', 'Cuci & Servis AC', 'Cuci AC 0,5 - 1 PK', 85000),
  ('s4', 'Cuci & Servis AC', 'Cuci AC 1,5 - 2 PK', 110000),
  ('s4', 'Cuci & Servis AC', 'Tambah freon', 175000),
  ('s4', 'Cuci & Servis AC', 'Bongkar pasang AC', 350000),
  ('s5', 'Servis Elektronik', 'Cek & diagnosa', 75000),
  ('s5', 'Servis Elektronik', 'Servis mesin cuci', 180000),
  ('s5', 'Servis Elektronik', 'Servis kulkas', 200000),
  ('s6', 'Tukang Ledeng', 'Perbaikan ringan', 125000),
  ('s6', 'Tukang Ledeng', 'Saluran mampet', 200000),
  ('s6', 'Tukang Ledeng', 'Servis pompa air', 225000),
  ('s7', 'Tukang Listrik', 'Pasang lampu/stop kontak', 90000),
  ('s7', 'Tukang Listrik', 'Cek korsleting', 175000),
  ('s8', 'Renovasi & Interior', 'Survei & konsultasi', 0),
  ('s8', 'Renovasi & Interior', 'Kitchen set (per meter)', 2750000),
  ('s8', 'Renovasi & Interior', 'Pengecatan (per m²)', 35000),
  ('s9', 'Jasa Pindahan', 'Pick-up + 2 kru', 450000),
  ('s9', 'Jasa Pindahan', 'Engkel box + 3 kru', 1100000),
  ('s10', 'Basmi Hama', 'Semprot kecoak & semut', 300000),
  ('s10', 'Basmi Hama', 'Anti rayap', 1500000),
  ('s11', 'Perawatan Taman', 'Pangkas rumput (≤ 50 m²)', 150000),
  ('s11', 'Perawatan Taman', 'Perawatan bulanan', 500000),
  ('s12', 'Sedot WC', 'Sedot septic tank', 450000)
on conflict (service_id, package_name) do update
  set service_name = excluded.service_name, price = excluded.price;

-- Biaya layanan per pesanan berbayar (samakan dengan ADMIN_FEE di app/service/[id].tsx)
create or replace function public.booking_fee() returns bigint language sql immutable as $fn$ select 5000::bigint $fn$;

-- ============ KOLOM PEMBAYARAN DI PESANAN ============
alter table public.bookings add column if not exists payment_status text not null default 'belum_bayar';
alter table public.bookings drop constraint if exists bookings_payment_status_check;
alter table public.bookings add constraint bookings_payment_status_check
  check (payment_status in ('belum_bayar','menunggu','lunas','gagal','kedaluwarsa','dikembalikan'));
alter table public.bookings add column if not exists payment_method text;
alter table public.bookings add column if not exists payment_order_id text;
alter table public.bookings add column if not exists payment_url text;
alter table public.bookings add column if not exists paid_at timestamptz;

create unique index if not exists bookings_payment_order_idx on public.bookings (payment_order_id) where payment_order_id is not null;

-- Pesanan baru: harga dihitung server, kolom pembayaran tidak bisa diisi dari aplikasi
create or replace function public.bookings_guard()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare
  base bigint;
begin
  select price into base from public.service_prices
    where service_id = new.service_id and package_name = new.package_name;
  if base is null then
    raise exception 'Paket % untuk layanan % tidak dikenal', new.package_name, new.service_id;
  end if;
  new.price := case when base > 0 then base + public.booking_fee() else 0 end;
  new.payment_status := 'belum_bayar';
  new.payment_method := null;
  new.payment_order_id := null;
  new.payment_url := null;
  new.paid_at := null;
  return new;
end $fn$;

drop trigger if exists bookings_guard on public.bookings;
create trigger bookings_guard before insert on public.bookings
  for each row execute function public.bookings_guard();

-- Notifikasi saat status pembayaran berubah
create or replace function public.on_booking_payment()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.payment_status is distinct from old.payment_status then
    if new.payment_status = 'lunas' then
      insert into public.notifications (user_id, kind, title, body, link)
      values (new.user_id, 'pesanan', 'Pembayaran diterima',
              'Pembayaran ' || new.service_name || ' sebesar Rp ' || to_char(new.price, 'FM999G999G999') || ' berhasil.', '/pesanan');
    elsif new.payment_status in ('gagal','kedaluwarsa') then
      insert into public.notifications (user_id, kind, title, body, link)
      values (new.user_id, 'pesanan', 'Pembayaran ' || new.payment_status,
              'Pembayaran ' || new.service_name || ' belum berhasil. Anda bisa mencoba bayar lagi.', '/pesanan');
    end if;
  end if;
  return new;
end $fn$;

drop trigger if exists bookings_after_payment on public.bookings;
create trigger bookings_after_payment after update on public.bookings
  for each row execute function public.on_booking_payment();

-- ============ IZIN TABEL ============
grant select on public.service_prices to anon, authenticated;
grant insert, update, delete on public.service_prices to authenticated;
