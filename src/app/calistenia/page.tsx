'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Play, Zap, Dumbbell, MoveVertical,
  Target, Flame, Activity, ArrowDownUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserData, saveWorkoutPlan } from '@/lib/supabase-helpers';
import { useRequireAuth } from '@/hooks/use-require-auth';
import type { LucideIcon } from 'lucide-react';

interface MuscleGroup {
  id: string;
  label: string;
  Icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  desc: string;
  span2?: boolean;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    id: 'corpo_inteiro', label: 'Corpo Inteiro', Icon: Activity,
    iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/15',
    desc: 'Cardio + força, circuito completo', span2: true,
  },
  {
    id: 'peito', label: 'Peito', Icon: Dumbbell,
    iconColor: 'text-orange-400', iconBg: 'bg-orange-500/15',
    desc: 'Flexões, peitoral, tríceps',
  },
  {
    id: 'costas', label: 'Costas', Icon: ArrowDownUp,
    iconColor: 'text-blue-400', iconBg: 'bg-blue-500/15',
    desc: 'Dorsal, remada, bíceps',
  },
  {
    id: 'pernas', label: 'Pernas', Icon: MoveVertical,
    iconColor: 'text-green-400', iconBg: 'bg-green-500/15',
    desc: 'Agachamentos, glúteos, panturrilha',
  },
  {
    id: 'ombros', label: 'Ombros', Icon: Target,
    iconColor: 'text-purple-400', iconBg: 'bg-purple-500/15',
    desc: 'Deltoides, trapézio',
  },
  {
    id: 'core', label: 'Core', Icon: Zap,
    iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/15',
    desc: 'Abdominais, oblíquos, lombar',
  },
  {
    id: 'bracos', label: 'Braços', Icon: Flame,
    iconColor: 'text-pink-400', iconBg: 'bg-pink-500/15',
    desc: 'Bíceps, tríceps, antebraço',
  },
];

export default function CalisteniasPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!selected) return;
    setGenerating(true);
    setError(null);
    try {
      const userData = await getUserData();
      const res = await fetch('/api/generate-calistenia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          muscleGroup: selected,
          userProfile: {
            goal: userData?.goal, level: userData?.fitness_level,
            age: userData?.age, weight: userData?.weight, height: userData?.height,
            parQHeartCondition: userData?.par_q_heart_condition,
            hasPastInjuries: userData?.has_past_injuries, injuryDetails: userData?.injury_details,
            hasJointPain: userData?.has_joint_pain, jointPainLocation: userData?.joint_pain_location,
            timeWithoutTraining: userData?.time_without_training,
          },
        }),
      });
      if (!res.ok) throw new Error('Falha na geração');
      const { plan } = await res.json();

      await saveWorkoutPlan({ ...plan, workout_day: 0, is_active: true });
      sessionStorage.setItem('active_workout', JSON.stringify(plan));
      sessionStorage.setItem('workout_type', 'calistenia');
      router.push('/workout');
    } catch {
      setError('Não foi possível gerar o treino. Tente novamente.');
      setGenerating(false);
    }
  };

  if (isChecking) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <header className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/dashboard')} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Calistenia</h1>
            <p className="text-xs text-gray-500">Treino sem equipamentos — qualquer lugar</p>
          </div>
          <Activity className="ml-auto w-6 h-6 text-yellow-500" />
        </div>
      </header>

      <div className="p-4 space-y-5 max-w-lg mx-auto">

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            Perfeito para viagens, quartos de hotel e parques — treino completo usando apenas seu peso corporal. A IA monta um plano adaptado ao seu nível.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-base mb-3">Qual grupo muscular quer trabalhar?</h2>
          <div className="grid grid-cols-2 gap-3">
            {MUSCLE_GROUPS.map(({ id, label, Icon, iconColor, iconBg, desc, span2 }) => (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`relative rounded-2xl p-4 text-left border-2 transition-all active:scale-95 ${
                  selected === id
                    ? 'border-yellow-500 bg-yellow-500/5 shadow-lg shadow-yellow-500/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                } ${span2 ? 'col-span-2' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <p className="font-bold text-sm text-white">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                {selected === id && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-black text-xs font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        <Button
          onClick={generate}
          disabled={!selected || generating}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-6 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando treino com IA...</>
          ) : (
            <><Play className="w-5 h-5 mr-2" /> Gerar Treino de Calistenia</>
          )}
        </Button>

        {generating && (
          <div className="text-center space-y-2 pb-4">
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <p className="text-xs text-gray-500">A IA está montando seu treino personalizado...</p>
          </div>
        )}
      </div>
    </div>
  );
}
