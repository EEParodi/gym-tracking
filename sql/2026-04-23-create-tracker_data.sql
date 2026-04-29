-- Supabase/Postgres migration: create tracker_data table
CREATE TABLE IF NOT EXISTS tracker_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Per-user, per-key uniqueness (per-week data will be stored as part of the key, e.g. key = 'Day 1||Back Squat||W1')
CREATE UNIQUE INDEX IF NOT EXISTS tracker_data_user_key_idx ON tracker_data (user_id, key);

-- Optional: enable row-level security and a basic policy (to be refined per environment)
-- ALTER TABLE tracker_data ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can access their own data" ON tracker_data FOR ALL USING (auth.uid() = user_id);
