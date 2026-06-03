
-- Enums
CREATE TYPE public.app_role AS ENUM ('free', 'pro');
CREATE TYPE public.fitness_goal AS ENUM ('lose_weight', 'build_muscle', 'improve_endurance', 'general_fitness', 'flexibility');
CREATE TYPE public.fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.video_phase AS ENUM ('warmup', 'main', 'cooldown');
CREATE TYPE public.session_status AS ENUM ('pending', 'in_progress', 'completed', 'partial', 'skipped');
CREATE TYPE public.difficulty_rating AS ENUM ('too_easy', 'just_right', 'too_hard');
CREATE TYPE public.chat_role AS ENUM ('user', 'assistant');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  goal public.fitness_goal,
  fitness_level public.fitness_level,
  equipment TEXT[] DEFAULT '{}',
  duration_preference INT DEFAULT 30,
  weekly_frequency INT DEFAULT 3,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Seed videos
CREATE TABLE public.seed_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  phase public.video_phase NOT NULL,
  goal_tags TEXT[] DEFAULT '{}',
  level_tags TEXT[] DEFAULT '{}',
  equipment_tags TEXT[] DEFAULT '{}',
  duration_seconds INT NOT NULL DEFAULT 300,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seed_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view seed videos" ON public.seed_videos FOR SELECT TO authenticated USING (true);

-- Workout sessions
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_level INT,
  plan_json JSONB NOT NULL,
  status public.session_status NOT NULL DEFAULT 'pending',
  rating INT CHECK (rating BETWEEN 1 AND 5),
  difficulty_rating public.difficulty_rating,
  duration_actual INT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_sessions_user_date ON public.workout_sessions(user_id, date DESC);

-- Segment feedback
CREATE TABLE public.segment_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment_index INT NOT NULL,
  video_id TEXT NOT NULL,
  skipped BOOLEAN DEFAULT false,
  watch_duration_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.segment_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feedback" ON public.segment_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON public.segment_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chat" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_chat_user_created ON public.chat_messages(user_id, created_at);

-- Daily usage tracking
CREATE TABLE public.daily_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  plans_generated INT DEFAULT 0,
  chat_messages_sent INT DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.daily_usage FOR SELECT USING (auth.uid() = user_id);

-- Profile + role auto-create trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==== End of 20260508075013_126cfb0f-9a62-4151-a03b-45489a112968.sql ====


ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- ==== End of 20260508075026_a36d89da-3707-4097-a3fe-ca1471b81665.sql ====


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

-- ==== End of 20260509081429_c5600785-cdc6-4658-a005-cbbd0be5211f.sql ====

CREATE POLICY "weekly_insights update own" ON public.weekly_insights FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.weekly_insights ADD CONSTRAINT weekly_insights_user_week_unique UNIQUE (user_id, week_start);

-- ==== End of 20260512065312_31bac840-e760-4aee-a59d-952eac683945.sql ====

UPDATE public.workout_sessions
SET plan_json = jsonb_set(
  plan_json,
  '{segments}',
  (
    SELECT jsonb_agg(
      CASE segment->>'video_id'
        WHEN 'OCrUbhLPHHs' THEN segment || jsonb_build_object(
          'title', 'Quick 5 Minute Warm Up',
          'video_id', 'oAPCPjnU1wA',
          'thumbnail', 'https://i.ytimg.com/vi/oAPCPjnU1wA/mqdefault.jpg'
        )
        WHEN 'Ohbu5PxVNVc' THEN segment || jsonb_build_object(
          'title', '5 Min Calm Cool Down Stretch',
          'video_id', 'inpok4MKVLM',
          'thumbnail', 'https://i.ytimg.com/vi/inpok4MKVLM/mqdefault.jpg'
        )
        WHEN 'SQE0r3rg40k' THEN segment || jsonb_build_object(
          'title', 'Full Body Dynamic Warm Up',
          'video_id', 'L_xrDAtykMI',
          'thumbnail', 'https://i.ytimg.com/vi/L_xrDAtykMI/mqdefault.jpg'
        )
        WHEN 'jdkv1S_7Krg' THEN segment || jsonb_build_object(
          'title', '5 Min Full Body Warm Up',
          'video_id', 'R0mMyV5OtcM',
          'thumbnail', 'https://i.ytimg.com/vi/R0mMyV5OtcM/mqdefault.jpg'
        )
        WHEN 'jpicy3wTWJg' THEN segment || jsonb_build_object(
          'title', '20 Min HIIT Workout',
          'video_id', 'ml6cT4AZdqI',
          'thumbnail', 'https://i.ytimg.com/vi/ml6cT4AZdqI/mqdefault.jpg'
        )
        WHEN 'MX_Sf48xlbg' THEN segment || jsonb_build_object(
          'title', 'Low Impact Cardio',
          'video_id', 'ZSt9tm3RoUU',
          'thumbnail', 'https://i.ytimg.com/vi/ZSt9tm3RoUU/mqdefault.jpg'
        )
        WHEN 'S1eY1ofb3ZY' THEN segment || jsonb_build_object(
          'title', 'Beginner Bodyweight Strength',
          'video_id', 'UBMk30rjy0o',
          'thumbnail', 'https://i.ytimg.com/vi/UBMk30rjy0o/mqdefault.jpg'
        )
        WHEN 'ZQbEAzU3D-A' THEN segment || jsonb_build_object(
          'title', 'Post Workout Stretch Routine',
          'video_id', '4pKly2JojMw',
          'thumbnail', 'https://i.ytimg.com/vi/4pKly2JojMw/mqdefault.jpg'
        )
        WHEN 'eml0X_1uLZo' THEN segment || jsonb_build_object(
          'title', 'Yoga Cool Down',
          'video_id', 'sTANio_2E0Q',
          'thumbnail', 'https://i.ytimg.com/vi/sTANio_2E0Q/mqdefault.jpg'
        )
        ELSE segment
      END
      ORDER BY ordinality
    )
    FROM jsonb_array_elements(plan_json->'segments') WITH ORDINALITY AS segments(segment, ordinality)
  )
)
WHERE status IN ('pending', 'in_progress')
AND plan_json->'segments' @? '$[*].video_id ? (@ == "OCrUbhLPHHs" || @ == "Ohbu5PxVNVc" || @ == "SQE0r3rg40k" || @ == "jdkv1S_7Krg" || @ == "jpicy3wTWJg" || @ == "MX_Sf48xlbg" || @ == "S1eY1ofb3ZY" || @ == "ZQbEAzU3D-A" || @ == "eml0X_1uLZo")';

