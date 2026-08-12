-- ============================================================
-- Habitus — Supabase schema
-- Run this once in your project's SQL Editor (Supabase Dashboard
-- → SQL Editor → New query → paste this whole file → Run).
-- ============================================================

-- ---------- profiles ----------
-- One row per user, created automatically on signup (see trigger below).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  phone text,
  dob date,
  location text,
  bio text,
  height numeric,
  weight numeric,
  avatar_image text,          -- data URL for the profile photo
  theme text default 'system',
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---------- habits ----------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text default '✨',
  category text default 'Health',
  frequency text default 'Daily',
  color text default '#34d399',
  logs jsonb not null default '{}'::jsonb,   -- { "2026-08-05": true, ... }
  archived boolean not null default false,
  sort_order int not null default 0,
  started_on date not null default current_date,  -- "day 1" for this habit
  inserted_at timestamptz default now()
);

alter table public.habits enable row level security;

create policy "habits: read own" on public.habits
  for select using (auth.uid() = user_id);
create policy "habits: insert own" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "habits: update own" on public.habits
  for update using (auth.uid() = user_id);
create policy "habits: delete own" on public.habits
  for delete using (auth.uid() = user_id);


-- ---------- day_logs ----------
-- Calendar page: mood / sleep / notes per day.
create table if not exists public.day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  mood int,
  sleep numeric,
  notes text,
  unique (user_id, log_date)
);

alter table public.day_logs enable row level security;

create policy "day_logs: read own" on public.day_logs
  for select using (auth.uid() = user_id);
create policy "day_logs: insert own" on public.day_logs
  for insert with check (auth.uid() = user_id);
create policy "day_logs: update own" on public.day_logs
  for update using (auth.uid() = user_id);
create policy "day_logs: delete own" on public.day_logs
  for delete using (auth.uid() = user_id);
