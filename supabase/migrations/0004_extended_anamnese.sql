-- Migração: anamnese expandida (PAR-Q + histórico médico + lesões + estilo de vida)
ALTER TABLE public.user_data
  ADD COLUMN IF NOT EXISTS anamnese_type text DEFAULT 'summary',
  -- PAR-Q (Prontidão para Atividade Física)
  ADD COLUMN IF NOT EXISTS par_q_heart_condition boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS par_q_chest_pain boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS par_q_dizziness boolean DEFAULT false,
  -- Histórico Médico
  ADD COLUMN IF NOT EXISTS has_chronic_conditions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS takes_continuous_medication boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS medication_name text,
  ADD COLUMN IF NOT EXISTS has_family_disease_history boolean DEFAULT false,
  -- Lesões e Dores
  ADD COLUMN IF NOT EXISTS has_past_injuries boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS injury_details text,
  ADD COLUMN IF NOT EXISTS has_joint_pain boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS joint_pain_location text,
  -- Rotina e Estilo de Vida
  ADD COLUMN IF NOT EXISTS daily_sitting_hours integer,
  ADD COLUMN IF NOT EXISTS sleep_quality text,
  ADD COLUMN IF NOT EXISTS stress_level text,
  ADD COLUMN IF NOT EXISTS smokes boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS drinks_alcohol boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_without_training text;
