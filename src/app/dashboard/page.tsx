'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell, Camera, TrendingUp, Apple, Droplet, Settings,
  Play, Calendar, Award, Zap, Users, MapPin, PersonStanding
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateBMI, translateGoal, translateFitnessLevel } from '@/lib/utils';
import {
  getUserData,
  getEquipments,
  saveWorkoutPlan,
  getCurrentWorkout,
  updateWorkoutDay
} from '@/lib/supabase-helpers';
import { useRequireAuth } from '@/hooks/use-require-auth';
import type { UserData, Equipment as EquipmentRow } from '@/lib/supabase';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  difficulty: string;
  description: string;
  equipamento?: string;
  musculo_alvo?: string;
  dica_rapida?: string;
  video_demo?: string;
}

interface Equipment {
  equipmentName: string;
  category: string;
  muscleGroups: string[];
  description: string;
  detected: boolean;
  imageUrl?: string;
  exercises?: Exercise[];
  tips?: string[];
  commonMistakes?: string[];
}

interface WorkoutPlan {
  name: string;
  type: 'upper' | 'lower';
  duration: string;
  exercises: Exercise[];
  equipments: Equipment[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutPlan | null>(null);
  const [workoutDay, setWorkoutDay] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (!isChecking) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Carregar dados do usuário do Supabase
      const data = await getUserData();
      if (data) {
        setUserData(data);
      } else {
        router.push('/onboarding');
        return;
      }

      // Carregar dia do treino do sessionStorage
      const savedDay = sessionStorage.getItem('workout_day') || '1';
      const currentDay = parseInt(savedDay);
      setWorkoutDay(currentDay);

      // Gerar treino do dia
      await generateTodayWorkout(currentDay);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      router.push('/onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gerar treino do dia baseado em equipamentos do Supabase
  const generateTodayWorkout = async (day: number, skipCache = false) => {
    try {
      // Tentar carregar treino salvo do Supabase (ignorado quando usuário clica em Trocar)
      if (!skipCache) {
        const savedWorkout = await getCurrentWorkout(day);
        if (savedWorkout) {
          setTodayWorkout({
            name: savedWorkout.name,
            type: savedWorkout.type,
            duration: savedWorkout.duration,
            exercises: savedWorkout.exercises,
            equipments: savedWorkout.equipments || []
          });
          return;
        }
      }

      // Carregar equipamentos do Supabase
      const equipmentsData = await getEquipments();
      const scannedEquipments: Equipment[] = equipmentsData.map((eq: EquipmentRow) => ({
        equipmentName: eq.equipment_name,
        category: eq.category,
        muscleGroups: eq.muscle_groups,
        description: eq.description,
        detected: eq.detected,
        imageUrl: eq.image_url,
        exercises: eq.exercises,
        tips: eq.tips,
        commonMistakes: eq.common_mistakes
      }));

      if (scannedEquipments.length === 0) {
        // Se não há equipamentos, criar treino padrão
        const defaultWorkout = getDefaultWorkout(day);
        setTodayWorkout(defaultWorkout);
        // Salvar no Supabase
        await saveWorkoutPlan({
          ...defaultWorkout,
          workout_day: day,
          is_active: false
        });
        return;
      }

      // Alternar entre treino de pernas (dia ímpar) e braços (dia par)
      const isLowerBody = day % 2 !== 0;
      const workoutType = isLowerBody ? 'lower' : 'upper';

      // Filtrar equipamentos por tipo de treino
      const relevantEquipments = scannedEquipments.filter(eq => {
        const muscles = eq.muscleGroups.map(m => m.toLowerCase());
        
        if (isLowerBody) {
          return muscles.some(m => 
            m.includes('perna') || 
            m.includes('glúteo') || 
            m.includes('quadríceps') ||
            m.includes('posterior') ||
            m.includes('panturrilha') ||
            m.includes('coxa')
          );
        } else {
          return muscles.some(m => 
            m.includes('braço') || 
            m.includes('bíceps') ||
            m.includes('tríceps') ||
            m.includes('ombro') ||
            m.includes('peito') ||
            m.includes('costas') ||
            m.includes('dorsal')
          );
        }
      });

      // Coletar todos os exercícios dos equipamentos relevantes
      const allExercises: Exercise[] = [];
      relevantEquipments.forEach(eq => {
        if (eq.exercises && eq.exercises.length > 0) {
          allExercises.push(...eq.exercises);
        }
      });

      // Criar plano de treino COMPLETO
      const workout: WorkoutPlan = {
        name: isLowerBody ? 'Treino A - Pernas e Glúteos' : 'Treino B - Braços e Peito',
        type: workoutType,
        duration: `${allExercises.length * 5} minutos`,
        exercises: allExercises.slice(0, 8),
        equipments: relevantEquipments
      };

      setTodayWorkout(workout);
      
      // Salvar treino APENAS no Supabase
      await saveWorkoutPlan({
        ...workout,
        workout_day: day,
        is_active: false
      });
    } catch (error) {
      console.error('Erro ao gerar treino:', error);
      // Fallback para treino padrão
      const defaultWorkout = getDefaultWorkout(day);
      setTodayWorkout(defaultWorkout);
    }
  };

  // Treino padrão quando não há equipamentos escaneados
  const getDefaultWorkout = (day: number): WorkoutPlan => {
    const isLowerBody = day % 2 !== 0;
    
    if (isLowerBody) {
      return {
        name: 'Treino A - Pernas e Glúteos',
        type: 'lower',
        duration: '45 minutos',
        exercises: [
          {
            name: 'Agachamento Livre',
            sets: '4',
            reps: '12-15',
            rest: '60',
            difficulty: 'Intermediário',
            description: 'Agachamento com peso corporal ou barra',
            equipamento: 'Peso Livre',
            musculo_alvo: 'Quadríceps e Glúteos',
            dica_rapida: 'Mantenha os joelhos alinhados com os pés'
          },
          {
            name: 'Avanço',
            sets: '3',
            reps: '10-12',
            rest: '45',
            difficulty: 'Iniciante',
            description: 'Passo à frente alternando as pernas',
            equipamento: 'Peso Corporal',
            musculo_alvo: 'Pernas e Glúteos',
            dica_rapida: 'Mantenha o tronco ereto durante o movimento'
          }
        ],
        equipments: []
      };
    } else {
      return {
        name: 'Treino B - Braços e Peito',
        type: 'upper',
        duration: '40 minutos',
        exercises: [
          {
            name: 'Flexão de Braço',
            sets: '3',
            reps: '10-15',
            rest: '60',
            difficulty: 'Iniciante',
            description: 'Flexão tradicional no chão',
            equipamento: 'Peso Corporal',
            musculo_alvo: 'Peito e Tríceps',
            dica_rapida: 'Mantenha o corpo reto como uma prancha'
          },
          {
            name: 'Tríceps no Banco',
            sets: '3',
            reps: '12-15',
            rest: '45',
            difficulty: 'Iniciante',
            description: 'Apoie as mãos no banco e desça o corpo',
            equipamento: 'Banco',
            musculo_alvo: 'Tríceps',
            dica_rapida: 'Cotovelos devem apontar para trás'
          }
        ],
        equipments: []
      };
    }
  };

  // Função para iniciar treino
  const startWorkout = async () => {
    if (todayWorkout) {
      try {
        // Salvar treino ativo no Supabase
        await saveWorkoutPlan({
          ...todayWorkout,
          workout_day: workoutDay,
          is_active: true
        });
        
        // Salvar no sessionStorage APENAS para acesso rápido na sessão atual
        sessionStorage.setItem('active_workout', JSON.stringify(todayWorkout));
        
        router.push('/workout');
      } catch (error) {
        console.error('Erro ao iniciar treino:', error);
        // Fallback para sessionStorage
        sessionStorage.setItem('active_workout', JSON.stringify(todayWorkout));
        router.push('/workout');
      }
    }
  };

  // Função para alternar treino
  const changeWorkout = async () => {
    if (isChanging) return;
    setIsChanging(true);
    const newDay = workoutDay === 1 ? 2 : 1;
    setWorkoutDay(newDay);
    try {
      await updateWorkoutDay(newDay);
      sessionStorage.setItem('workout_day', newDay.toString());
      await generateTodayWorkout(newDay, true);
    } catch (error) {
      console.error('Erro ao alternar treino:', error);
      sessionStorage.setItem('workout_day', newDay.toString());
      await generateTodayWorkout(newDay);
    } finally {
      setIsChanging(false);
    }
  };

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-yellow-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-yellow-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(Number(userData.weight), Number(userData.height));

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black text-lg">
              {userData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">Olá, {userData.name.split(' ')[0]}!</h1>
              <p className="text-sm text-gray-400">Pronto para treinar?</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/settings')}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">IMC</p>
            <p className="text-base font-bold text-yellow-500 truncate">{bmi}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">Nível</p>
            <p className="text-xs font-bold leading-tight">{translateFitnessLevel(userData.fitness_level || 'iniciante')}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">Objetivo</p>
            <p className="text-xs font-bold leading-tight">{translateGoal(userData.goal)}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/scan')}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-left hover:scale-105 transition-transform"
          >
            <Camera className="w-8 h-8 text-black mb-3" />
            <h3 className="font-bold text-black text-lg mb-1">Escanear</h3>
            <p className="text-sm text-black/80">Adicionar equipamentos</p>
          </button>

          <button
            onClick={() => router.push('/calistenia')}
            className="bg-gray-800 border border-gray-700 hover:border-yellow-500/40 rounded-2xl p-6 text-left hover:scale-105 transition-all active:scale-95"
          >
            <PersonStanding className="w-8 h-8 text-yellow-500 mb-3" />
            <h3 className="font-bold text-white text-lg mb-1">Calistenia</h3>
            <p className="text-sm text-gray-400">Treino sem equipamento</p>
          </button>
        </div>

        {/* Today's Workout */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Treino de Hoje</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={changeWorkout}
                disabled={isChanging}
                className={`text-xs border rounded-lg px-2 py-1 flex items-center gap-1 transition-all active:scale-95 ${
                  isChanging
                    ? 'text-yellow-500/50 border-yellow-500/20 cursor-not-allowed'
                    : 'text-yellow-500 hover:text-yellow-400 border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-500/10'
                }`}
              >
                {isChanging ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Trocando...
                  </>
                ) : 'Trocar'}
              </button>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          {todayWorkout ? (
            <>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{todayWorkout.name}</h3>
                    <p className="text-sm text-gray-400">
                      {todayWorkout.duration} • {todayWorkout.exercises.length} exercícios
                    </p>
                  </div>
                </div>

                {/* Preview dos exercícios */}
                {todayWorkout.exercises.length > 0 && (
                  <div className="bg-gray-900 rounded-lg p-3 mb-3 space-y-1">
                    {todayWorkout.exercises.slice(0, 3).map((ex, idx) => (
                      <div key={idx} className="text-xs text-gray-400">
                        • {ex.name} - {ex.sets}x{ex.reps}
                      </div>
                    ))}
                    {todayWorkout.exercises.length > 3 && (
                      <div className="text-xs text-yellow-500">
                        + {todayWorkout.exercises.length - 3} exercícios
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={startWorkout}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  Iniciar Treino
                  <Play className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <p className="text-sm text-gray-400 text-center">
                💪 Dia {workoutDay} - {todayWorkout.type === 'lower' ? 'Pernas' : 'Braços'}
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">
                Escaneie equipamentos para gerar treinos personalizados
              </p>
              <Button
                onClick={() => router.push('/scan')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                Escanear Agora
              </Button>
            </div>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/progresso')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-yellow-500/50 transition-all active:scale-95"
          >
            <TrendingUp className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="font-semibold mb-1">Progresso</h3>
            <p className="text-xs text-gray-400">Gráficos e evolução</p>
          </button>

          <button
            onClick={() => router.push('/nutricao')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-green-500/50 transition-all active:scale-95"
          >
            <Apple className="w-6 h-6 text-green-500 mb-2" />
            <h3 className="font-semibold mb-1">Nutrição</h3>
            <p className="text-xs text-gray-400">Plano alimentar IA</p>
          </button>

          <button
            onClick={() => router.push('/hidratacao')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-blue-500/50 transition-all active:scale-95"
          >
            <Droplet className="w-6 h-6 text-blue-400 mb-2" />
            <h3 className="font-semibold mb-1">Hidratação</h3>
            <p className="text-xs text-gray-400">Meta e lembretes</p>
          </button>

          <button
            onClick={() => router.push('/conquistas')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-purple-500/50 transition-all active:scale-95"
          >
            <Award className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="font-semibold mb-1">Conquistas</h3>
            <p className="text-xs text-gray-400">Medalhas e níveis</p>
          </button>

          <button
            onClick={() => router.push('/social')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-green-500/50 transition-all active:scale-95"
          >
            <Users className="w-6 h-6 text-green-400 mb-2" />
            <h3 className="font-semibold mb-1">Social</h3>
            <p className="text-xs text-gray-400">Feed e ranking</p>
          </button>

          <button
            onClick={() => router.push('/territorio')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-orange-500/50 transition-all active:scale-95"
          >
            <MapPin className="w-6 h-6 text-orange-400 mb-2" />
            <h3 className="font-semibold mb-1">Território</h3>
            <p className="text-xs text-gray-400">Dominar áreas GPS</p>
          </button>
        </div>

        {/* Motivational Quote */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-6 text-center">
          <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <p className="text-lg font-semibold mb-2">
            &ldquo;A disciplina é a ponte entre objetivos e conquistas&rdquo;
          </p>
          <p className="text-sm text-gray-400">Continue firme! 💪</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-2 py-2">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center gap-0.5 text-yellow-500 px-1">
            <Dumbbell className="w-5 h-5" />
            <span className="text-[10px] font-medium">Início</span>
          </button>
          <button onClick={() => router.push('/progresso')} className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-yellow-500 px-1">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px]">Progresso</span>
          </button>
          <button onClick={() => router.push('/social')} className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-green-400 px-1">
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Social</span>
          </button>
          <button onClick={() => router.push('/territorio')} className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 px-1">
            <MapPin className="w-5 h-5" />
            <span className="text-[10px]">Território</span>
          </button>
          <button onClick={() => router.push('/conquistas')} className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-purple-400 px-1">
            <Award className="w-5 h-5" />
            <span className="text-[10px]">Medalhas</span>
          </button>
          <button onClick={() => router.push('/settings')} className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white px-1">
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Mais</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
