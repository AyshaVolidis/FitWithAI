CREATE POLICY "weekly_insights update own" ON public.weekly_insights FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.weekly_insights ADD CONSTRAINT weekly_insights_user_week_unique UNIQUE (user_id, week_start);