'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, CheckCircle, Clock, Dumbbell, Target, 
  AlertCircle, ArrowLeft, Trophy, Sparkles, X, Maximize2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveWorkout, incrementWorkoutProgress, clearLocalStorage } from '@/lib/supabase-helpers';

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

interface WorkoutPlan {
  name: string;
  type: 'upper' | 'lower';
  duration: string;
  exercises: Exercise[];
}

type WorkoutState = 'exercise' | 'rest' | 'completed';

export default function WorkoutPage() {
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [state, setState] = useState<WorkoutState>('exercise');
  const [restTime, setRestTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [exerciseVideoUrl, setExerciseVideoUrl] = useState<string>('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  useEffect(() => {
    // Limpar localStorage ao carregar a página
    clearLocalStorage();
    loadWorkout();
  }, [router]);

  const loadWorkout = async () => {
    try {
      // Tentar carregar do sessionStorage primeiro (mais rápido)
      let activeWorkout = sessionStorage.getItem('active_workout');
      
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

  useEffect(() => {
    // Buscar vídeo demonstrativo do exercício atual
    if (workout && workout.exercises[currentExerciseIndex]) {
      const exercise = workout.exercises[currentExerciseIndex];
      fetchExerciseVideoWithAI(exercise);
    }
  }, [workout, currentExerciseIndex]);

  // Função para buscar vídeo demonstrativo usando mapeamento de vídeos reais do YouTube
  const fetchExerciseVideoWithAI = async (exercise: Exercise) => {
    setIsLoadingVideo(true);
    try {
      // Mapear exercícios para vídeos demonstrativos reais e precisos do YouTube
      const exerciseVideos: Record<string, string> = {
        // Pernas - Vídeos demonstrativos reais
        'agachamento': 'https://www.youtube.com/embed/ultWZbUMPL8?autoplay=1',
        'leg press': 'https://www.youtube.com/embed/IZxyjW7MPJQ?autoplay=1',
        'cadeira extensora': 'https://www.youtube.com/embed/YyvSfVjQeL0?autoplay=1',
        'cadeira flexora': 'https://www.youtube.com/embed/1Tq3QdYUuHs?autoplay=1',
        'stiff': 'https://www.youtube.com/embed/1uDiW5--rAE?autoplay=1',
        'panturrilha': 'https://www.youtube.com/embed/JbyjNymZOt0?autoplay=1',
        
        // Peito - Vídeos demonstrativos reais
        'supino': 'https://www.youtube.com/embed/rT7DgCr-3pg?autoplay=1',
        'supino inclinado': 'https://www.youtube.com/embed/SrqOu55lrYU?autoplay=1',
        'crucifixo': 'https://www.youtube.com/embed/eozdVDA78K0?autoplay=1',
        'crossover': 'https://www.youtube.com/embed/taI4XduLpTk?autoplay=1',
        
        // Costas - Vídeos demonstrativos reais
        'puxada': 'https://www.youtube.com/embed/CAwf7n6Luuc?autoplay=1',
        'remada': 'https://www.youtube.com/embed/kBWAon7ItDw?autoplay=1',
        'remada baixa': 'https://www.youtube.com/embed/UCXxvVItLoM?autoplay=1',
        'barra fixa': 'https://www.youtube.com/embed/eGo4IYlbE5g?autoplay=1',
        
        // Ombros - Vídeos demonstrativos reais
        'desenvolvimento': 'https://www.youtube.com/embed/qEwKCR5JCog?autoplay=1',
        'elevação lateral': 'https://www.youtube.com/embed/3VcKaXpzqRo?autoplay=1',
        'elevação frontal': 'https://www.youtube.com/embed/t7955W-XEJk?autoplay=1',
        
        // Braços - Vídeos demonstrativos reais
        'rosca direta': 'https://www.youtube.com/embed/ykJmrZ5v0Oo?autoplay=1',
        'rosca alternada': 'https://www.youtube.com/embed/sAq_ocpRh_I?autoplay=1',
        'rosca martelo': 'https://www.youtube.com/embed/zC3nLlEvin4?autoplay=1',
        'tríceps testa': 'https://www.youtube.com/embed/d_KZxkY_0cM?autoplay=1',
        'tríceps corda': 'https://www.youtube.com/embed/2-LAMcpzODU?autoplay=1',
        'tríceps francês': 'https://www.youtube.com/embed/nRiJVZDpdL0?autoplay=1',
        
        // Exercícios com peso corporal
        'flexão': 'https://www.youtube.com/embed/IODxDxX7oi4?autoplay=1',
        'avanço': 'https://www.youtube.com/embed/QOVaHwm-Q6U?autoplay=1',
      };

      const exerciseName = exercise.name.toLowerCase();
      let videoUrl = '';

      for (const [key, url] of Object.entries(exerciseVideos)) {
        if (exerciseName.includes(key)) {
          videoUrl = url;
          break;
        }
      }

      if (!videoUrl) {
        videoUrl = 'https://www.youtube.com/embed/IODxDxX7oi4?autoplay=1';
      }

      setExerciseVideoUrl(videoUrl);
    } catch (error) {
      console.error('Erro ao buscar vídeo do exercício:', error);
      setExerciseVideoUrl('');
    } finally {
      setIsLoadingVideo(false);
    }
  };

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

  if (!workout) {
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
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setState('exercise');
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
      // Salvar progresso no Supabase
      await incrementWorkoutProgress();
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  // Função para voltar ao dashboard
  const returnToDashboard = () => {
    sessionStorage.removeItem('active_workout');
    router.push('/dashboard');
  };

  // Modal de vídeo em tela cheia
  const VideoModal = () => {
    if (!showVideoModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl">
          <button
            onClick={() => setShowVideoModal(false)}
            className="absolute -top-12 right-0 text-white hover:text-yellow-500 transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="bg-gray-900 rounded-2xl overflow-hidden border-2 border-yellow-500/50 shadow-2xl">
            <div className="aspect-video bg-black relative">
              {isLoadingVideo ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mb-4" />
                  <p className="text-gray-400">Carregando demonstração...</p>
                </div>
              ) : exerciseVideoUrl ? (
                <iframe
                  src={exerciseVideoUrl}
                  title={`Demonstração: ${currentExercise.name}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-6">
                  <Play className="w-24 h-24 text-yellow-500 mb-4" />
                  <p className="text-gray-400 text-center text-lg">
                    Vídeo demonstrativo<br/>
                    <span className="text-yellow-500 font-semibold">{currentExercise.name}</span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-900 p-6 border-t border-gray-800">
              <h3 className="text-2xl font-bold text-yellow-500 mb-2">{currentExercise.name}</h3>
              <p className="text-gray-300 mb-4">{currentExercise.description}</p>
              {currentExercise.equipamento && (
                <div className="flex items-center gap-2 mb-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 w-fit">
                  <Dumbbell className="w-4 h-4 text-yellow-500" />
                  <p className="text-sm text-gray-300">
                    Equipamento: {currentExercise.equipamento}
                  </p>
                </div>
              )}
              {currentExercise.dica_rapida && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-500 mb-1">⚡ Dica Técnica:</p>
                  <p className="text-white">{currentExercise.dica_rapida}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tela de exercício
  if (state === 'exercise') {
    return (
      <div className="min-h-screen bg-black text-white">
        <VideoModal />

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

        <div className="p-6 space-y-6">
          <button
            onClick={() => setShowVideoModal(true)}
            className="w-full bg-gray-900 border-2 border-yellow-500/30 hover:border-yellow-500 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="aspect-video bg-gray-800 relative">
              {isLoadingVideo ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mb-4" />
                  <p className="text-gray-400 text-sm">Carregando demonstração...</p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                  <Dumbbell className="w-24 h-24 text-yellow-500/40 mb-4 group-hover:text-yellow-500 transition-colors" />
                  <p className="text-gray-400 text-center text-sm">
                    Vídeo demonstrativo<br/>
                    <span className="text-yellow-500 font-semibold">{currentExercise.name}</span>
                  </p>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                <div className="bg-yellow-500 rounded-full p-6 group-hover:scale-110 transition-transform shadow-2xl">
                  <Play className="w-12 h-12 text-black fill-black" />
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                <Maximize2 className="w-3 h-3 text-yellow-500" />
                <p className="text-xs text-yellow-500 font-semibold">
                  Clique para ver demonstração completa
                </p>
              </div>

              {exerciseVideoUrl && !isLoadingVideo && (
                <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                  <Play className="w-3 h-3 text-white fill-white" />
                  <p className="text-xs text-white font-semibold">YouTube</p>
                </div>
              )}
            </div>
          </button>

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
            "A consistência é a chave do sucesso. Continue assim! 💪"
          </p>
        </div>
      </div>
    );
  }

  return null;
}