DELETE FROM public.seed_videos
WHERE youtube_id IN (
  'OCrUbhLPHHs',
  'Ohbu5PxVNVc',
  'SQE0r3rg40k',
  'jdkv1S_7Krg',
  'jpicy3wTWJg',
  'MX_Sf48xlbg',
  'S1eY1ofb3ZY',
  'ZQbEAzU3D-A',
  'eml0X_1uLZo'
);

INSERT INTO public.seed_videos (youtube_id, title, phase, goal_tags, level_tags, equipment_tags, duration_seconds, thumbnail_url)
VALUES
  ('oAPCPjnU1wA', 'Quick 5 Minute Warm Up', 'warmup', ARRAY['general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/oAPCPjnU1wA/mqdefault.jpg'),
  ('L_xrDAtykMI', 'Full Body Dynamic Warm Up', 'warmup', ARRAY['general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/L_xrDAtykMI/mqdefault.jpg'),
  ('R0mMyV5OtcM', '5 Min Full Body Warm Up', 'warmup', ARRAY['general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/R0mMyV5OtcM/mqdefault.jpg'),
  ('ml6cT4AZdqI', '20 Min HIIT Workout', 'main', ARRAY['lose_weight','general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 1200, 'https://i.ytimg.com/vi/ml6cT4AZdqI/mqdefault.jpg'),
  ('ZSt9tm3RoUU', 'Low Impact Cardio', 'main', ARRAY['lose_weight','general_fitness'], ARRAY['beginner'], ARRAY['none'], 1200, 'https://i.ytimg.com/vi/ZSt9tm3RoUU/mqdefault.jpg'),
  ('UBMk30rjy0o', 'Beginner Bodyweight Strength', 'main', ARRAY['build_muscle','general_fitness'], ARRAY['beginner'], ARRAY['none'], 1500, 'https://i.ytimg.com/vi/UBMk30rjy0o/mqdefault.jpg'),
  ('4pKly2JojMw', 'Post Workout Stretch Routine', 'cooldown', ARRAY['flexibility','general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/4pKly2JojMw/mqdefault.jpg'),
  ('inpok4MKVLM', '5 Min Calm Cool Down Stretch', 'cooldown', ARRAY['flexibility','general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 300, 'https://i.ytimg.com/vi/inpok4MKVLM/mqdefault.jpg'),
  ('sTANio_2E0Q', 'Yoga Cool Down', 'cooldown', ARRAY['flexibility','general_fitness'], ARRAY['beginner','intermediate'], ARRAY['none'], 600, 'https://i.ytimg.com/vi/sTANio_2E0Q/mqdefault.jpg')
ON CONFLICT (youtube_id) DO UPDATE SET
  title = EXCLUDED.title,
  phase = EXCLUDED.phase,
  goal_tags = EXCLUDED.goal_tags,
  level_tags = EXCLUDED.level_tags,
  equipment_tags = EXCLUDED.equipment_tags,
  duration_seconds = EXCLUDED.duration_seconds,
  thumbnail_url = EXCLUDED.thumbnail_url;

-- ==== End of 20260512071621_da8de432-d9d2-441c-8b75-cee451d23988.sql ====

