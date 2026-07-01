'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserData, saveWorkoutPlan } from '@/lib/supabase-helpers';
import { useRequireAuth } from '@/hooks/use-require-auth';

const MUSCLE_GROUPS = [
  { id: 'corpo_inteiro', label: 'Corpo Inteiro', icon: '🏃', desc: 'Cardio + força, circuito completo', color: 'from-yellow-500 to-orange-500' },
  { id: 'peito', label: 'Peito', icon: '💪', desc: 'Flexões, peitoral, tríceps', color: 'from-red-500 to-rose-600' },
  { id: 'costas', label: 'Costas', icon: '🔙', desc: 'Dorsal, remada, bíceps', color: 'from-blue-500 to-blue-700' },
  { id: 'pernas', label: 'Pernas', icon: '🦵', desc: 'Agachamentos, glúteos, panturrilha', color: 'from-green-500 to-green-700' },
  { id: 'ombros', label: 'Ombros', icon: '🎯', desc: 'Deltoides, trapézio', color: 'from-purple-500 to-purple-700' },
  { id: 'core', label: 'Core', icon: '⚡', desc: 'Abdominais, oblíquos, lombar', color: 'from-cyan-500 to-cyan-700' },
  { id: 'bracos', label: 'Braços', icon: '💥', desc: 'Bíceps, tríceps, antebraço', color: 'from-pink-500 to-pink-700' },
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
          <span className="ml-auto text-2xl">🤸</span>
        </div>
      </header>

      <div className="p-4 space-y-5 max-w-lg mx-auto">

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
          <p className="text-sm text-blue-300">
            🌍 Perfeito para viagens, quartos de hotel, parques — treino completo usando apenas seu peso corporal. A IA vai montar um plano do zero adaptado ao seu nível.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-base mb-3">Qual grupo muscular quer trabalhar?</h2>
          <div className="grid grid-cols-2 gap-3">
            {MUSCLE_GROUPS.map(g => (
              <button
                key={g.id}
                onClick={() => setSelected(g.id)}
                className={`relative rounded-2xl p-4 text-left border-2 transition-all active:scale-95 overflow-hidden ${
                  selected === g.id ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-gray-800 hover:border-gray-700'
                } ${g.id === 'corpo_inteiro' ? 'col-span-2' : ''}`}
              >
                {selected === g.id && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${g.color} opacity-10`} />
                )}
                <div className="relative z-10">
                  <span className="text-3xl block mb-2">{g.icon}</span>
                  <p className="font-bold text-sm">{g.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{g.desc}</p>
                </div>
                {selected === g.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
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
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-6 rounded-2xl text-base disabled:opacity-40"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando treino com IA...</>
          ) : (
            <><Play className="w-5 h-5 mr-2" /> Gerar Treino de Calistenia</>
          )}
        </Button>

        {generating && (
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <p className="text-xs text-gray-500">A IA está montando seu treino personalizado...</p>
          </div>
        )}
      </div>
    </div>
  );
}
