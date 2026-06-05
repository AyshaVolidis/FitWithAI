ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@admin.co';

ALTER TABLE public.profiles
  ADD CONSTRAINT check_role CHECK (role IN ('user', 'admin'));
