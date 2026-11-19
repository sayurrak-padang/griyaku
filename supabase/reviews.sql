-- Griyaku: ulasan & rating untuk properti dan jasa
-- Jalankan SETELAH schema.sql, chat.sql, grants.sql, dan admin.sql. Aman dijalankan ulang.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('property','service')),
  target_id text not null,           -- text agar bisa id data contoh maupun uuid
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  user_name text not null default '',
  rating int not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  hidden boolean not null default false,  -- disembunyikan admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_type, target_id, user_id)
);

create index if not exists reviews_target_idx on public.reviews (target_type, target_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "ulasan: semua orang bisa melihat" on public.reviews;
create policy "ulasan: semua orang bisa melihat" on public.reviews
  for select using (not hidden or auth.uid() = user_id or public.is_admin());

-- Pengguna masuk & tidak diblokir; tidak boleh mengulas iklannya sendiri
drop policy if exists "ulasan: pengguna bisa menulis" on public.reviews;
create policy "ulasan: pengguna bisa menulis" on public.reviews
  for insert with check (
    user_id = auth.uid() and hidden = false and not public.is_banned()
    and not exists (
      select 1 from public.properties p
      where target_type = 'property' and p.id::text = target_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "ulasan: penulis bisa mengubah" on public.reviews;
create policy "ulasan: penulis bisa mengubah" on public.reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid() and not public.is_banned());

drop policy if exists "ulasan: penulis atau admin bisa menghapus" on public.reviews;
create policy "ulasan: penulis atau admin bisa menghapus" on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ulasan: admin kelola" on public.reviews;
create policy "ulasan: admin kelola" on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());

-- Penulis tidak bisa mengubah status sembunyi; nama diambil dari profil
create or replace function public.reviews_guard()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    new.hidden := false;
  elsif auth.uid() is not null and not public.is_admin() then
    new.hidden := old.hidden;
  end if;
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.target_type := old.target_type;
    new.target_id := old.target_id;
  end if;
  select coalesce(nullif(name, ''), 'Pengguna') into new.user_name from public.profiles where id = new.user_id;
  new.user_name := coalesce(new.user_name, 'Pengguna');
  new.updated_at := now();
  return new;
end $fn$;

drop trigger if exists reviews_guard on public.reviews;
create trigger reviews_guard before insert or update on public.reviews
  for each row execute function public.reviews_guard();

-- Beri tahu pemilik iklan saat ada ulasan baru
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('chat','pesanan','iklan','info','ulasan'));

create or replace function public.on_new_review()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare
  prop public.properties;
begin
  if new.target_type = 'property' then
    select * into prop from public.properties where id::text = new.target_id;
    if prop.owner_id is not null and prop.owner_id <> new.user_id then
      insert into public.notifications (user_id, kind, title, body, link)
      values (prop.owner_id, 'ulasan', 'Ulasan baru ' || repeat('★', new.rating),
              new.user_name || ' tentang "' || prop.title || '"' ||
              case when new.comment <> '' then ': ' || left(new.comment, 120) else '' end,
              '/property/' || prop.id);
    end if;
  end if;
  return new;
end $fn$;

drop trigger if exists reviews_after_insert on public.reviews;
create trigger reviews_after_insert after insert on public.reviews
  for each row execute function public.on_new_review();

-- ============ IZIN TABEL ============
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
