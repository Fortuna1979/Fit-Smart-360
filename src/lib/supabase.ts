import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { FitnessLevel, Gender, Goal, SubscriptionPlan } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cliente Supabase lazy (criado apenas quando necessário)
let supabaseInstance: SupabaseClient | null = null;

// Função para obter o cliente Supabase
export const getSupabaseClient = (): SupabaseClient | null => {
  // Se já existe instância, retornar
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Verificar se as variáveis estão configuradas
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
    console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas!');
    console.warn('Configure em: Configurações do Projeto → Integrações → Supabase');
    return null;
  }

  // Criar cliente apenas se as variáveis estiverem válidas
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error);
    return null;
  }
};

// Export para compatibilidade com código existente
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      // Retornar função mock que não faz nada
      return () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop];
  }
});

// Tipos para o banco de dados
export interface UserData {
  id?: string;
  user_id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  goal: Goal;
  fitness_level?: FitnessLevel;
  weekly_frequency?: number;
  has_bariatric_surgery?: boolean;
  uses_glp1_medication?: boolean;
  health_data_consent_at?: string;
  subscription_plan?: SubscriptionPlan;
  // Anamnese expandida
  anamnese_type?: 'summary' | 'full';
  // PAR-Q
  par_q_heart_condition?: boolean;
  par_q_chest_pain?: boolean;
  par_q_dizziness?: boolean;
  // Histórico médico
  has_chronic_conditions?: boolean;
  takes_continuous_medication?: boolean;
  medication_name?: string;
  has_family_disease_history?: boolean;
  // Lesões
  has_past_injuries?: boolean;
  injury_details?: string;
  has_joint_pain?: boolean;
  joint_pain_location?: string;
  // Estilo de vida
  daily_sitting_hours?: number;
  sleep_quality?: string;
  stress_level?: string;
  smokes?: boolean;
  drinks_alcohol?: boolean;
  time_without_training?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Equipment {
  id?: string;
  user_id: string;
  equipment_name: string;
  category: string;
  muscle_groups: string[];
  description: string;
  detected: boolean;
  image_url?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exercises?: any[];
  tips?: string[];
  common_mistakes?: string[];
  created_at?: string;
}

export interface WorkoutPlan {
  id?: string;
  user_id: string;
  name: string;
  type: 'upper' | 'lower';
  duration: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exercises: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipments: any[];
  workout_day: number;
  is_active?: boolean;
  created_at?: string;
}

export interface WorkoutProgress {
  id?: string;
  user_id: string;
  days: number;
  achievements: number;
  last_workout?: string;
  streak_current?: number;
  streak_best?: number;
  total_minutes?: number;
  workout_history?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface NutritionPlan {
  id?: string;
  user_id: string;
  budget_level: string;
  dietary_restrictions: string[];
  meal_frequency: number;
  daily_calories?: number;
  plan: Record<string, unknown>;
  created_at?: string;
}

export interface HydrationLog {
  id?: string;
  user_id: string;
  date: string;
  glasses_drunk: number;
  daily_goal_glasses: number;
  reminder_interval_hours: number;
  reminders_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}
