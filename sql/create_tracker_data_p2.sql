-- Create the Phase 2 tracker table in Supabase.
-- Phase 2 adds RPE field support.

create extension if not exists pgcrypto;

create table if not exists public.tracker_data_p2 (
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
  rpe numeric(3,1),  -- Phase 2: supports decimals (e.g., 8.5)
  type text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  constraint tracker_data_p2_user_day_exercise_week_key unique (user_id, day, exercise, week)
);

create index if not exists tracker_data_p2_user_id_idx on public.tracker_data_p2 (user_id);
create index if not exists tracker_data_p2_day_week_idx on public.tracker_data_p2 (day, week);

alter table public.tracker_data_p2 enable row level security;

drop policy if exists "Users can access their own data_p2" on public.tracker_data_p2;

create policy "Users can access their own data_p2"
on public.tracker_data_p2
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);