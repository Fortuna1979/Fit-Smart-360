'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Pause, Play, Square, PersonStanding, Zap, ChevronDown, Bike, Activity,
  Layers, Compass, Lock, Check, X,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getUserData } from '@/lib/supabase-helpers';

const DestravaMapClient = dynamic(() => import('@/components/DestravaMapClient'), { ssr: false });

type Status = 'idle' | 'acquiring' | 'recording' | 'paused' | 'completed';
type ActivityType = 'Corrida' | 'Caminhada' | 'Ciclismo';

const MAP_BASE_STYLES = [
  { id: 'padrao',   label: 'Padrão',       premium: false, preview: '#e8e0d5' },
  { id: 'satelite', label: 'Satélite',     premium: false, preview: '#2d4a1e' },
  { id: 'hibrido',  label: 'Híbrido',      premium: false, preview: '#3a5a2a' },
  { id: 'noturno',  label: 'Noturno',      premium: true,  preview: '#1a1a2e' },
  { id: 'topo',     label: 'Topográfico',  premium: true,  preview: '#d4c9a8' },
];

const MAP_OVERLAYS = [
  { id: 'poi',       label: 'Pontos de interesse', premium: false },
  { id: 'ciclovias', label: 'Ciclovias',            premium: false },
];

const MAP_TERRAIN = [
  { id: 'aspecto',    label: 'Aspecto',                  premium: true },
  { id: 'avalanche',  label: 'Inclinação de avalanche',  premium: true },
  { id: 'inclinacao', label: 'Inclinação',               premium: true },
];

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

  const [gpsConsent, setGpsConsent] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [isDay, setIsDay] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [activityType, setActivityType] = useState<ActivityType>('Corrida');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  // Mapa e bússola
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'basic' | 'premium'>('free');
  const [mapStyleId, setMapStyleId] = useState('padrao');
  const [activeOverlays, setActiveOverlays] = useState<string[]>([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [compassMode, setCompassMode] = useState(false);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('destrava_gps_consent');
    setGpsConsent(stored === 'true');
  }, []);

  // Busca plano do usuário
  useEffect(() => {
    getUserData().then(d => {
      if (d?.subscription_plan) setSubscriptionPlan(d.subscription_plan as 'free' | 'basic' | 'premium');
    });
  }, []);

  // Bússola — escuta orientação do dispositivo quando ativo
  useEffect(() => {
    if (!compassMode) return;
    const handler = (e: DeviceOrientationEvent) => {
      const h = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      if (h != null) { setCompassHeading(h); return; }
      if (e.alpha != null) setCompassHeading((360 - e.alpha) % 360);
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [compassMode]);

  // Claro: 06:30 → 18:29 BRT | Escuro: 18:30 → 06:29 BRT
  // BRT = UTC-3 fixo (Brasil aboliu horário de verão em 2019)
  // Usa getUTCHours sobre (agora - 3h) → independe do fuso do dispositivo
  useEffect(() => {
    const check = () => {
      const brtMs = Date.now() - 3 * 60 * 60 * 1000;
      const d = new Date(brtMs);
      const total = d.getUTCHours() * 60 + d.getUTCMinutes();
      setIsDay(total >= 390 && total < 1110); // 390 = 06:30, 1110 = 18:30
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const acceptGpsConsent = () => {
    localStorage.setItem('destrava_gps_consent', 'true');
    setGpsConsent(true);
  };

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

  const handleMapStyle = (id: string, premium: boolean) => {
    if (premium && subscriptionPlan !== 'premium') { setShowPremiumModal(true); return; }
    setMapStyleId(id);
  };

  const handleOverlay = (id: string, premium: boolean) => {
    if (premium && subscriptionPlan !== 'premium') { setShowPremiumModal(true); return; }
    setActiveOverlays(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleCompassToggle = async () => {
    if (compassMode) {
      setCompassMode(false);
      setCompassHeading(null);
      return;
    }
    // iOS 13+ precisa de permissão explícita
    const DOE = DeviceOrientationEvent as DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    if (typeof DOE.requestPermission === 'function') {
      try {
        const perm = await DOE.requestPermission();
        if (perm !== 'granted') return;
      } catch { return; }
    }
    setCompassMode(true);
  };

  const activityCfg = ACTIVITY_TYPES.find(a => a.label === activityType)!;

  if (isChecking || gpsConsent === null) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#FC4C02] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Modal de consentimento GPS (LGPD art. 11) ───────────────────
  if (!gpsConsent) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDay ? 'bg-gray-100 text-gray-900' : 'bg-black text-white'}`}>
        <div className={`w-full max-w-md rounded-3xl p-6 space-y-5 border ${isDay ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className={isDay ? 'text-gray-500' : 'text-gray-400'}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-heading text-2xl text-[#FC4C02]">Destrava</h1>
          </div>
          <div className="w-16 h-16 bg-[#FC4C02]/15 rounded-2xl flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 text-[#FC4C02]" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Acesso à localização GPS</h2>
            <p className={`text-sm leading-relaxed ${isDay ? 'text-gray-500' : 'text-gray-400'}`}>
              O Destrava usa o GPS do seu dispositivo para medir distância, ritmo e traçar sua
              rota durante corridas, caminhadas e pedaladas.
            </p>
          </div>
          <div className={`rounded-xl p-4 space-y-2 text-sm border ${isDay ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-gray-800/60 border-gray-700 text-gray-300'}`}>
            <p className={`font-semibold ${isDay ? 'text-gray-900' : 'text-white'}`}>O que fazemos com sua localização:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Calcular distância e ritmo durante o treino</li>
              <li>Exibir seu trajeto no mapa durante a atividade</li>
              <li>Registrar células de território conquistado (~250m de precisão)</li>
            </ul>
            <p className={`font-semibold mt-2 ${isDay ? 'text-gray-900' : 'text-white'}`}>O que NÃO fazemos:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Não rastreamos sua localização em segundo plano</li>
              <li>Não compartilhamos coordenadas exatas com terceiros</li>
            </ul>
          </div>
          <p className={`text-xs text-center ${isDay ? 'text-gray-400' : 'text-gray-500'}`}>
            Você pode revogar esse consentimento a qualquer momento nas configurações do seu
            dispositivo. Para saber mais, leia nossa{' '}
            <button onClick={() => router.push('/privacidade')} className="text-yellow-500 hover:underline">
              Política de Privacidade
            </button>.
          </p>
          <button
            onClick={acceptGpsConsent}
            className="w-full bg-[#FC4C02] hover:bg-[#e04400] text-white font-bold py-4 rounded-2xl transition-colors"
          >
            Entendi e aceito — iniciar Destrava
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className={`w-full text-sm py-2 ${isDay ? 'text-gray-400' : 'text-gray-400'}`}
          >
            Voltar sem aceitar
          </button>
        </div>
      </div>
    );
  }

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
  const T = isDay ? {
    page:      'bg-white text-gray-900',
    headerBtn: 'text-gray-500 hover:text-gray-900',
    backBtn:   'bg-white/80 text-gray-700',
    panel:     'bg-gray-50 border-gray-200',
    recBar:    'border-gray-200',
    recLabel:  'text-gray-700',
    iconBtn:   'bg-gray-100',
    iconLabel: 'text-gray-500',
    finishBtn: 'bg-gray-200 text-gray-900',
  } : {
    page:      'bg-black text-white',
    headerBtn: 'text-gray-400 hover:text-white',
    backBtn:   'bg-gray-900/80 text-white',
    panel:     'bg-gray-950 border-gray-800',
    recBar:    'border-gray-800',
    recLabel:  'text-gray-300',
    iconBtn:   'bg-gray-800',
    iconLabel: 'text-gray-400',
    finishBtn: 'bg-gray-800 text-white',
  };

  return (
    <div className={`h-screen ${T.page} flex flex-col overflow-hidden`}>
      {/* Header — só no idle */}
      {status === 'idle' && (
        <header className="flex items-center gap-3 px-4 pt-4 pb-2 z-10">
          <button onClick={() => router.push('/dashboard')} className={T.headerBtn}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-heading text-4xl text-[#FC4C02] tracking-wide">Destrava</span>
        </header>
      )}

      {/* Mapa */}
      <div className="flex-1 relative min-h-0">
        {/* GPS acquiring bar */}
        {status === 'acquiring' && (
          <div className="absolute top-0 left-0 right-0 z-[1000] bg-blue-600 px-4 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-white">Adquirindo GPS</span>
          </div>
        )}

        {/* Botão voltar durante gravação */}
        {(status === 'recording' || status === 'paused') && (
          <button
            onClick={() => router.push('/dashboard')}
            className={`absolute top-3 left-3 z-[1000] w-10 h-10 ${T.backBtn} rounded-full flex items-center justify-center backdrop-blur-sm`}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}

        <DestravaMapClient
          position={position}
          route={route}
          isDay={isDay}
          mapStyleId={mapStyleId}
          overlays={activeOverlays}
          compassHeading={compassHeading}
        />

        {/* 3 botões laterais */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => setShowMapPicker(true)}
            className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Layers className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => setShowPremiumModal(true)}
            className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="text-xs font-black text-gray-700">3D</span>
          </button>
          <button
            onClick={handleCompassToggle}
            className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform ${compassMode ? 'bg-[#FC4C02]' : 'bg-white'}`}
          >
            <Compass className={`w-5 h-5 ${compassMode ? 'text-white' : 'text-gray-700'}`} />
          </button>
        </div>
      </div>

      {/* GPS error */}
      {gpsError && (
        <div className="bg-red-900/80 px-4 py-2 text-sm text-red-200 text-center">
          {gpsError}
        </div>
      )}

      {/* Painel inferior */}
      <div className={`${T.panel} border-t flex-shrink-0`}>
        {/* Barra de status Parado */}
        {status === 'paused' && (
          <div className="bg-yellow-500 px-4 py-2 flex items-center justify-between">
            <span className="font-bold text-black text-sm tracking-wide">Parado</span>
            <div className="w-2 h-2 rounded-full bg-black" />
          </div>
        )}

        {/* Nome da atividade durante gravação */}
        {status === 'recording' && (
          <div className={`px-4 py-2 flex items-center justify-between border-b ${T.recBar}`}>
            <span className={`text-sm font-semibold ${T.recLabel}`}>{activityType}</span>
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
                <div className={`w-14 h-14 rounded-full ${T.iconBtn} flex items-center justify-center`}>
                  <activityCfg.Icon className={`w-7 h-7 ${activityCfg.color}`} />
                </div>
                <span className={`text-xs ${T.iconLabel}`}>{activityType}</span>
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
                <div className={`w-14 h-14 rounded-full ${T.iconBtn} flex items-center justify-center`}>
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
                className={`flex-1 py-4 rounded-full ${T.finishBtn} font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform`}
              >
                <Square className="w-5 h-5 fill-current" />
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de tipos de mapa */}
      {showMapPicker && (
        <div className="absolute inset-0 bg-black/60 z-[2000] flex items-end" onClick={() => setShowMapPicker(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-4 mb-2" />
            <div className="px-5 pb-8 pt-2">

              {/* Tipos de mapa */}
              <h2 className="text-base font-bold text-gray-900 mb-3">Tipos de mapa</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 mb-5">
                {MAP_BASE_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { handleMapStyle(s.id, s.premium); if (!s.premium || subscriptionPlan === 'premium') setShowMapPicker(false); }}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2"
                      style={{ borderColor: mapStyleId === s.id ? '#FC4C02' : '#e5e7eb', background: s.preview }}>
                      {s.premium && subscriptionPlan !== 'premium' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                      )}
                      {mapStyleId === s.id && (
                        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#FC4C02] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 font-medium">{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Camadas */}
              <h2 className="text-base font-bold text-gray-900 mb-3">Camadas</h2>
              <div className="flex gap-3 mb-5">
                {MAP_OVERLAYS.map(o => {
                  const active = activeOverlays.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => handleOverlay(o.id, o.premium)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform`}
                    >
                      <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center ${active ? 'border-[#FC4C02] bg-[#FC4C02]/10' : 'border-gray-200 bg-gray-50'}`}>
                        {active
                          ? <Check className="w-6 h-6 text-[#FC4C02]" strokeWidth={3} />
                          : <div className="w-6 h-6 rounded border-2 border-gray-400" />
                        }
                      </div>
                      <span className="text-xs text-gray-700 font-medium text-center leading-tight w-16">{o.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Terreno */}
              <h2 className="text-base font-bold text-gray-900 mb-3">Terreno</h2>
              <div className="flex gap-3">
                {MAP_TERRAIN.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleOverlay(t.id, t.premium)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <div className="relative w-16 h-16 rounded-xl border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-700 font-medium text-center leading-tight w-16">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Premium */}
      {showPremiumModal && (
        <div className="absolute inset-0 bg-black/70 z-[2000] flex items-end" onClick={() => setShowPremiumModal(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <button onClick={() => setShowPremiumModal(false)} className="absolute top-5 right-5">
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Recurso Premium</h2>
              <p className="text-sm text-gray-500">Este recurso está disponível nos planos Básico e Premium do Fit Smart 360°.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" strokeWidth={3} />
                <span className="text-sm text-gray-700">Modos de mapa exclusivos (Noturno, Topográfico)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" strokeWidth={3} />
                <span className="text-sm text-gray-700">Camadas de terreno (Aspecto, Inclinação)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" strokeWidth={3} />
                <span className="text-sm text-gray-700">Modo 3D e visualizações avançadas</span>
              </div>
            </div>
            <button
              onClick={() => { setShowPremiumModal(false); router.push('/#planos'); }}
              className="w-full mt-6 py-4 rounded-2xl bg-yellow-400 text-black font-bold text-base active:scale-95 transition-transform"
            >
              Ver planos
            </button>
          </div>
        </div>
      )}

      {/* Modal de tipo de atividade */}
      {showTypePicker && (
        <div
          className="absolute inset-0 bg-black/70 z-[2000] flex items-end"
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
