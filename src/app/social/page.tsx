'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Trophy, ThumbsUp, Dumbbell, Globe, GlobeLock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getSocialFeed, toggleKudos, getLeaderboard,
  updatePublicProfile, getUserData,
} from '@/lib/supabase-helpers';
import type { ActivityFeed } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/use-require-auth';

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function workoutTypeIcon(type?: string) {
  if (type === 'calistenia') return '🤸';
  return '🏋️';
}

export default function SocialPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [tab, setTab] = useState<'feed' | 'ranking'>('feed');
  const [feed, setFeed] = useState<ActivityFeed[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ name: string; username?: string; territory_count?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [username, setUsername] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!isChecking) loadData();
  }, [isChecking]);

  const loadData = async () => {
    const [feedData, lbData, userData] = await Promise.all([
      getSocialFeed(40),
      getLeaderboard(),
      getUserData(),
    ]);
    setFeed(feedData);
    setLeaderboard(lbData);
    setIsPublic(userData?.public_profile || false);
    setUsername(userData?.username || userData?.name || '');
    setUsernameInput(userData?.username || userData?.name || '');
    setLoading(false);
  };

  const handleKudos = async (activity: ActivityFeed) => {
    const prev = [...feed];
    setFeed(f => f.map(a => a.id === activity.id ? {
      ...a,
      kudos_count: (a.kudos_count || 0) + (a.user_has_kudos ? -1 : 1),
      user_has_kudos: !a.user_has_kudos,
    } : a));
    try {
      await toggleKudos(activity.id!, activity.user_has_kudos || false);
    } catch {
      setFeed(prev);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    await updatePublicProfile(isPublic, usernameInput.trim() || username);
    setUsername(usernameInput.trim() || username);
    setSavingProfile(false);
    setEditingProfile(false);
    await loadData();
  };

  const togglePublic = async (val: boolean) => {
    setIsPublic(val);
    await updatePublicProfile(val, username);
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Users className="w-10 h-10 text-green-400 animate-pulse" />
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
            <h1 className="text-lg font-bold">Social</h1>
            <p className="text-xs text-gray-500">Comunidade Fit Smart 360</p>
          </div>
          <Users className="w-6 h-6 text-green-400 ml-auto" />
        </div>
      </header>

      <div className="max-w-lg mx-auto">

        {/* Profile / public toggle */}
        <div className="mx-4 mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPublic ? <Globe className="w-5 h-5 text-green-400" /> : <GlobeLock className="w-5 h-5 text-gray-500" />}
              <div>
                <p className="text-sm font-semibold">{username || 'Sem username'}</p>
                <p className="text-xs text-gray-500">{isPublic ? 'Perfil público — aparece no feed' : 'Perfil privado'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditingProfile(true)} className="text-xs text-yellow-500 hover:text-yellow-400">Editar</button>
              <button
                onClick={() => togglePublic(!isPublic)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-green-500' : 'bg-gray-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {editingProfile && (
            <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-400">Nome público (aparece no feed e ranking)</p>
              <input
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="Seu nome ou apelido"
                maxLength={30}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-yellow-500 outline-none"
              />
              <div className="flex gap-2">
                <Button onClick={() => setEditingProfile(false)} variant="outline" size="sm" className="flex-1 border-gray-700 text-gray-400">Cancelar</Button>
                <Button onClick={saveProfile} disabled={savingProfile} size="sm" className="flex-1 bg-yellow-500 text-black font-bold hover:bg-yellow-600">
                  {savingProfile ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-4 mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-1">
          {(['feed', 'ranking'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}>
              {t === 'feed' ? '📋 Feed' : '🏆 Ranking'}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">

          {tab === 'feed' && (
            <>
              {!isPublic && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
                  <Globe className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-yellow-400">Ative o perfil público para aparecer no feed</p>
                  <p className="text-xs text-gray-400 mt-1">Seus treinos serão compartilhados com a comunidade e você poderá dar e receber Kudos.</p>
                </div>
              )}

              {feed.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell className="w-14 h-14 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma atividade ainda</p>
                  <p className="text-xs text-gray-600 mt-1">Complete um treino com perfil público para aparecer aqui</p>
                </div>
              ) : (
                feed.map(activity => (
                  <div key={activity.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                        {activity.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm truncate">{activity.user_name}</p>
                          <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{timeAgo(activity.created_at || '')}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base">{workoutTypeIcon(activity.workout_type)}</span>
                          <p className="text-sm text-gray-300 truncate">{activity.workout_name}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {activity.exercises_count} exercícios{activity.duration ? ` · ${activity.duration}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
                      <button
                        onClick={() => handleKudos(activity)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          activity.user_has_kudos
                            ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                            : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-yellow-500/30'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Kudos{(activity.kudos_count || 0) > 0 ? ` ${activity.kudos_count}` : ''}</span>
                      </button>
                      {activity.workout_type === 'calistenia' && (
                        <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">Calistenia</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'ranking' && (
            <div className="space-y-2">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-2">
                <p className="text-xs text-gray-500 text-center">Ranking por territórios dominados — ative o perfil público para aparecer</p>
              </div>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-14 h-14 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum atleta no ranking ainda</p>
                  <p className="text-xs text-gray-600 mt-1">Domine territórios para subir no ranking</p>
                </div>
              ) : (
                leaderboard.map((user, i) => (
                  <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${
                    i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                    i === 1 ? 'bg-gray-400/5 border-gray-500/30' :
                    i === 2 ? 'bg-orange-500/5 border-orange-500/20' :
                    'bg-gray-900 border-gray-800'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-500 text-black' :
                      i === 1 ? 'bg-gray-500 text-white' :
                      i === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{user.username || user.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${i === 0 ? 'text-yellow-500' : 'text-gray-300'}`}>{user.territory_count || 0}</p>
                      <p className="text-xs text-gray-500">territórios</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
