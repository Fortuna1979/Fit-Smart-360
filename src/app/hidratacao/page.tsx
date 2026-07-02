'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Droplets, Plus, Minus, Bell, BellOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserData, getHydrationLog, upsertHydrationLog } from '@/lib/supabase-helpers';
import { useRequireAuth } from '@/hooks/use-require-auth';

function calcGoalGlasses(weightKg?: number): number {
  if (!weightKg) return 8;
  // 35ml por kg de peso, dividido por 250ml por copo
  return Math.round((weightKg * 35) / 250);
}

export default function HidratacaoPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [glasses, setGlasses] = useState(0);
  const [goalGlasses, setGoalGlasses] = useState(8);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderInterval, setReminderInterval] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isChecking) init();
  }, [isChecking]);

  const sendToSW = (message: object) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  };

  const init = async () => {
    const [userData, logData] = await Promise.all([getUserData(), getHydrationLog()]);
    const goal = calcGoalGlasses(userData?.weight);
    setGoalGlasses(logData?.daily_goal_glasses || goal);
    setGlasses(logData?.glasses_drunk || 0);
    const enabled = logData?.reminders_enabled || false;
    const interval = logData?.reminder_interval_hours || 2;
    setRemindersEnabled(enabled);
    setReminderInterval(interval);
    // Re-ativa o lembrete no SW ao abrir o app (caso o SW tenha sido reiniciado)
    if (enabled) {
      sendToSW({ type: 'ENABLE_REMINDERS', intervalHours: interval });
    }
    setLoading(false);
  };

  const save = async (updates: { glasses_drunk?: number; daily_goal_glasses?: number; reminders_enabled?: boolean; reminder_interval_hours?: number }) => {
    setSaving(true);
    await upsertHydrationLog({ glasses_drunk: glasses, daily_goal_glasses: goalGlasses, reminders_enabled: remindersEnabled, reminder_interval_hours: reminderInterval, ...updates });
    setSaving(false);
  };

  const addGlass = async () => {
    if (glasses >= goalGlasses) return;
    const next = glasses + 1;
    setGlasses(next);
    await save({ glasses_drunk: next });
  };

  const removeGlass = async () => {
    if (glasses <= 0) return;
    const next = glasses - 1;
    setGlasses(next);
    await save({ glasses_drunk: next });
  };

  const toggleReminders = async () => {
    const next = !remindersEnabled;
    if (next) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert('Permita notificações nas configurações do navegador para ativar os lembretes.');
        return;
      }
      sendToSW({ type: 'ENABLE_REMINDERS', intervalHours: reminderInterval });
    } else {
      sendToSW({ type: 'DISABLE_REMINDERS' });
    }
    setRemindersEnabled(next);
    await save({ reminders_enabled: next });
  };

  const saveSettings = async () => {
    if (remindersEnabled) {
      sendToSW({ type: 'UPDATE_REMINDER_INTERVAL', intervalHours: reminderInterval });
    }
    await save({ daily_goal_glasses: goalGlasses, reminder_interval_hours: reminderInterval });
    setShowSettings(false);
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Droplets className="w-10 h-10 text-blue-400 animate-pulse" />
    </div>
  );

  const pct = Math.min((glasses / goalGlasses) * 100, 100);
  const r = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const mlGoal = goalGlasses * 250;
  const mlDrunk = glasses * 250;

  const waterColor = pct >= 100 ? '#10B981' : pct >= 50 ? '#3B82F6' : '#60A5FA';

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <header className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/dashboard')} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Hidratação</h1>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="ml-auto text-gray-400 hover:text-white">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto">

        {/* Settings panel */}
        {showSettings && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold">Configurações</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Meta diária (copos de 250ml)</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setGoalGlasses(g => Math.max(4, g - 1))} className="w-10 h-10 border border-gray-700 rounded-xl flex items-center justify-center hover:border-yellow-500">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-bold text-yellow-500 w-12 text-center">{goalGlasses}</span>
                <button onClick={() => setGoalGlasses(g => Math.min(20, g + 1))} className="w-10 h-10 border border-gray-700 rounded-xl flex items-center justify-center hover:border-yellow-500">
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500">= {goalGlasses * 250}ml / {(goalGlasses * 0.25).toFixed(1)}L</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Lembrete a cada</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(h => (
                  <button key={h} onClick={() => setReminderInterval(h)}
                    className={`flex-1 py-2 border-2 rounded-xl text-sm font-medium transition-all ${reminderInterval === h ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 text-gray-400'}`}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={saveSettings} className="w-full bg-yellow-500 text-black font-bold hover:bg-yellow-600">
              Salvar
            </Button>
          </div>
        )}

        {/* Circular progress */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
              <circle cx="100" cy="100" r={r} fill="none" stroke="#1f2937" strokeWidth="14" />
              <circle cx="100" cy="100" r={r} fill="none" stroke={waterColor} strokeWidth="14"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Droplets className="w-8 h-8 mb-1" style={{ color: waterColor }} />
              <p className="text-4xl font-bold">{glasses}</p>
              <p className="text-gray-400 text-sm">de {goalGlasses} copos</p>
              <p className="text-xs text-gray-600 mt-1">{Math.round(pct)}%</p>
            </div>
          </div>

          <div className="flex gap-8 mt-4 text-center">
            <div>
              <p className="text-xl font-bold" style={{ color: waterColor }}>{mlDrunk}ml</p>
              <p className="text-xs text-gray-500">consumido</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-500">{mlGoal}ml</p>
              <p className="text-xs text-gray-500">meta</p>
            </div>
          </div>

          {pct >= 100 && (
            <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-2xl px-6 py-3 text-center">
              <p className="text-green-400 font-bold">🎉 Meta atingida! Parabéns!</p>
              <p className="text-xs text-gray-400 mt-1">Excelente hidratação hoje</p>
            </div>
          )}
        </div>

        {/* Glasses visual */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {Array.from({ length: goalGlasses }).map((_, i) => (
              <button key={i} onClick={i < glasses ? removeGlass : addGlass}
                className={`w-8 h-10 rounded-lg border-2 flex items-end justify-center pb-1 transition-all ${i < glasses ? 'border-blue-500 bg-blue-500/20' : 'border-gray-700'}`}>
                <div className={`w-5 rounded-sm transition-all ${i < glasses ? 'h-6 bg-blue-400' : 'h-0'}`} />
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">Toque em um copo para registrar</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={removeGlass} disabled={glasses === 0 || saving} variant="outline"
            className="border-gray-700 text-gray-400 hover:text-white py-5 rounded-2xl">
            <Minus className="w-5 h-5 mr-2" /> Remover
          </Button>
          <Button onClick={addGlass} disabled={glasses >= goalGlasses || saving}
            className="py-5 rounded-2xl font-bold text-black"
            style={{ background: glasses >= goalGlasses ? '#1f2937' : 'linear-gradient(to right, #3B82F6, #60A5FA)' }}>
            <Plus className="w-5 h-5 mr-2" />
            {saving ? 'Salvando...' : 'Beber água'}
          </Button>
        </div>

        {/* Reminder toggle */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {remindersEnabled ? <Bell className="w-5 h-5 text-blue-400" /> : <BellOff className="w-5 h-5 text-gray-500" />}
            <div>
              <p className="text-sm font-semibold">{remindersEnabled ? 'Lembretes ativos' : 'Ativar lembretes'}</p>
              <p className="text-xs text-gray-500">A cada {reminderInterval}h enquanto o app está aberto</p>
            </div>
          </div>
          <button onClick={toggleReminders}
            className={`w-12 h-6 rounded-full transition-colors relative ${remindersEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${remindersEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Tip */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <p className="text-xs text-blue-300">
            💡 <strong>Dica:</strong> Sua meta de {goalGlasses} copos ({(goalGlasses * 0.25).toFixed(1)}L) é calculada com base no seu peso. Beber água regularmente melhora o desempenho no treino e acelera a recuperação muscular.
          </p>
        </div>
      </div>
    </div>
  );
}
