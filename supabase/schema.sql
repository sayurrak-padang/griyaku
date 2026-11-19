-- Griyaku: skema database Supabase
-- Jalankan sekali di Supabase Dashboard → SQL Editor → New query → Run.

-- ============ PROFIL PENGGUNA ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profil: baca milik sendiri" on public.profiles
  for select using (auth.uid() = id);
create policy "profil: buat milik sendiri" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profil: ubah milik sendiri" on public.profiles
  for update using (auth.uid() = id);

-- ============ IKLAN PROPERTI ============
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 10 and 120),
  type text not null check (type in ('rumah','apartemen','kost','kontrakan','tanah','ruko','gudang')),
  listing text not null check (listing in ('jual','sewa')),
  price bigint not null check (price > 0),
  period text check (period in ('bulan','tahun')),
  city text not null,
  district text not null,
  bedrooms int,
  bathrooms int,
  land_area int,
  building_area int,
  certificate text,
  furnished text check (furnished in ('Tidak','Semi','Penuh')),
  kost_for text check (kost_for in ('Putra','Putri','Campur')),
  images text[] not null default '{}',
  description text not null default '',
  facilities text[] not null default '{}',
  contact_name text not null,
  contact_phone text not null,
  contact_role text not null default 'Pemilik',
  lat double precision,
  lng double precision,
  verified boolean not null default false,   -- hanya admin yang mengubah (lewat dashboard)
  is_new boolean not null default false,
  status text not null default 'aktif' check (status in ('aktif','terjual','nonaktif')),
  created_at timestamptz not null default now()
);

create index if not exists properties_search_idx on public.properties (status, listing, type, city);

alter table public.properties enable row level security;

create policy "iklan: semua orang bisa melihat iklan aktif" on public.properties
  for select using (status = 'aktif' or auth.uid() = owner_id);
create policy "iklan: pengguna masuk bisa memasang" on public.properties
  for insert with check (auth.uid() = owner_id and verified = false);
create policy "iklan: pemilik bisa mengubah" on public.properties
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id and verified = false);
create policy "iklan: pemilik bisa menghapus" on public.properties
  for delete using (auth.uid() = owner_id);

-- ============ FAVORIT ============
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  property_id text not null,  -- text agar bisa menyimpan id data contoh maupun uuid
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

alter table public.favorites enable row level security;

create policy "favorit: kelola milik sendiri" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ PESANAN JASA ============
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  service_id text not null,
  service_name text not null,
  package_name text not null,
  price bigint not null default 0,
  date date not null,
  time text not null,
  address text not null,
  note text,
  status text not null default 'Menunggu konfirmasi'
    check (status in ('Menunggu konfirmasi','Dijadwalkan','Selesai','Dibatalkan')),
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "pesanan: lihat milik sendiri" on public.bookings
  for select using (auth.uid() = user_id);
create policy "pesanan: buat milik sendiri" on public.bookings
  for insert with check (auth.uid() = user_id and status = 'Menunggu konfirmasi');

-- ============ PENYIMPANAN FOTO ============
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

create policy "foto: semua orang bisa melihat" on storage.objects
  for select using (bucket_id = 'property-photos');
create policy "foto: unggah ke folder sendiri" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "foto: hapus milik sendiri" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ IZIN TABEL ============
-- Proyek Supabase baru tidak otomatis memberi izin tabel ke anon/authenticated.
grant usage on schema public to anon, authenticated;
grant select on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert on public.bookings to authenticated;
