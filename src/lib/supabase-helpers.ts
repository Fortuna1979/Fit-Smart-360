import { getSupabaseClient, UserData, Equipment, WorkoutPlan, WorkoutProgress, NutritionPlan, HydrationLog, UserAchievement, ActivityFeed, Territory } from './supabase';
import { ACHIEVEMENTS } from './achievements';

function calculateStreaks(history: string[]): { streakCurrent: number; streakBest: number } {
  if (!history.length) return { streakCurrent: 0, streakBest: 0 };
  const sorted = [...new Set(history)].sort();
  let streakBest = 0, current = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) { current = 1; }
    else {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
      current = diff === 1 ? current + 1 : 1;
    }
    streakBest = Math.max(streakBest, current);
  }
  const last = new Date(sorted[sorted.length - 1]); last.setHours(0,0,0,0);
  const yday = new Date(); yday.setHours(0,0,0,0); yday.setDate(yday.getDate() - 1);
  const streakCurrent = last.getTime() >= yday.getTime() ? current : 0;
  return { streakCurrent, streakBest };
}

// Obter o ID do usuário autenticado no Supabase (auth.uid())
export const getUserId = async (): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado. Dados não salvos.');
    return null;
  }

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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado.');
    return null;
  }

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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado. Equipamento não salvo.');
    return null;
  }

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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado.');
    return [];
  }

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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado. Plano de treino não salvo.');
    return null;
  }

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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado.');
    return null;
  }

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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado.');
    return null;
  }

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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado.');
    return null;
  }

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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado. Progresso não salvo.');
    return null;
  }

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

  const userId = await getUserId();
  if (!userId) {
    console.warn('Usuário não autenticado.');
    return { days: 0, achievements: 0 };
  }

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
  if (!supabase) return null;
  try {
    const current = await getWorkoutProgress();
    const today = new Date().toISOString().split('T')[0];
    const history: string[] = current?.workout_history || [];
    if (!history.includes(today)) history.push(today);
    const { streakCurrent, streakBest } = calculateStreaks(history);
    return await saveWorkoutProgress({
      days: history.length,
      achievements: (current?.achievements || 0) + 1,
      last_workout: new Date().toISOString(),
      workout_history: history,
      streak_current: streakCurrent,
      streak_best: Math.max(streakBest, current?.streak_best || 0),
    });
  } catch (error) {
    console.error('Erro ao incrementar progresso:', error);
    throw error;
  }
};

// ============================================
// NUTRIÇÃO
// ============================================

export const saveNutritionPlan = async (plan: Omit<NutritionPlan, 'id' | 'user_id' | 'created_at'>) => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const userId = await getUserId();
  if (!userId) return null;
  try {
    // Remove plano anterior e insere novo
    await supabase.from('nutrition_plans').delete().eq('user_id', userId);
    const { data, error } = await supabase.from('nutrition_plans')
      .insert([{ ...plan, user_id: userId }]).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao salvar plano nutricional:', error);
    throw error;
  }
};

export const getNutritionPlan = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const userId = await getUserId();
  if (!userId) return null;
  try {
    const { data, error } = await supabase.from('nutrition_plans')
      .select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar plano nutricional:', error);
    return null;
  }
};

// ============================================
// HIDRATAÇÃO
// ============================================

export const getHydrationLog = async (date?: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const userId = await getUserId();
  if (!userId) return null;
  const today = date || new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await supabase.from('hydration_logs')
      .select('*').eq('user_id', userId).eq('date', today).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as HydrationLog | null;
  } catch (error) {
    console.error('Erro ao buscar hidratação:', error);
    return null;
  }
};

export const upsertHydrationLog = async (updates: Partial<HydrationLog>, date?: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const userId = await getUserId();
  if (!userId) return null;
  const today = date || new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await supabase.from('hydration_logs')
      .upsert({ user_id: userId, date: today, ...updates, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }).select().single();
    if (error) throw error;
    return data as HydrationLog;
  } catch (error) {
    console.error('Erro ao salvar hidratação:', error);
    throw error;
  }
};

// ============================================
// CONQUISTAS (ACHIEVEMENTS)
// ============================================

export const getUserAchievements = async (): Promise<UserAchievement[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const userId = await getUserId();
  if (!userId) return [];
  try {
    const { data } = await supabase.from('user_achievements').select('*').eq('user_id', userId);
    return (data || []) as UserAchievement[];
  } catch { return []; }
};

export const awardAchievement = async (achievementKey: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const userId = await getUserId();
  if (!userId) return;
  try {
    await supabase.from('user_achievements')
      .upsert({ user_id: userId, achievement_key: achievementKey }, { onConflict: 'user_id,achievement_key', ignoreDuplicates: true });
  } catch { /* ignore duplicates */ }
};

