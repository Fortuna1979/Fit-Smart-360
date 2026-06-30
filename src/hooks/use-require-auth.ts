'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

// Redireciona para /auth caso não haja sessão ativa do Supabase.
// Retorna `isChecking` para a página evitar renderizar conteúdo protegido antes da verificação.
export const useRequireAuth = () => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      router.replace('/auth');
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/auth');
      } else {
        setIsChecking(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/auth');
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [router]);

  return { isChecking };
};
