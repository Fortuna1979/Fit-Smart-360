-- Fit Smart 360º - schema inicial
-- Tabelas: user_data, scanned_equipments, workout_plans, workout_progress
-- Todas referenciam auth.users(id) e usam RLS baseado em auth.uid()

-- ============================================
-- user_data
-- ============================================
create table public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  age integer not null,
  weight numeric not null,
  height numeric not null,
  gender text not null,
  goal text not null,
  fitness_level text,
  weekly_frequency integer,
  has_bariatric_surgery boolean default false,
  uses_glp1_medication boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "user_data: owner full access"
  on public.user_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- scanned_equipments
-- ============================================
create table public.scanned_equipments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  equipment_name text not null,
  category text not null,
  muscle_groups text[] not null default '{}',
  description text,
  detected boolean not null default false,
  image_url text,
  exercises jsonb,
  tips text[],
  common_mistakes text[],
  created_at timestamptz not null default now()
);

create index scanned_equipments_user_id_idx on public.scanned_equipments (user_id);

alter table public.scanned_equipments enable row level security;

create policy "scanned_equipments: owner full access"
  on public.scanned_equipments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- workout_plans
-- ============================================
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('upper', 'lower')),
  duration text,
  exercises jsonb not null default '[]',
  equipments jsonb not null default '[]',
  workout_day integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index workout_plans_user_id_idx on public.workout_plans (user_id);

alter table public.workout_plans enable row level security;

create policy "workout_plans: owner full access"
  on public.workout_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- workout_progress
-- ============================================
create table public.workout_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  days integer not null default 0,
  achievements integer not null default 0,
  last_workout timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_progress enable row level security;

create policy "workout_progress: owner full access"
  on public.workout_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
