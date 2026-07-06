'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Download, LogOut, Mail, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getSupabaseClient } from '@/lib/supabase';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getUserId } from '@/lib/supabase-helpers';

export default function SettingsPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChecking) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setName((data.user?.user_metadata?.name as string) ?? null);
      setPhotoUrl((data.user?.user_metadata?.avatar_url as string) ?? null);
    });
  }, [isChecking]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Foto muito grande. Máximo 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase não disponível');

      const userId = await getUserId();
      if (!userId) throw new Error('Usuário não autenticado');

      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      setPhotoUrl(publicUrl);
    } catch (err) {
      console.error('Erro ao enviar foto:', err);
      setPhotoError('Não foi possível enviar a foto. Tente novamente.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch('/api/export-my-data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Falha na exportação');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitsmart360-meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao exportar dados:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setIsDeleting(true);
    setDeleteError(null);
    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      console.error('Erro ao excluir conta:', error);
      setDeleteError('Não foi possível excluir sua conta. Tente novamente em alguns instantes.');
      setIsDeleting(false);
      return;
    }
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  const initial = name?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-2xl">Configurações</h1>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-4 sm:space-y-6">
        {/* Perfil */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {/* Avatar com botão de câmera */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-yellow-500 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-black">{initial}</span>
                )}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-black hover:bg-yellow-400 transition-colors disabled:opacity-50"
                title="Trocar foto"
              >
                {isUploadingPhoto ? (
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-black" />
                )}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-bold text-lg">{name || 'Minha conta'}</p>
              <p className="text-sm text-gray-400">Fit Smart 360º</p>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="text-xs text-yellow-500 hover:text-yellow-400 mt-1 disabled:opacity-50"
              >
                {isUploadingPhoto ? 'Enviando foto...' : photoUrl ? 'Trocar foto' : 'Adicionar foto'}
              </button>
            </div>
          </div>

          {photoError && (
            <p className="text-xs text-red-400">{photoError}</p>
          )}

          {name && (
            <div className="flex items-center gap-3 text-gray-300">
              <User className="w-4 h-4 text-gray-500" />
              <span>{name}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-gray-300">
            <Mail className="w-4 h-4 text-gray-500" />
            <span>{email}</span>
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-60"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar meus dados'}
        </Button>

        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="outline"
          className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-60"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
        </Button>

        <div className="border-t border-gray-800 pt-6 space-y-3">
          <p className="text-sm text-gray-500">
            Excluir sua conta remove permanentemente seu perfil, equipamentos escaneados e
            treinos. Essa ação não pode ser desfeita. Veja nossa{' '}
            <button
              onClick={() => router.push('/privacidade')}
              className="text-yellow-500 hover:underline"
            >
              Política de Privacidade
            </button>
            .
          </p>

          {deleteError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-center text-red-400">{deleteError}</p>
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isDeleting}
                variant="outline"
                className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Excluindo...' : 'Excluir minha conta'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Isso vai apagar permanentemente sua conta e todos os seus dados (perfil,
                  equipamentos escaneados e treinos). Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sim, excluir permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