export const checkAndAwardAchievements = async (
  progress: { days?: number; streak_current?: number; territory_count?: number; has_calistenia?: boolean }
): Promise<string[]> => {
  const earned = await getUserAchievements();
  const earnedKeys = new Set(earned.map(a => a.achievement_key));
  const newAchievements: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (earnedKeys.has(ach.key)) continue;
    const unlocked = (() => {
      switch (ach.key) {
        case 'primeiro_treino': return (progress.days || 0) >= 1;
        case 'calistenia_master': return progress.has_calistenia === true;
        case 'tres_consecutivos': return (progress.streak_current || 0) >= 3;
        case 'sete_consecutivos': return (progress.streak_current || 0) >= 7;
        case 'dez_treinos': return (progress.days || 0) >= 10;
        case 'trinta_treinos': return (progress.days || 0) >= 30;
        case 'cinquenta_treinos': return (progress.days || 0) >= 50;
        case 'cem_treinos': return (progress.days || 0) >= 100;
        case 'primeiro_territorio': return (progress.territory_count || 0) >= 1;
        case 'cinco_territorios': return (progress.territory_count || 0) >= 5;
        case 'vinte_territorios': return (progress.territory_count || 0) >= 20;
        default: return false;
      }
    })();
    if (unlocked) {
      await awardAchievement(ach.key);
      newAchievements.push(ach.key);
    }
  }
  return newAchievements;
};

// ============================================
// SOCIAL FEED
// ============================================

export const postToFeed = async (
  workoutName: string, exercisesCount: number, duration: string, workoutType = 'equipment'
): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const userId = await getUserId();
  if (!userId) return;
  try {
    const userData = await getUserData();
    if (!userData?.public_profile) return;
    const name = userData.username || userData.name || 'Atleta';
    await supabase.from('activity_feed').insert([{
      user_id: userId, user_name: name, workout_name: workoutName,
      exercises_count: exercisesCount, duration, workout_type: workoutType,
    }]);
  } catch { /* feed post is non-critical */ }
};

export const getSocialFeed = async (limit = 30): Promise<ActivityFeed[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const userId = await getUserId();
  try {
    const { data: feed } = await supabase
      .from('activity_feed').select('*')
      .order('created_at', { ascending: false }).limit(limit);
    if (!feed) return [];

    const activityIds = feed.map(f => f.id);
    const { data: kudos } = await supabase.from('kudos').select('activity_id, user_id').in('activity_id', activityIds);
    const kudosMap: Record<string, { count: number; hasKudos: boolean }> = {};
    for (const k of (kudos || [])) {
      if (!kudosMap[k.activity_id]) kudosMap[k.activity_id] = { count: 0, hasKudos: false };
      kudosMap[k.activity_id].count++;
      if (k.user_id === userId) kudosMap[k.activity_id].hasKudos = true;
    }

    return feed.map(f => ({
      ...f,
      kudos_count: kudosMap[f.id]?.count || 0,
      user_has_kudos: kudosMap[f.id]?.hasKudos || false,
    })) as ActivityFeed[];
  } catch { return []; }
};

export const toggleKudos = async (activityId: string, currentlyHasKudos: boolean): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const userId = await getUserId();
  if (!userId) return;
  try {
    if (currentlyHasKudos) {
      await supabase.from('kudos').delete().eq('activity_id', activityId).eq('user_id', userId);
    } else {
      await supabase.from('kudos').upsert({ activity_id: activityId, user_id: userId }, { onConflict: 'activity_id,user_id', ignoreDuplicates: true });
    }
  } catch { /* ignore */ }
};

export const updatePublicProfile = async (isPublic: boolean, username: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const userId = await getUserId();
  if (!userId) return;
  try {
    await supabase.from('user_data').update({ public_profile: isPublic, username }).eq('user_id', userId);
  } catch { /* ignore */ }
};

export const getLeaderboard = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('user_data')
      .select('name, username, territory_count')
      .eq('public_profile', true)
      .order('territory_count', { ascending: false })
      .limit(20);
    return data || [];
  } catch { return []; }
};

// ============================================
// TERRITÓRIOS
// ============================================

export const claimTerritory = async (lat: number, lng: number): Promise<{ success: boolean; isNew: boolean; gridKey: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, isNew: false, gridKey: '' };
  const userId = await getUserId();
  if (!userId) return { success: false, isNew: false, gridKey: '' };
  try {
    const userData = await getUserData();
    const userName = userData?.username || userData?.name || 'Atleta';
    const gridKey = `${Math.floor(lat * 400)}_${Math.floor(lng * 400)}`;

    const { data: existing } = await supabase.from('territories').select('*').eq('grid_key', gridKey).single();
    const isNew = !existing;
    const isAlreadyMine = existing?.user_id === userId;

    await supabase.from('territories').upsert({
      grid_key: gridKey, user_id: userId, user_name: userName,
      claimed_at: new Date().toISOString(),
      total_claims: (existing?.total_claims || 0) + (isAlreadyMine ? 0 : 1),
    }, { onConflict: 'grid_key' });

    if (!isAlreadyMine) {
      const newCount = (userData?.territory_count || 0) + 1;
      await supabase.from('user_data').update({ territory_count: newCount }).eq('user_id', userId);
      await checkAndAwardAchievements({ territory_count: newCount });
    }

    return { success: true, isNew: !isAlreadyMine, gridKey };
  } catch (e) {
    console.error('Erro ao dominar território:', e);
    return { success: false, isNew: false, gridKey: '' };
  }
};

export const getNearbyTerritories = async (lat: number, lng: number, radius = 8): Promise<Territory[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const centerX = Math.floor(lat * 400);
    const centerY = Math.floor(lng * 400);
    const { data } = await supabase.from('territories').select('*');
    return ((data || []) as Territory[]).filter(t => {
      const [tx, ty] = t.grid_key.split('_').map(Number);
      return Math.abs(tx - centerX) <= radius && Math.abs(ty - centerY) <= radius;
    });
  } catch { return []; }
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
