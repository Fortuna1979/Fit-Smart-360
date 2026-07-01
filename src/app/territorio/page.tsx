'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Loader2, Flag, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { claimTerritory, getNearbyTerritories, getUserData, getUserId } from '@/lib/supabase-helpers';
import type { Territory } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/use-require-auth';

const TerritoryMapClient = dynamic(() => import('@/components/TerritoryMapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-gray-900 rounded-2xl flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
    </div>
  ),
});

export default function TerritorioPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [myUserId, setMyUserId] = useState<string | undefined>();
  const [myTerritoryCount, setMyTerritoryCount] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{ isNew: boolean; msg: string } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (!isChecking) initPage();
  }, [isChecking]);

  const initPage = async () => {
    const [uid, userData] = await Promise.all([getUserId(), getUserData()]);
    setMyUserId(uid || undefined);
    setMyTerritoryCount(userData?.territory_count || 0);
    setLoading(false);
    getLocation();
  };

  const getLocation = useCallback(() => {
    setLoadingLocation(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('GPS não disponível neste dispositivo');
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        setLoadingLocation(false);
        const nearby = await getNearbyTerritories(coords[0], coords[1], 10);
        setTerritories(nearby);
      },
      err => {
        setGpsError(err.code === 1 ? 'Permissão de GPS negada. Permita o acesso à localização.' : 'Não foi possível obter sua localização.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  const handleClaim = async () => {
    if (!location) { getLocation(); return; }
    setClaiming(true);
    setClaimResult(null);
    const result = await claimTerritory(location[0], location[1]);
    if (result.success) {
      if (result.isNew) {
        setMyTerritoryCount(c => c + 1);
        setClaimResult({ isNew: true, msg: 'Território dominado! Este era um território livre.' });
      } else {
        setClaimResult({ isNew: false, msg: 'Este território já é seu! Área reafirmada.' });
      }
      const nearby = await getNearbyTerritories(location[0], location[1], 10);
      setTerritories(nearby);
    } else {
      setClaimResult({ isNew: false, msg: 'Não foi possível dominar o território. Tente novamente.' });
    }
    setClaiming(false);
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <MapPin className="w-10 h-10 text-yellow-500 animate-pulse" />
    </div>
  );

  const myTerritories = territories.filter(t => t.user_id === myUserId);
  const othersCount = territories.filter(t => t.user_id !== myUserId).length;

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <header className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/dashboard')} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Modo Território</h1>
            <p className="text-xs text-gray-500">Domine áreas treinando ao ar livre</p>
          </div>
          <span className="ml-auto text-xl">🗺️</span>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{myTerritoryCount}</p>
            <p className="text-xs text-gray-400">meus total</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{myTerritories.length}</p>
            <p className="text-xs text-gray-400">nesta área</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{othersCount}</p>
            <p className="text-xs text-gray-400">de outros</p>
          </div>
        </div>

        {/* Map */}
        {gpsError ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center space-y-3">
            <MapPin className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-sm text-red-300">{gpsError}</p>
            <Button onClick={getLocation} variant="outline" className="border-red-500/50 text-red-400 hover:text-red-300">
              <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
            </Button>
          </div>
        ) : loadingLocation ? (
          <div className="w-full h-80 bg-gray-900 rounded-2xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            <p className="text-sm text-gray-400">Obtendo sua localização...</p>
          </div>
        ) : location ? (
          <div className="rounded-2xl overflow-hidden border border-gray-800" style={{ height: 320 }}>
            <TerritoryMapClient center={location} territories={territories} myUserId={myUserId} />
          </div>
        ) : null}

        {/* Legend */}
        {location && (
          <div className="flex items-center gap-4 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-yellow-500/40 border-2 border-yellow-500 rounded" />
              <span className="text-xs text-gray-400">Meu território</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-red-500/25 border-2 border-red-500 rounded" />
              <span className="text-xs text-gray-400">Território de outro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-yellow-500 rounded-full" />
              <span className="text-xs text-gray-400">Você</span>
            </div>
          </div>
        )}

        {/* Claim result */}
        {claimResult && (
          <div className={`rounded-2xl p-4 border ${claimResult.isNew ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-900 border-gray-800'}`}>
            <p className={`text-sm font-semibold ${claimResult.isNew ? 'text-green-400' : 'text-gray-300'}`}>
              {claimResult.isNew ? '🏆 ' : 'ℹ️ '}{claimResult.msg}
            </p>
          </div>
        )}

        {/* Claim button */}
        <Button
          onClick={handleClaim}
          disabled={claiming || loadingLocation}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-6 rounded-2xl text-base disabled:opacity-50"
        >
          {claiming ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Dominando território...</>
          ) : (
            <><Flag className="w-5 h-5 mr-2" /> Dominar Este Território</>
          )}
        </Button>

        {/* How it works */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-sm">Como funciona?</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <p>📍 Cada território é uma célula de ~277m × 277m (quadra urbana)</p>
            <p>🏃 Vá até qualquer local e toque em &quot;Dominar Este Território&quot;</p>
            <p>👑 Se outro atleta foi ao mesmo local depois, ele conquista o território</p>
            <p>🗺️ Territórios marcados em amarelo são seus — em vermelho são de outros</p>
            <p>🏆 Quanto mais territórios, mais alto no ranking da comunidade</p>
          </div>
        </div>

        <Button onClick={() => router.push('/social')} variant="outline" className="w-full border-gray-700 text-gray-400 hover:text-white">
          Ver Ranking de Territórios
        </Button>
      </div>
    </div>
  );
}
