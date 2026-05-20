
-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_calorie_target INTEGER,
  ADD COLUMN IF NOT EXISTS protein_target_g INTEGER,
  ADD COLUMN IF NOT EXISTS carbs_target_g INTEGER,
  ADD COLUMN IF NOT EXISTS fats_target_g INTEGER,
  ADD COLUMN IF NOT EXISTS diet_preference TEXT;

-- Meal type enum
DO $$ BEGIN
  CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- food_logs
CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type public.meal_type NOT NULL DEFAULT 'snack',
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(6,1) NOT NULL DEFAULT 0,
  fats_g NUMERIC(6,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_logs select own" ON public.food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "food_logs insert own" ON public.food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "food_logs update own" ON public.food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "food_logs delete own" ON public.food_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, date DESC);

-- water_logs
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "water_logs select own" ON public.water_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "water_logs insert own" ON public.water_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "water_logs delete own" ON public.water_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON public.water_logs(user_id, date DESC);

-- weight_logs
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weight_logs select own" ON public.weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weight_logs insert own" ON public.weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weight_logs delete own" ON public.weight_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs(user_id, date DESC);

-- personal_records
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  weight_kg NUMERIC(6,2),
  reps INTEGER,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_records select own" ON public.personal_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "personal_records insert own" ON public.personal_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personal_records delete own" ON public.personal_records FOR DELETE USING (auth.uid() = user_id);

-- weekly_insights
CREATE TABLE IF NOT EXISTS public.weekly_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
ALTER TABLE public.weekly_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly_insights select own" ON public.weekly_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weekly_insights insert own" ON public.weekly_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
