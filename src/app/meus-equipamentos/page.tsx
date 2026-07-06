'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Dumbbell, Trash2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getEquipments, deleteEquipment } from '@/lib/supabase-helpers';

interface EquipmentItem {
  id: string;
  equipment_name: string;
  category: string;
  muscle_groups: string[];
  description: string;
  image_url?: string;
  exercises?: { name: string }[];
  created_at: string;
}

export default function MeusEquipamentosPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isChecking) loadEquipments();
  }, [isChecking]);

  const loadEquipments = async () => {
    setIsLoading(true);
    try {
      const data = await getEquipments();
      setEquipments(data as EquipmentItem[]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      await deleteEquipment(id);
      setEquipments(prev => prev.filter(eq => eq.id !== id));
      // Sincronizar localStorage
      const saved = localStorage.getItem('scanned_equipments');
      if (saved) {
        const list = JSON.parse(saved).filter((eq: { equipmentName: string }) => eq.equipmentName !== name);
        localStorage.setItem('scanned_equipments', JSON.stringify(list));
      }
    } catch (e) {
      console.error('Erro ao excluir:', e);
    } finally {
      setDeletingId(null);
    }
  };

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Dumbbell className="w-10 h-10 text-yellow-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-yellow-500/20 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-yellow-500">Meus Equipamentos</h1>
      </header>

      <div className="px-4 pt-6 max-w-xl mx-auto space-y-4">
        {equipments.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Camera className="w-14 h-14 text-gray-600 mx-auto" />
            <p className="text-gray-400">Você ainda não escaneou nenhum equipamento.</p>
            <Button
              onClick={() => router.push('/scan')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              Escanear Agora
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400">{equipments.length} equipamento{equipments.length !== 1 ? 's' : ''} salvos</p>
            {equipments.map(eq => (
              <div key={eq.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex gap-4">
                {eq.image_url ? (
                  <img
                    src={eq.image_url}
                    alt={eq.equipment_name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-yellow-500 truncate">{eq.equipment_name}</h3>
                    <button
                      onClick={() => handleDelete(eq.id, eq.equipment_name)}
                      disabled={deletingId === eq.id}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10 shrink-0 disabled:opacity-40"
                      title="Excluir equipamento"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{eq.category}</p>
                  <div className="flex flex-wrap gap-1">
                    {eq.muscle_groups.slice(0, 3).map((m, i) => (
                      <span key={i} className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                  {eq.exercises && eq.exercises.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">{eq.exercises.length} exercícios</p>
                  )}
                </div>
              </div>
            ))}
            <Button
              onClick={() => router.push('/scan')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold mt-2"
            >
              <Camera className="w-4 h-4 mr-2" />
              Escanear Novo Equipamento
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
