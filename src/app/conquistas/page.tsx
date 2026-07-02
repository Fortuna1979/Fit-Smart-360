'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, Share2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserAchievements, getWorkoutProgress, getUserData } from '@/lib/supabase-helpers';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { useRequireAuth } from '@/hooks/use-require-auth';

interface EarnedMap { [key: string]: string }

function AchievementCard({
  achievement, earned, earnedAt, onShare,
}: {
  achievement: typeof ACHIEVEMENTS[0];
  earned: boolean;
  earnedAt?: string;
  onShare: () => void;
}) {
  return (
    <div className={`relative rounded-2xl border-2 p-4 transition-all ${
      earned ? `${achievement.bgColor} ${achievement.borderColor}` : 'bg-gray-900/50 border-gray-800'
    }`}>
      {!earned && (
        <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center z-10">
          <Lock className="w-6 h-6 text-gray-600" />
        </div>
      )}
      <div className={`text-3xl mb-2 ${earned ? '' : 'grayscale opacity-30'}`}>{achievement.icon}</div>
      <p className={`text-sm font-bold ${earned ? achievement.color : 'text-gray-600'}`}>{achievement.name}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{achievement.desc}</p>
      {earned && earnedAt && (
        <p className="text-xs text-gray-600 mt-1">
          {new Date(earnedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </p>
      )}
      {earned && (
        <button
          onClick={onShare}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-gray-700 transition-colors"
        >
          <Share2 className="w-3 h-3 text-gray-400" />
        </button>
      )}
    </div>
  );
}

export default function ConquistasPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [earnedMap, setEarnedMap] = useState<EarnedMap>({});
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Atleta');
  const [totalDays, setTotalDays] = useState(0);
  const [sharing, setSharing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isChecking) loadData();
  }, [isChecking]);

  const loadData = async () => {
    const [achievements, progress, userData] = await Promise.all([
      getUserAchievements(),
      getWorkoutProgress(),
      getUserData(),
    ]);
    const map: EarnedMap = {};
    achievements.forEach(a => { map[a.achievement_key] = a.earned_at || new Date().toISOString(); });
    setEarnedMap(map);
    setTotalDays(progress?.days || 0);
    setUserName(userData?.username || userData?.name || 'Atleta');
    setLoading(false);
  };

  const earnedCount = Object.keys(earnedMap).length;

  const shareAchievement = async (achievement: typeof ACHIEVEMENTS[0]) => {
    setSharing(true);
    try {
      const canvas = canvasRef.current!;
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d')!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(0.5, '#111827');
      grad.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      // Yellow glow circle
      const glow = ctx.createRadialGradient(540, 420, 50, 540, 420, 350);
      glow.addColorStop(0, 'rgba(234,179,8,0.15)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1080, 1080);

      // Border
      ctx.strokeStyle = '#EAB308';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, 1000, 1000);

      // Brand name
      ctx.fillStyle = '#EAB308';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FIT SMART 360°', 540, 120);

      // Achievement icon (large text)
      ctx.font = '220px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(achievement.icon, 540, 460);

      // Achievement name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(achievement.name, 540, 560);

      // Description
      ctx.fillStyle = '#9ca3af';
      ctx.font = '38px system-ui, sans-serif';
      ctx.fillText(achievement.desc, 540, 630);

      // User name
      ctx.fillStyle = '#EAB308';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.fillText(userName, 540, 740);

      // Stats
      ctx.fillStyle = '#6b7280';
      ctx.font = '34px system-ui, sans-serif';
      ctx.fillText(`${totalDays} treinos concluídos · ${earnedCount} conquistas`, 540, 810);

      // Footer
      ctx.fillStyle = '#374151';
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillText('fitsmart360.app', 540, 980);

      // Convert to blob and share
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'conquista-fit-smart.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Conquistei "${achievement.name}" no Fit Smart 360!`,
            text: `${achievement.desc} — ${totalDays} treinos concluídos! 💪`,
            files: [file],
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `conquista-${achievement.key}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (e) {
      console.error('Erro ao compartilhar:', e);
    } finally {
      setSharing(false);
    }
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Award className="w-10 h-10 text-purple-400 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <canvas ref={canvasRef} className="hidden" />

      <header className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/dashboard')} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl">Conquistas</h1>
            <p className="text-xs text-gray-500">{earnedCount} de {ACHIEVEMENTS.length} desbloqueadas</p>
          </div>
          <Award className="w-6 h-6 text-purple-400 ml-auto" />
        </div>
      </header>

      <div className="p-4 space-y-5 max-w-lg mx-auto">

        {/* Progress bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-lg">{userName}</p>
              <p className="text-xs text-gray-500">{totalDays} treinos · {earnedCount} medalhas</p>
            </div>
            <div className="text-right">
              <p className="font-stats text-3xl font-bold text-purple-400">{earnedCount}</p>
              <p className="text-xs text-gray-500">/ {ACHIEVEMENTS.length}</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
              style={{ width: `${(earnedCount / ACHIEVEMENTS.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 text-right">{Math.round((earnedCount / ACHIEVEMENTS.length) * 100)}% completo</p>
        </div>

        {sharing && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center">
            <p className="text-sm text-purple-400">Gerando imagem para compartilhar...</p>
          </div>
        )}

        {/* Achievements grid */}
        <div>
          <h2 className="font-bold text-base mb-3">Todas as medalhas</h2>
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map(ach => (
              <AchievementCard
                key={ach.key}
                achievement={ach}
                earned={!!earnedMap[ach.key]}
                earnedAt={earnedMap[ach.key]}
                onShare={() => shareAchievement(ach)}
              />
            ))}
          </div>
        </div>

        {/* Share tip */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <Share2 className="w-5 h-5 text-gray-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Toque no ícone de compartilhar em qualquer medalha desbloqueada para criar uma imagem para o Instagram ou Stories.</p>
        </div>
      </div>
    </div>
  );
}
