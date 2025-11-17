import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  gender: string;
  goal: string;
  fitness_level?: string;
  weekly_frequency?: number;
  has_bariatric_surgery?: boolean;
  uses_glp1_medication?: boolean;
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
  exercises: any[];
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
  created_at?: string;
  updated_at?: string;
}
