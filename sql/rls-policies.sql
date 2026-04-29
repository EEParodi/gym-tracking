-- Row-Level Security policies for tracker_data
ALTER TABLE public.tracker_data ENABLE ROW LEVEL SECURITY;

-- Users can access their own data only
CREATE POLICY IF NOT EXISTS "Users can access their own data" ON public.tracker_data
FOR ALL USING (auth.uid() = user_id);
