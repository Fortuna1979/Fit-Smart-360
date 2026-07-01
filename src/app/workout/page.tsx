'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play, CheckCircle, Clock, Dumbbell, Target,
  AlertCircle, ArrowLeft, Trophy, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveWorkout, getUserData, incrementWorkoutProgress, postToFeed, checkAndAwardAchievements, getWorkoutProgress } from '@/lib/supabase-helpers';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { AdBanner } from '@/components/AdBanner';

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
  imageUrls?: string[];
  youtube_search_query?: string;
}

interface WorkoutPlan {
  name: string;
  type: 'upper' | 'lower';
  duration: string;
  exercises: Exercise[];
}

type WorkoutState = 'exercise' | 'rest' | 'ad' | 'completed';

// Anúncio aparece a cada 2 exercícios (depois do 2º, 4º, 6º...) só para plano gratuito
const AD_EVERY_N_EXERCISES = 2;

export default function WorkoutPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [state, setState] = useState<WorkoutState>('exercise');
  const [restTime, setRestTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [imageFrame, setImageFrame] = useState(0);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [adTime, setAdTime] = useState(0);

  useEffect(() => {
    if (!isChecking) {
      loadWorkout();
      getUserData().then((userData) => {
        setIsFreePlan(!userData?.subscription_plan || userData.subscription_plan === 'free');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking]);

  const loadWorkout = async () => {
    try {
      // Tentar carregar do sessionStorage primeiro (mais rápido)
      const activeWorkout = sessionStorage.getItem('active_workout');
      
      if (activeWorkout) {
        const workoutData = JSON.parse(activeWorkout);
        setWorkout(workoutData);
        return;
      }

      // Se não encontrar no sessionStorage, buscar no Supabase
      const supabaseWorkout = await getActiveWorkout();
      if (supabaseWorkout) {
        const workoutData = {
          name: supabaseWorkout.name,
          type: supabaseWorkout.type,
          duration: supabaseWorkout.duration,
          exercises: supabaseWorkout.exercises
        };
        setWorkout(workoutData);
        // Salvar no sessionStorage para próximas cargas
        sessionStorage.setItem('active_workout', JSON.stringify(workoutData));
        return;
      }

      // Se não encontrar nada, voltar ao dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao carregar treino:', error);
      router.push('/dashboard');
    }
  };

  // Alternar entre imagem de início e fim do exercício (efeito de movimento)
  useEffect(() => {
    setImageFrame(0);
    const imgs = workout?.exercises[currentExerciseIndex]?.imageUrls;
    if (!imgs || imgs.length < 2) return;
    const interval = setInterval(() => setImageFrame(f => (f === 0 ? 1 : 0)), 1200);
    return () => clearInterval(interval);
  }, [workout, currentExerciseIndex]);

  useEffect(() => {
    // Cronômetro de descanso
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && restTime > 0) {
      interval = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, restTime]);

  useEffect(() => {
    // Cronômetro do anúncio (mesma duração do descanso entre séries)
    if (state !== 'ad' || adTime <= 0) return;

    const interval = setInterval(() => {
      setAdTime(prev => {
        if (prev <= 1) {
          setState('exercise');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state, adTime]);

  if (isChecking || !workout) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-yellow-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Carregando treino...</p>
        </div>
      </div>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const totalSets = parseInt(currentExercise.sets) || 3;
  const restSeconds = parseInt(currentExercise.rest) || 60;

  // Função para concluir série
  const completeSet = () => {
    if (currentSet < totalSets) {
      setRestTime(restSeconds);
      setIsTimerRunning(true);
      setState('rest');
      setCurrentSet(currentSet + 1);
    } else {
      if (currentExerciseIndex < workout.exercises.length - 1) {
        const nextExerciseNumber = currentExerciseIndex + 2; // 1-based
        const showAd = isFreePlan && nextExerciseNumber % AD_EVERY_N_EXERCISES === 0;

        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);

        if (showAd) {
          setAdTime(restSeconds);
          setState('ad');
        } else {
          setState('exercise');
        }
      } else {
        completeWorkout();
      }
    }
  };

  // Função para pular descanso
  const skipRest = () => {
    setIsTimerRunning(false);
    setRestTime(0);
    setState('exercise');
  };

  // Função para completar treino
  const completeWorkout = async () => {
    setState('completed');

    try {
      await incrementWorkoutProgress();
      const workoutType = sessionStorage.getItem('workout_type') || 'equipment';
      const isCalistenia = workoutType === 'calistenia';
      if (workout) {
        await postToFeed(workout.name, workout.exercises.length, workout.duration, workoutType);
      }
      const [progress, userDataForAch] = await Promise.all([getWorkoutProgress(), getUserData()]);
      await checkAndAwardAchievements({
        days: progress?.days,
        streak_current: progress?.streak_current,
        territory_count: userDataForAch?.territory_count,
        has_calistenia: isCalistenia,
      });
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  // Função para voltar ao dashboard
  const returnToDashboard = () => {
    sessionStorage.removeItem('active_workout');
    sessionStorage.removeItem('workout_type');
    router.push('/dashboard');
  };

  // Componente de demonstração: YouTube do fabricante + fallback em imagens
  const ExerciseDemo = () => {
    const query = currentExercise.youtube_search_query;
    const imgs = currentExercise.imageUrls;
    const youtubeSearchUrl = query
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(currentExercise.name + ' exercise tutorial')}`;

    return (
      <div className="w-full bg-gray-900 border-2 border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
        {/* Imagens demonstrativas do exercício */}
        {imgs && imgs.length > 0 ? (
          <div className="relative bg-gray-800" style={{ aspectRatio: '16/9' }}>
            {imgs.map((url, i) => (
              <img key={i} src={url} alt={`${currentExercise.name} pos ${i + 1}`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${imageFrame === i ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {imgs.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${imageFrame === i ? 'bg-yellow-500' : 'bg-gray-600'}`} />
              ))}
            </div>
          </div>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
            <Dumbbell className="w-16 h-16 text-yellow-500/40 mb-3" />
            <p className="text-gray-500 text-sm text-center px-4">{currentExercise.name}</p>
          </div>
        )}

        {/* Botão para ver vídeo do fabricante no YouTube */}
        <a
          href={youtubeSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-red-600/90 hover:bg-red-600 transition-colors border-t border-red-700"
        >
          <Play className="w-4 h-4 text-white fill-white" />
          <span className="text-white font-semibold text-sm">
            Ver vídeo do fabricante no YouTube
          </span>
          {query?.split(' ')[0] && (
            <span className="text-red-200 text-xs">({query.split(' ')[0]})</span>
          )}
        </a>
      </div>
    );
  };

  // Tela de exercício
  if (state === 'exercise') {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="bg-gray-900 border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={returnToDashboard}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-400">Exercício {currentExerciseIndex + 1} de {workout.exercises.length}</p>
              <p className="text-xs text-yellow-500 font-semibold">{workout.name}</p>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-5">
          <ExerciseDemo />

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
                {currentExercise.name}
              </h1>
              {currentExercise.equipamento && (
                <div className="flex items-center gap-2 mb-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 w-fit">
                  <Dumbbell className="w-4 h-4 text-yellow-500" />
                  <p className="text-sm text-gray-300">{currentExercise.equipamento}</p>
                </div>
              )}
              {currentExercise.musculo_alvo && (
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 w-fit">
                  <Target className="w-4 h-4 text-yellow-500" />
                  <p className="text-sm text-yellow-500 font-semibold">
                    Alvo: {currentExercise.musculo_alvo}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-yellow-500/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <p className="text-5xl font-bold text-yellow-500 mb-1">{currentSet}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Série Atual</p>
                </div>
                <div className="text-gray-600 text-3xl font-light">/</div>
                <div className="text-center flex-1">
                  <p className="text-5xl font-bold text-white mb-1">{totalSets}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {currentExercise.reps} repetições
                </p>
              </div>
            </div>

            {currentExercise.dica_rapida && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/40 rounded-2xl p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-500 mb-2 uppercase tracking-wide">⚡ Dica Técnica</p>
                    <p className="text-base text-white leading-relaxed">{currentExercise.dica_rapida}</p>
                  </div>
                </div>
              </div>
            )}

            {currentExercise.description && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-sm text-gray-300 leading-relaxed">{currentExercise.description}</p>
              </div>
            )}
          </div>

          <Button
            onClick={completeSet}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold text-xl py-7 rounded-2xl shadow-2xl transform transition-all hover:scale-105 active:scale-95"
          >
            <CheckCircle className="w-7 h-7 mr-3" />
            Concluir Série {currentSet}
          </Button>
        </div>
      </div>
    );
  }

  // Tela de anúncio (plano gratuito, a cada 2 exercícios)
  if (state === 'ad') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Continuando em {adTime}s...</h2>
            <p className="text-gray-400 text-sm">Seu próximo exercício já vai começar</p>
          </div>

          <AdBanner />
        </div>
      </div>
    );
  }

  // Tela de descanso
  if (state === 'rest') {
    const isPulsing = restTime <= 5;
    
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 ${
        isPulsing ? 'bg-yellow-500/20 animate-pulse' : 'bg-black'
      }`}>
        <div className="text-center space-y-8">
          <div>
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Descanso</h2>
            <p className="text-gray-400">Prepare-se para a próxima série</p>
          </div>

          <div className="relative">
            <div className={`text-8xl font-bold transition-all duration-300 ${
              isPulsing ? 'text-yellow-500 scale-110' : 'text-white'
            }`}>
              {restTime}
            </div>
            <p className="text-gray-400 mt-2">segundos</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Próxima série</p>
            <p className="text-lg font-semibold">
              Série {currentSet} de {totalSets}
            </p>
          </div>

          <div className="space-y-3 w-full max-w-sm">
            {restTime === 0 ? (
              <Button
                onClick={skipRest}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-6 rounded-xl animate-bounce"
              >
                <Play className="w-6 h-6 mr-2" />
                Iniciar Próxima Série
              </Button>
            ) : (
              <Button
                onClick={skipRest}
                variant="outline"
                className="w-full border-gray-700 text-gray-400 hover:text-white hover:border-yellow-500"
              >
                Pular Descanso
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tela de conclusão
  if (state === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-500/20 via-black to-black flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-8 max-w-md">
          <div className="relative">
            <Trophy className="w-24 h-24 text-yellow-500 mx-auto animate-bounce" />
            <Sparkles className="w-8 h-8 text-yellow-500 absolute top-0 left-1/4 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-500 absolute top-4 right-1/4 animate-pulse delay-100" />
            <Sparkles className="w-7 h-7 text-yellow-500 absolute bottom-0 left-1/3 animate-pulse delay-200" />
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-3">Parabéns!</h1>
            <p className="text-xl text-gray-300 mb-2">Treino Concluído 🎉</p>
            <p className="text-gray-400">
              Você completou {workout.exercises.length} exercícios
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Treino</span>
              <span className="font-semibold">{workout.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Exercícios</span>
              <span className="font-semibold">{workout.exercises.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Duração</span>
              <span className="font-semibold">{workout.duration}</span>
            </div>
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center justify-center gap-2 text-yellow-500">
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">+1 Dia de Treino</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-yellow-500 mt-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">+1 Conquista</span>
              </div>
            </div>
          </div>

          <Button
            onClick={returnToDashboard}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg py-6 rounded-xl"
          >
            Voltar ao Menu
          </Button>

          <p className="text-sm text-gray-400 italic">
            &ldquo;A consistência é a chave do sucesso. Continue assim! 💪&rdquo;
          </p>
        </div>
      </div>
    );
  }

  return null;
}
