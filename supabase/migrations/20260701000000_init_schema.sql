-- ============================================================
-- Enum
-- ============================================================
create type track_status as enum ('pending', 'separating', 'ready', 'failed');

-- ============================================================
-- Tables
-- ============================================================

-- users: 1:1 with auth.users
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table tracks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  title       text not null,
  file_url    text not null,
  status      track_status not null default 'pending',
  duration    integer, -- seconds
  created_at  timestamptz not null default now()
);

create table stems (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid not null references tracks(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null check (type in ('vocals', 'drums', 'bass', 'other')),
  file_url    text not null,
  created_at  timestamptz not null default now()
);

create table sheets (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid not null references tracks(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create table mix_settings (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid not null references tracks(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  settings    jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

create table usage_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  action      text not null,
  tokens_used integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table users       enable row level security;
alter table tracks      enable row level security;
alter table stems       enable row level security;
alter table sheets      enable row level security;
alter table mix_settings enable row level security;
alter table usage_logs  enable row level security;

-- users
create policy "users: select own" on users
  for select using (id = auth.uid());

create policy "users: update own" on users
  for update using (id = auth.uid());

-- tracks
create policy "tracks: select own" on tracks
  for select using (user_id = auth.uid());

create policy "tracks: insert own" on tracks
  for insert with check (user_id = auth.uid());

create policy "tracks: update own" on tracks
  for update using (user_id = auth.uid());

create policy "tracks: delete own" on tracks
  for delete using (user_id = auth.uid());

-- stems
create policy "stems: select own" on stems
  for select using (user_id = auth.uid());

create policy "stems: insert own" on stems
  for insert with check (user_id = auth.uid());

create policy "stems: update own" on stems
  for update using (user_id = auth.uid());

create policy "stems: delete own" on stems
  for delete using (user_id = auth.uid());

-- sheets
create policy "sheets: select own" on sheets
  for select using (user_id = auth.uid());

create policy "sheets: insert own" on sheets
  for insert with check (user_id = auth.uid());

create policy "sheets: update own" on sheets
  for update using (user_id = auth.uid());

create policy "sheets: delete own" on sheets
  for delete using (user_id = auth.uid());

-- mix_settings
create policy "mix_settings: select own" on mix_settings
  for select using (user_id = auth.uid());

create policy "mix_settings: insert own" on mix_settings
  for insert with check (user_id = auth.uid());

create policy "mix_settings: update own" on mix_settings
  for update using (user_id = auth.uid());

create policy "mix_settings: delete own" on mix_settings
  for delete using (user_id = auth.uid());

-- usage_logs: select + insert only (no update/delete)
create policy "usage_logs: select own" on usage_logs
  for select using (user_id = auth.uid());

create policy "usage_logs: insert own" on usage_logs
  for insert with check (user_id = auth.uid());

-- ============================================================
-- Trigger: auto-create users row on auth.users signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
