import { getSupabaseClient, UserData, Equipment, WorkoutPlan, WorkoutProgress } from './supabase';

// Gerar ID único para o usuário (baseado em fingerprint do navegador)
export const getUserId = (): string => {
  let userId = localStorage.getItem('app_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('app_user_id', userId);
  }
  return userId;
};

// Verificar se Supabase está configurado
const isSupabaseConfigured = (): boolean => {
  return getSupabaseClient() !== null;
};

// ============================================
// FUNÇÕES PARA USER DATA
// ============================================

export const saveUserData = async (userData: Omit<UserData, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado. Dados não salvos.');
    return null;
  }

  const userId = getUserId();
  
  try {
    // Verificar se usuário já existe
    const { data: existing } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Atualizar
      const { data, error } = await supabase
        .from('user_data')
        .update({ ...userData, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Inserir
      const { data, error } = await supabase
        .from('user_data')
        .insert([{ ...userData, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Erro ao salvar dados do usuário:', error);
    throw error;
  }
};

export const getUserData = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado.');
    return null;
  }

  const userId = getUserId();
  
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    return null;
  }
};

// ============================================
// FUNÇÕES PARA EQUIPAMENTOS
// ============================================

export const saveEquipment = async (equipment: Omit<Equipment, 'id' | 'user_id' | 'created_at'>) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado. Equipamento não salvo.');
    return null;
  }

  const userId = getUserId();
  
  try {
    const { data, error } = await supabase
      .from('scanned_equipments')
      .insert([{ ...equipment, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao salvar equipamento:', error);
    throw error;
  }
};

export const getEquipments = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado.');
    return [];
  }

  const userId = getUserId();
  
  try {
    const { data, error } = await supabase
      .from('scanned_equipments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar equipamentos:', error);
    return [];
  }
};

export const deleteEquipment = async (equipmentId: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado.');
    return;
  }

  try {
    const { error } = await supabase
      .from('scanned_equipments')
      .delete()
      .eq('id', equipmentId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar equipamento:', error);
    throw error;
  }
};

// ============================================
// FUNÇÕES PARA WORKOUT PLANS
// ============================================

export const saveWorkoutPlan = async (workout: Omit<WorkoutPlan, 'id' | 'user_id' | 'created_at'>) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado. Plano de treino não salvo.');
    return null;
  }

  const userId = getUserId();
  
  try {
    // Desativar outros treinos ativos
    if (workout.is_active) {
      await supabase
        .from('workout_plans')
        .update({ is_active: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .insert([{ ...workout, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao salvar plano de treino:', error);
    throw error;
  }
};

export const getActiveWorkout = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado.');
    return null;
  }

  const userId = getUserId();
  
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Erro ao carregar treino ativo:', error);
    return null;
  }
};

export const getCurrentWorkout = async (workoutDay: number) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado.');
    return null;
  }

  const userId = getUserId();
  
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('workout_day', workoutDay)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Erro ao carregar treino do dia:', error);
    return null;
  }
};

export const updateWorkoutDay = async (workoutDay: number) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado.');
    // Salvar apenas no localStorage
    localStorage.setItem('workout_day', workoutDay.toString());
    return null;
  }

  const userId = getUserId();
  
  try {
    // Salvar no localStorage para acesso rápido
    localStorage.setItem('workout_day', workoutDay.toString());
    
    // Atualizar no Supabase
    const { data, error } = await supabase
      .from('workout_plans')
      .update({ workout_day: workoutDay })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar dia do treino:', error);
    throw error;
  }
};

// ============================================
// FUNÇÕES PARA PROGRESSO
// ============================================

export const saveWorkoutProgress = async (progress: Omit<WorkoutProgress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado. Progresso não salvo.');
    return null;
  }

  const userId = getUserId();
  
  try {
    // Verificar se progresso já existe
    const { data: existing } = await supabase
      .from('workout_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Atualizar
      const { data, error } = await supabase
        .from('workout_progress')
        .update({ 
          ...progress, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Inserir
      const { data, error } = await supabase
        .from('workout_progress')
        .insert([{ ...progress, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
    throw error;
  }
};

export const getWorkoutProgress = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado.');
    return { days: 0, achievements: 0 };
  }

  const userId = getUserId();
  
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || { days: 0, achievements: 0 };
  } catch (error) {
    console.error('Erro ao carregar progresso:', error);
    return { days: 0, achievements: 0 };
  }
};

export const incrementWorkoutProgress = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase não configurado. Progresso não incrementado.');
    return null;
  }

  const userId = getUserId();
  
  try {
    const current = await getWorkoutProgress();
    
    const newProgress = {
      days: (current?.days || 0) + 1,
      achievements: (current?.achievements || 0) + 1,
      last_workout: new Date().toISOString()
    };

    return await saveWorkoutProgress(newProgress);
  } catch (error) {
    console.error('Erro ao incrementar progresso:', error);
    throw error;
  }
};

// ============================================
// LIMPEZA DO LOCALSTORAGE
// ============================================

export const clearLocalStorage = () => {
  try {
    // Limpar TODOS os dados do localStorage para evitar QuotaExceededError
    localStorage.clear();
    console.log('✅ localStorage limpo com sucesso');
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
  }
};
