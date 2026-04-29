-- Create the Phase 1 tracker table in Supabase.
-- Run this first, then run `import_phase1_data.sql`.

create extension if not exists pgcrypto;

create table if not exists public.tracker_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  week text not null,
  day text not null,
  section text not null,
  exercise text not null,
  sets integer not null default 0,
  reps text not null default '',
  weight text not null default '',
  type text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  constraint tracker_data_user_day_exercise_week_key unique (user_id, day, exercise, week)
);

create index if not exists tracker_data_user_id_idx on public.tracker_data (user_id);
create index if not exists tracker_data_day_week_idx on public.tracker_data (day, week);

alter table public.tracker_data enable row level security;

drop policy if exists "Users can access their own data" on public.tracker_data;

create policy "Users can access their own data"
on public.tracker_data
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
