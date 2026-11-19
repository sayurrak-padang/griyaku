-- Griyaku: chat & notifikasi
-- Jalankan SETELAH schema.sql, di Supabase Dashboard → SQL Editor → New query → Run.

-- ============ PERCAKAPAN ============
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  property_title text not null,
  property_image text,
  seeker_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  seeker_name text not null default '',
  owner_id uuid not null references auth.users (id) on delete cascade,
  owner_name text not null default '',
  last_message text,
  last_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (property_id, seeker_id)
);

create index if not exists conversations_seeker_idx on public.conversations (seeker_id, last_at desc);
create index if not exists conversations_owner_idx on public.conversations (owner_id, last_at desc);

alter table public.conversations enable row level security;

create policy "chat: peserta bisa melihat" on public.conversations
  for select using (auth.uid() in (seeker_id, owner_id));

-- Pencari memulai chat; owner_id harus benar-benar pemilik iklan dan bukan diri sendiri
create policy "chat: pencari bisa memulai" on public.conversations
  for insert with check (
    seeker_id = auth.uid()
    and owner_id <> auth.uid()
    and owner_id = (select p.owner_id from public.properties p where p.id = property_id)
  );

-- ============ PESAN ============
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create or replace function public.is_participant(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv and auth.uid() in (c.seeker_id, c.owner_id)
  );
$$;

create policy "pesan: peserta bisa membaca" on public.messages
  for select using (public.is_participant(conversation_id));
create policy "pesan: peserta bisa mengirim" on public.messages
  for insert with check (sender_id = auth.uid() and public.is_participant(conversation_id));
create policy "pesan: penerima bisa menandai dibaca" on public.messages
  for update using (public.is_participant(conversation_id) and sender_id <> auth.uid());

-- ============ NOTIFIKASI ============
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'info' check (kind in ('chat','pesanan','iklan','info')),
  title text not null,
  body text not null default '',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notif: lihat milik sendiri" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notif: tandai dibaca milik sendiri" on public.notifications
  for update using (auth.uid() = user_id);
create policy "notif: hapus milik sendiri" on public.notifications
  for delete using (auth.uid() = user_id);

-- ============ TRIGGER ============
-- Pesan baru: perbarui ringkasan percakapan + buat notifikasi untuk penerima
create or replace function public.on_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c public.conversations;
  receiver uuid;
  sender_name text;
begin
  select * into c from public.conversations where id = new.conversation_id;
  update public.conversations
    set last_message = left(new.body, 140), last_at = new.created_at
    where id = new.conversation_id;
  receiver := case when new.sender_id = c.seeker_id then c.owner_id else c.seeker_id end;
  sender_name := case when new.sender_id = c.seeker_id then c.seeker_name else c.owner_name end;
  insert into public.notifications (user_id, kind, title, body, link)
  values (receiver, 'chat', coalesce(nullif(sender_name, ''), 'Pesan baru') || ' · ' || c.property_title,
          left(new.body, 140), '/chat/' || c.id);
  return new;
end $$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.on_new_message();

-- Pesanan jasa baru: notifikasi konfirmasi untuk pemesan
create or replace function public.on_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, title, body, link)
  values (new.user_id, 'pesanan', 'Pesanan ' || new.service_name || ' diterima',
          'Jadwal ' || to_char(new.date, 'DD-MM-YYYY') || ' pukul ' || new.time || '. Kami akan menghubungi Anda untuk konfirmasi.',
          '/pesanan');
  return new;
end $$;

drop trigger if exists bookings_after_insert on public.bookings;
create trigger bookings_after_insert after insert on public.bookings
  for each row execute function public.on_new_booking();

-- Status pesanan berubah (diubah admin di dashboard): beri tahu pemesan
create or replace function public.on_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, kind, title, body, link)
    values (new.user_id, 'pesanan', 'Pesanan ' || new.service_name || ': ' || new.status,
            'Jadwal ' || to_char(new.date, 'DD-MM-YYYY') || ' pukul ' || new.time, '/pesanan');
  end if;
  return new;
end $$;

drop trigger if exists bookings_after_update on public.bookings;
create trigger bookings_after_update after update on public.bookings
  for each row execute function public.on_booking_status();

-- ============ REALTIME ============
do $$
begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.conversations; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
end $$;
