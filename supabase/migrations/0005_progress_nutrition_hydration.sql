-- Migração: progresso estendido + nutrição + hidratação

-- Estender workout_progress com histórico e sequências
ALTER TABLE public.workout_progress
  ADD COLUMN IF NOT EXISTS streak_current integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_best integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS workout_history jsonb DEFAULT '[]'::jsonb;

-- Planos nutricionais
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_level text NOT NULL,
  dietary_restrictions text[] DEFAULT '{}',
  meal_frequency integer DEFAULT 4,
  daily_calories integer,
  plan jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nutrition_own" ON public.nutrition_plans;
CREATE POLICY "nutrition_own" ON public.nutrition_plans FOR ALL USING (auth.uid() = user_id);

-- Registro de hidratação diária
CREATE TABLE IF NOT EXISTS public.hydration_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  glasses_drunk integer DEFAULT 0,
  daily_goal_glasses integer DEFAULT 8,
  reminder_interval_hours integer DEFAULT 2,
  reminders_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hydration_own" ON public.hydration_logs;
CREATE POLICY "hydration_own" ON public.hydration_logs FOR ALL USING (auth.uid() = user_id);
