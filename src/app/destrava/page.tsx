'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Pause, Play, Square, PersonStanding, Zap, ChevronDown, Bike, Activity,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/use-require-auth';

const DestravaMapClient = dynamic(() => import('@/components/DestravaMapClient'), { ssr: false });

type Status = 'idle' | 'acquiring' | 'recording' | 'paused' | 'completed';
type ActivityType = 'Corrida' | 'Caminhada' | 'Ciclismo';

const ACTIVITY_TYPES: { label: ActivityType; Icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { label: 'Corrida',   Icon: Zap,             color: 'text-orange-400' },
  { label: 'Caminhada', Icon: PersonStanding,   color: 'text-green-400'  },
  { label: 'Ciclismo',  Icon: Bike,             color: 'text-blue-400'   },
];

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPace(distKm: number, secs: number): string {
  if (distKm < 0.01 || secs < 1) return "--'--\"";
  const paceSecPerKm = secs / distKm;
  const pm = Math.floor(paceSecPerKm / 60);
  const ps = Math.floor(paceSecPerKm % 60);
  return `${pm}'${String(ps).padStart(2, '0')}"`;
}

export default function DestravaPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();

  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [activityType, setActivityType] = useState<ActivityType>('Corrida');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const statusRef = useRef<Status>('idle');
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPosRef = useRef<[number, number] | null>(null);

  // Timer management via status
  useEffect(() => {
    statusRef.current = status;
    if (status === 'recording') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      };
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, [status]);

  // Coarse initial position to center map before recording
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      p => setPosition([p.coords.latitude, p.coords.longitude]),
      () => {},
      { timeout: 6000, maximumAge: 120000, enableHighAccuracy: false }
    );
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const onGpsUpdate = useCallback((pos: GeolocationPosition) => {
    const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
    setPosition(coords);
    const cur = statusRef.current;
    if (cur === 'acquiring') {
      statusRef.current = 'recording';
      setStatus('recording');
      lastPosRef.current = coords;
      setRoute([coords]);
    } else if (cur === 'recording') {
      if (lastPosRef.current) {
        const d = haversineKm(lastPosRef.current, coords);
        if (d > 0.005) {
          setDistance(prev => prev + d);
          setRoute(r => [...r, coords]);
          lastPosRef.current = coords;
        }
      } else {
        lastPosRef.current = coords;
        setRoute(r => [...r, coords]);
      }
    }
    // paused: update marker but no route/distance
  }, []);

  const onGpsError = useCallback((err: GeolocationPositionError) => {
    const msg = err.code === 1
      ? 'Permissão de GPS negada. Verifique as configurações.'
      : 'Não foi possível obter o GPS. Tente ao ar livre.';
    setGpsError(msg);
    setStatus('idle');
  }, []);

  const startRecording = useCallback(() => {
    setGpsError(null);
    setElapsed(0);
    setDistance(0);
    setRoute([]);
    lastPosRef.current = null;
    setStatus('acquiring');
    watchIdRef.current = navigator.geolocation.watchPosition(onGpsUpdate, onGpsError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000,
    });
  }, [onGpsUpdate, onGpsError]);

  const pauseActivity = useCallback(() => {
    lastPosRef.current = null;
    setStatus('paused');
  }, []);

  const resumeActivity = useCallback(() => {
    setStatus('recording');
  }, []);

  const finishActivity = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus('completed');
  }, []);

  const activityCfg = ACTIVITY_TYPES.find(a => a.label === activityType)!;

  if (isChecking) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#FC4C02] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Tela de resumo ──────────────────────────────────────────────
  if (status === 'completed') {
    return (
      <div className="h-screen bg-gray-950 text-white flex flex-col">
        <header className="flex items-center gap-3 p-4 border-b border-gray-800">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-heading text-3xl text-[#FC4C02] tracking-wide">Destrava</span>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          <div className="w-24 h-24 rounded-full bg-[#FC4C02]/15 border-2 border-[#FC4C02]/40 flex items-center justify-center">
            <activityCfg.Icon className="w-12 h-12 text-[#FC4C02]" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold mb-1">Atividade concluída!</p>
            <p className="text-gray-400">{activityType}</p>
          </div>

          <div className="w-full grid grid-cols-3 bg-gray-900 rounded-2xl overflow-hidden">
            <div className="p-5 text-center">
              <p className="font-stats text-2xl font-black tabular-nums">{formatTime(elapsed)}</p>
              <p className="text-xs text-gray-500 mt-1">Tempo</p>
            </div>
            <div className="p-5 text-center border-x border-gray-800">
              <p className="font-stats text-2xl font-black tabular-nums">{distance.toFixed(2).replace('.', ',')}</p>
              <p className="text-xs text-gray-500 mt-1">Distância (km)</p>
            </div>
            <div className="p-5 text-center">
              <p className="font-stats text-2xl font-black tabular-nums">{formatPace(distance, elapsed)}</p>
              <p className="text-xs text-gray-500 mt-1">Ritmo</p>
            </div>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 rounded-full bg-[#FC4C02] text-white font-bold text-base active:scale-95 transition-transform"
            >
              Salvar Atividade
            </button>
            <button
              onClick={() => { setStatus('idle'); setElapsed(0); setDistance(0); setRoute([]); }}
              className="w-full py-4 rounded-full border border-gray-700 text-gray-400 font-bold text-base active:scale-95 transition-transform"
            >
              Descartar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tela de gravação ────────────────────────────────────────────
  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header — só no idle */}
      {status === 'idle' && (
        <header className="flex items-center gap-3 px-4 pt-4 pb-2 z-10">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-heading text-4xl text-[#FC4C02] tracking-wide">Destrava</span>
        </header>
      )}

      {/* Mapa */}
      <div className="flex-1 relative min-h-0">
        {/* GPS acquiring bar */}
        {status === 'acquiring' && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-blue-600 px-4 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-white">Adquirindo GPS</span>
          </div>
        )}

        {/* Botão voltar durante gravação */}
        {(status === 'recording' || status === 'paused') && (
          <button
            onClick={() => router.push('/dashboard')}
            className="absolute top-3 left-3 z-20 w-10 h-10 bg-gray-900/80 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <ChevronDown className="w-5 h-5 text-white" />
          </button>
        )}

        <DestravaMapClient position={position} route={route} />
      </div>

      {/* GPS error */}
      {gpsError && (
        <div className="bg-red-900/80 px-4 py-2 text-sm text-red-200 text-center">
          {gpsError}
        </div>
      )}

      {/* Painel inferior */}
      <div className="bg-gray-950 border-t border-gray-800 flex-shrink-0">
        {/* Barra de status Parado */}
        {status === 'paused' && (
          <div className="bg-yellow-500 px-4 py-2 flex items-center justify-between">
            <span className="font-bold text-black text-sm tracking-wide">Parado</span>
            <div className="w-2 h-2 rounded-full bg-black" />
          </div>
        )}

        {/* Nome da atividade durante gravação */}
        {status === 'recording' && (
          <div className="px-4 py-2 flex items-center justify-between border-b border-gray-800">
            <span className="text-sm font-semibold text-gray-300">{activityType}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FC4C02] animate-pulse" />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 px-4 py-4 gap-2">
          <div>
            <p className="font-stats text-3xl font-black tabular-nums leading-none">{formatTime(elapsed)}</p>
            <p className="text-xs text-gray-500 mt-1">Tempo</p>
          </div>
          <div className="text-center">
            <p className="font-stats text-3xl font-black tabular-nums leading-none">
              {distance.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-gray-500 mt-1">Distância (km)</p>
          </div>
          <div className="text-right">
            <p className="font-stats text-3xl font-black tabular-nums leading-none">
              {(status === 'recording' || status === 'paused') ? formatPace(distance, elapsed) : "--'--\""}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ritmo</p>
          </div>
        </div>

        {/* Controles */}
        <div className="px-6 pb-8 pt-2">
          {(status === 'idle' || status === 'acquiring') && (
            <div className="flex items-center justify-between">
              {/* Tipo de atividade */}
              <button
                onClick={() => setShowTypePicker(true)}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center">
                  <activityCfg.Icon className={`w-7 h-7 ${activityCfg.color}`} />
                </div>
                <span className="text-xs text-gray-400">{activityType}</span>
              </button>

              {/* Botão gravar */}
              <button
                onClick={startRecording}
                disabled={status === 'acquiring'}
                className="w-20 h-20 rounded-full bg-[#FC4C02] flex items-center justify-center shadow-xl shadow-[#FC4C02]/30 disabled:opacity-60 active:scale-95 transition-transform"
              >
                {status === 'acquiring' ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-9 h-9 text-white fill-white ml-1" />
                )}
              </button>

              {/* Placeholder rota */}
              <div className="flex flex-col items-center gap-1.5 opacity-25">
                <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-gray-400" />
                </div>
                <span className="text-xs text-gray-500">Rota</span>
              </div>
            </div>
          )}

          {status === 'recording' && (
            <div className="flex justify-center">
              <button
                onClick={pauseActivity}
                className="w-20 h-20 rounded-full bg-[#FC4C02] flex items-center justify-center shadow-xl shadow-[#FC4C02]/30 active:scale-95 transition-transform"
              >
                <Pause className="w-9 h-9 text-white fill-white" />
              </button>
            </div>
          )}

          {status === 'paused' && (
            <div className="flex gap-4">
              <button
                onClick={resumeActivity}
                className="flex-1 py-4 rounded-full bg-[#FC4C02] text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Play className="w-5 h-5 fill-white" />
                Retomar
              </button>
              <button
                onClick={finishActivity}
                className="flex-1 py-4 rounded-full bg-gray-800 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Square className="w-5 h-5 fill-white" />
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de tipo de atividade */}
      {showTypePicker && (
        <div
          className="absolute inset-0 bg-black/70 z-50 flex items-end"
          onClick={() => setShowTypePicker(false)}
        >
          <div
            className="w-full bg-gray-900 rounded-t-3xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
            <h2 className="text-lg font-bold mb-4">Tipo de atividade</h2>
            <div className="space-y-2">
              {ACTIVITY_TYPES.map(({ label, Icon, color }) => (
                <button
                  key={label}
                  onClick={() => { setActivityType(label); setShowTypePicker(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 ${
                    activityType === label
                      ? 'bg-[#FC4C02]/15 border border-[#FC4C02]/40'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <span className="font-semibold text-base">{label}</span>
                  {activityType === label && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-[#FC4C02] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
