'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Flame, Calendar, Target, TrendingUp, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { getWorkoutProgress } from '@/lib/supabase-helpers';
import { useRequireAuth } from '@/hooks/use-require-auth';

interface Progress {
  days: number;
  achievements: number;
  last_workout?: string;
  streak_current?: number;
  streak_best?: number;
  workout_history?: string[];
}

function getWeeklyData(history: string[]) {
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const label = `S${8 - i}`;
    const count = history.filter(d => {
      const dt = new Date(d);
      return dt >= start && dt <= end;
    }).length;
    weeks.push({ label, count });
  }
  return weeks;
}

function formatLastWorkout(dateStr?: string) {
  if (!dateStr) return 'Nenhum ainda';
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff < 7) return `${diff} dias atrás`;
  return d.toLocaleDateString('pt-BR');
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-900 border border-yellow-500/30 rounded-xl px-3 py-2 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-yellow-500 font-bold">{payload[0].value} treino{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
};

export default function ProgressoPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChecking) {
      getWorkoutProgress().then(p => {
        setProgress(p);
        setLoading(false);
      });
    }
  }, [isChecking]);

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Dumbbell className="w-10 h-10 text-yellow-500 animate-pulse" />
    </div>
  );

  const history = progress?.workout_history || [];
  const weeklyData = getWeeklyData(history);
  const maxCount = Math.max(...weeklyData.map(w => w.count), 1);
  const streakCurrent = progress?.streak_current || 0;
  const streakBest = progress?.streak_best || 0;
  const totalDays = progress?.days || 0;

  const stats = [
    { icon: Flame, label: 'Sequência atual', value: `${streakCurrent} dia${streakCurrent !== 1 ? 's' : ''}`, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
    { icon: Trophy, label: 'Total de treinos', value: `${totalDays}`, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { icon: Target, label: 'Melhor sequência', value: `${streakBest} dia${streakBest !== 1 ? 's' : ''}`, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    { icon: Calendar, label: 'Último treino', value: formatLastWorkout(progress?.last_workout), color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <header className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/dashboard')} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Meu Progresso</h1>
            <p className="text-xs text-gray-500">Histórico e evolução</p>
          </div>
          <TrendingUp className="w-6 h-6 text-yellow-500 ml-auto" />
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto">

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Weekly chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base">Treinos por Semana</h2>
            <span className="text-xs text-gray-500">últimas 8 semanas</span>
          </div>
          {totalDays === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center">
              <Dumbbell className="w-10 h-10 text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">Complete seu primeiro treino para ver o gráfico</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={24} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(234,179,8,0.05)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {weeklyData.map((entry, i) => (
                    <Cell key={i} fill={entry.count === maxCount && entry.count > 0 ? '#EAB308' : entry.count > 0 ? '#78350f' : '#1f2937'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Motivational streak banner */}
        {streakCurrent >= 3 && (
          <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="text-4xl">🔥</div>
            <div>
              <p className="font-bold text-orange-400">{streakCurrent} dias consecutivos!</p>
              <p className="text-sm text-gray-300">Continue assim — consistência é a chave.</p>
            </div>
          </div>
        )}

        {/* Recent history */}
        {history.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="font-bold text-base mb-4">Últimos Treinos</h2>
            <div className="space-y-2">
              {[...history].reverse().slice(0, 10).map((date, i) => {
                const d = new Date(date);
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                        <Dumbbell className="w-4 h-4 text-yellow-500" />
                      </div>
                      <span className="text-sm text-gray-300">Treino concluído</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalDays === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Nenhum treino registrado ainda</p>
            <p className="text-gray-600 text-sm">Complete um treino para começar a ver sua evolução aqui</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4 bg-yellow-500 text-black font-bold hover:bg-yellow-600">
              Começar agora
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
