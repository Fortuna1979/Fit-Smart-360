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
  videoId?: string;
  gifUrl?: string;
  exercise_english_name?: string;
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
  const [adTotalTime, setAdTotalTime] = useState(0);
  const [adMessage, setAdMessage] = useState<{ icon: string; text: string; sub: string } | null>(null);
  const [resolvedVideoIds, setResolvedVideoIds] = useState<Record<number, string | null>>({});
  const [isCalistenia, setIsCalistenia] = useState(false);
  const [gifLoadError, setGifLoadError] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!isChecking) {
      loadWorkout();
      setIsCalistenia(sessionStorage.getItem('workout_type') === 'calistenia');
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

  // Busca videoId on-the-fly apenas para treinos com equipamento (não calistenia)
  useEffect(() => {
    if (!workout || isCalistenia) return;
    const idx = currentExerciseIndex;
    const ex = workout.exercises[idx];
    if (!ex) return;
    if (ex.videoId || resolvedVideoIds[idx] !== undefined) return;
    const query = ex.youtube_search_query || `${ex.name} exercise tutorial proper form`;
    fetch(`/api/youtube-video?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(({ videoId }) => setResolvedVideoIds(prev => ({ ...prev, [idx]: videoId ?? null })))
      .catch(() => setResolvedVideoIds(prev => ({ ...prev, [idx]: null })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseIndex, workout, isCalistenia]);

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

  if (!workout.exercises || workout.exercises.length === 0) {
    router.push('/dashboard');
    return null;
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  if (!currentExercise) {
    router.push('/dashboard');
    return null;
  }

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
          const msgs = [
            { icon: '💧', text: 'Beba água agora!', sub: 'Hidratação melhora a performance em até 20%' },
            { icon: '💧', text: 'Aproveite e se hidrate', sub: 'Cada gole conta para sua recuperação' },
            { icon: '🍌', text: 'Hora de reabastecer', sub: 'Uma fruta ou castanhas recarregam sua energia' },
            { icon: '🍎', text: 'Coma algo leve', sub: 'Seu corpo precisa de combustível para continuar' },
            { icon: '🧘', text: 'Respire fundo', sub: 'Oxigênio é combustível — inspire pelo nariz, expire pela boca' },
            { icon: '🔥', text: 'Você já fez a parte mais difícil', sub: 'Começar é o maior obstáculo — você venceu' },
            { icon: '💪', text: 'A dor de hoje é a força de amanhã', sub: 'Cada série te deixa mais perto do seu objetivo' },
            { icon: '⚡', text: 'Disciplina constrói resultados', sub: 'Não é sobre perfeição — é sobre consistência' },
            { icon: '🎯', text: 'Foco no próximo exercício', sub: 'Visualize a execução perfeita antes de começar' },
            { icon: '🏆', text: 'Seu futuro eu agradece', sub: 'Cada repetição é um investimento em você mesmo' },
          ];
          setAdMessage(msgs[Math.floor(Math.random() * msgs.length)]);
          setAdTotalTime(restSeconds);
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

  // Renderiza mídia do exercício (função, não componente — evita remontagem a cada render)
  const renderExerciseMedia = () => {
    const gifUrl = currentExercise.gifUrl;
    const videoId = currentExercise.videoId ?? resolvedVideoIds[currentExerciseIndex];
    const imgs = currentExercise.imageUrls;

    const staticFallback = (
      <div className="w-full bg-gray-900 border-2 border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
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
      </div>
    );

    // Calistenia: somente GIF, sem vídeo
    if (isCalistenia) {
      if (gifUrl && !gifLoadError[currentExerciseIndex]) {
        return (
          <div className="w-full bg-gray-900 border-2 border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-center bg-gray-900 min-h-[200px] p-2">
              <img
                src={gifUrl}
                alt={currentExercise.name}
                className="max-w-full max-h-72 object-contain rounded-xl"
                onError={() => setGifLoadError(prev => ({ ...prev, [currentExerciseIndex]: true }))}
              />
            </div>
          </div>
        );
      }
      return staticFallback;
    }

    // Treino com equipamento: GIF → vídeo → imagens estáticas
    const loading = !gifUrl && !currentExercise.videoId && resolvedVideoIds[currentExerciseIndex] === undefined && !!currentExercise.youtube_search_query;

    if (gifUrl && !gifLoadError[currentExerciseIndex]) {
      return (
        <div className="w-full bg-gray-900 border-2 border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-center bg-gray-900 min-h-[200px] p-2">
            <img
              src={gifUrl}
              alt={currentExercise.name}
              className="max-w-full max-h-72 object-contain rounded-xl"
              onError={() => setGifLoadError(prev => ({ ...prev, [currentExerciseIndex]: true }))}
            />
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="w-full bg-gray-900 border-2 border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
          <div className="aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Carregando vídeo...</p>
          </div>
        </div>
      );
    }

    if (videoId) {
      return (
        <div className="w-full bg-gray-900 border-2 border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={currentExercise.name}
          />
        </div>
      );
    }

    return staticFallback;
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
          {renderExerciseMedia()}

          <div className="space-y-4">
            <div>
              <h1 className="font-heading text-4xl mb-3 bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
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
                  <p className="font-stats text-5xl font-bold text-yellow-500 mb-1">{currentSet}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Série Atual</p>
                </div>
                <div className="text-gray-600 text-3xl font-light">/</div>
                <div className="text-center flex-1">
                  <p className="font-stats text-5xl font-bold text-white mb-1">{totalSets}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                <p className="font-stats text-2xl font-bold text-yellow-500">
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
    const progress = adTotalTime > 0 ? adTime / adTotalTime : 0;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Topo com contexto */}
        <div className="pt-10 px-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Intervalo entre exercícios</p>
          <p className="text-sm text-gray-400">
            Este tempo é exatamente o seu descanso programado
          </p>
        </div>

        {/* Contador circular */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
              <circle
                cx="64" cy="64" r={radius} fill="none"
                stroke="#eab308" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-stats text-4xl font-bold text-yellow-500">{adTime}</span>
              <span className="text-xs text-gray-400">seg</span>
            </div>
          </div>

          {/* Mensagem da vez */}
          {adMessage && (
            <div className="w-full max-w-sm bg-gray-900 border border-yellow-500/20 rounded-2xl p-5 text-center space-y-2">
              <span className="text-4xl">{adMessage.icon}</span>
              <p className="text-lg font-bold text-white">{adMessage.text}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{adMessage.sub}</p>
            </div>
          )}
        </div>

        {/* Banner de anúncio na base */}
        <div className="pb-8 px-6">
          <p className="text-xs text-gray-600 text-center mb-3">Publicidade — assine para remover</p>
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
            <h2 className="font-heading text-3xl mb-2">Descanso</h2>
            <p className="text-gray-400">Prepare-se para a próxima série</p>
          </div>

          <div className="relative">
            <div className={`font-stats text-8xl font-bold transition-all duration-300 ${
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
            <h1 className="font-heading text-5xl mb-3">Parabéns!</h1>
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
