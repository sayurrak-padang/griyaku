-- Griyaku: panel admin
-- Jalankan SETELAH schema.sql, chat.sql, dan grants.sql. Aman dijalankan ulang.

-- ============ PROFIL: peran, blokir, email ============
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles add column if not exists email text;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user','admin'));

-- isi email dari akun login
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_banned()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and banned);
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_banned() to authenticated;

-- Pengguna biasa tidak bisa mengubah peran/blokir dirinya sendiri; email selalu dari akun login
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.role := 'user';
    new.banned := false;
  elsif auth.uid() is not null and not public.is_admin() then
    -- permintaan dari aplikasi oleh non-admin (SQL Editor tidak punya auth.uid(), jadi tetap bisa)
    new.role := old.role;
    new.banned := old.banned;
  end if;
  select email into new.email from auth.users where id = new.id;
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.profiles_guard();

drop policy if exists "profil: admin lihat semua" on public.profiles;
create policy "profil: admin lihat semua" on public.profiles
  for select using (public.is_admin());
drop policy if exists "profil: admin ubah semua" on public.profiles;
create policy "profil: admin ubah semua" on public.profiles
  for update using (public.is_admin());

-- ============ IKLAN: moderasi ============
alter table public.properties add column if not exists reject_reason text;
alter table public.properties drop constraint if exists properties_status_check;
alter table public.properties add constraint properties_status_check
  check (status in ('menunggu','aktif','ditolak','terjual','nonaktif'));
alter table public.properties alter column status set default 'menunggu';

drop policy if exists "iklan: semua orang bisa melihat iklan aktif" on public.properties;
create policy "iklan: semua orang bisa melihat iklan aktif" on public.properties
  for select using (status = 'aktif' or auth.uid() = owner_id or public.is_admin());

-- Iklan baru selalu menunggu persetujuan; pengguna yang diblokir tidak bisa memasang
drop policy if exists "iklan: pengguna masuk bisa memasang" on public.properties;
create policy "iklan: pengguna masuk bisa memasang" on public.properties
  for insert with check (
    auth.uid() = owner_id and verified = false and status = 'menunggu' and not public.is_banned()
  );

-- Pemilik boleh menandai terjual/nonaktif, tapi tidak bisa menyetujui sendiri
drop policy if exists "iklan: pemilik bisa mengubah" on public.properties;
create policy "iklan: pemilik bisa mengubah" on public.properties
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and verified = false and status in ('menunggu','terjual','nonaktif'));

drop policy if exists "iklan: admin kelola semua" on public.properties;
create policy "iklan: admin kelola semua" on public.properties
  for all using (public.is_admin()) with check (public.is_admin());

-- Beri tahu pemilik saat iklan disetujui / ditolak
create or replace function public.on_property_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.owner_id is not null then
    if new.status = 'aktif' then
      insert into public.notifications (user_id, kind, title, body, link)
      values (new.owner_id, 'iklan', 'Iklan disetujui', '"' || new.title || '" sekarang tayang di Griyaku.', '/property/' || new.id);
    elsif new.status = 'ditolak' then
      insert into public.notifications (user_id, kind, title, body, link)
      values (new.owner_id, 'iklan', 'Iklan ditolak',
              '"' || new.title || '": ' || coalesce(nullif(new.reject_reason, ''), 'tidak memenuhi ketentuan.'), '/iklan-saya');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists properties_after_status on public.properties;
create trigger properties_after_status after update on public.properties
  for each row execute function public.on_property_status();

-- ============ PESANAN JASA: admin ============
drop policy if exists "pesanan: admin lihat semua" on public.bookings;
create policy "pesanan: admin lihat semua" on public.bookings
  for select using (public.is_admin());
drop policy if exists "pesanan: admin ubah status" on public.bookings;
create policy "pesanan: admin ubah status" on public.bookings
  for update using (public.is_admin()) with check (public.is_admin());

-- ============ CHAT: pengguna diblokir tidak bisa mengirim ============
drop policy if exists "pesan: peserta bisa mengirim" on public.messages;
create policy "pesan: peserta bisa mengirim" on public.messages
  for insert with check (sender_id = auth.uid() and public.is_participant(conversation_id) and not public.is_banned());

-- ============ IZIN TABEL ============
grant update on public.bookings to authenticated;
grant select, update on public.profiles to authenticated;

-- ============ JADIKAN AKUN ANDA ADMIN ============
-- 1) Daftar/masuk dulu di aplikasi dengan email Anda.
-- 2) Ganti email di bawah, hapus tanda "--" di depannya, lalu Run baris itu saja:
-- update public.profiles set role = 'admin' where email = 'email-anda@contoh.com';
--
-- Catatan: trigger di atas mencegah non-admin mengubah peran dari aplikasi,
-- sedangkan SQL Editor (tanpa login aplikasi) tetap bisa mengubahnya.
