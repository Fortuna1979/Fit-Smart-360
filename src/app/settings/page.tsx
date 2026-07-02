'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Dumbbell, LogOut, Mail, Trash2, User } from 'lucide-react';
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

export default function SettingsPage() {
  const router = useRouter();
  const { isChecking } = useRequireAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (isChecking) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setName((data.user?.user_metadata?.name as string) ?? null);
    });
  }, [isChecking]);

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
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="font-bold">{name || 'Minha conta'}</p>
              <p className="text-sm text-gray-400">Fit Smart 360º</p>
            </div>
          </div>

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
