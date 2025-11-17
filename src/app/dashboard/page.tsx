'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dumbbell, Camera, TrendingUp, Apple, Droplet, Settings, 
  Play, Calendar, Award, ChevronRight, Zap
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
  const [userData, setUserData] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutPlan | null>(null);
  const [workoutDay, setWorkoutDay] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [router]);

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
  const generateTodayWorkout = async (day: number) => {
    try {
      // Tentar carregar treino salvo do Supabase
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

      // Carregar equipamentos do Supabase
      const equipmentsData = await getEquipments();
      const scannedEquipments: Equipment[] = equipmentsData.map((eq: any) => ({
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
    const newDay = workoutDay === 1 ? 2 : 1;
    setWorkoutDay(newDay);
    
    try {
      await updateWorkoutDay(newDay);
      // Salvar no sessionStorage
      sessionStorage.setItem('workout_day', newDay.toString());
      await generateTodayWorkout(newDay);
    } catch (error) {
      console.error('Erro ao alternar treino:', error);
      // Fallback para sessionStorage
      sessionStorage.setItem('workout_day', newDay.toString());
      await generateTodayWorkout(newDay);
    }
  };

  if (isLoading) {
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
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">IMC</p>
            <p className="text-lg font-bold text-yellow-500">{bmi}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Nível</p>
            <p className="text-lg font-bold">{translateFitnessLevel(userData.fitness_level || userData.fitnessLevel || 'iniciante')}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Objetivo</p>
            <p className="text-lg font-bold">{translateGoal(userData.goal)}</p>
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
            onClick={changeWorkout}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-left hover:border-yellow-500/50 transition-all"
          >
            <Play className="w-8 h-8 text-yellow-500 mb-3" />
            <h3 className="font-bold text-lg mb-1">Treinar</h3>
            <p className="text-sm text-gray-400">Alternar treino</p>
          </button>
        </div>

        {/* Today's Workout */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Treino de Hoje</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
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
            onClick={() => router.push('/progress')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-yellow-500/50 transition-all"
          >
            <TrendingUp className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="font-semibold mb-1">Progresso</h3>
            <p className="text-xs text-gray-400">Ver evolução</p>
          </button>

          <button
            onClick={() => router.push('/nutrition')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-yellow-500/50 transition-all"
          >
            <Apple className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="font-semibold mb-1">Nutrição</h3>
            <p className="text-xs text-gray-400">Plano alimentar</p>
          </button>

          <button
            onClick={() => router.push('/hydration')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-yellow-500/50 transition-all"
          >
            <Droplet className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="font-semibold mb-1">Hidratação</h3>
            <p className="text-xs text-gray-400">Lembretes de água</p>
          </button>

          <button
            onClick={() => router.push('/achievements')}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-yellow-500/50 transition-all"
          >
            <Award className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="font-semibold mb-1">Conquistas</h3>
            <p className="text-xs text-gray-400">Suas medalhas</p>
          </button>
        </div>

        {/* Motivational Quote */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-6 text-center">
          <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <p className="text-lg font-semibold mb-2">
            "A disciplina é a ponte entre objetivos e conquistas"
          </p>
          <p className="text-sm text-gray-400">Continue firme! 💪</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 text-yellow-500">
            <Dumbbell className="w-6 h-6" />
            <span className="text-xs font-medium">Início</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progresso</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Apple className="w-6 h-6" />
            <span className="text-xs">Nutrição</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Settings className="w-6 h-6" />
            <span className="text-xs">Mais</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
