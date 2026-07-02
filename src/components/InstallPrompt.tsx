'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

type Platform = 'android' | 'ios' | null;

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return null;
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Não mostra se já está instalado
    if (isInStandaloneMode()) return;
    // Não mostra se usuário já dispensou nos últimos 7 dias
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const plat = detectPlatform();
    setPlatform(plat);

    if (plat === 'android') {
      // Android: espera o evento do navegador
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShow(true), 3000);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }

    if (plat === 'ios') {
      // iOS: mostra instrução manual após 3s (Safari não tem prompt automático)
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_prompt_dismissed', String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gray-900 border border-yellow-500/40 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        {/* Barra amarela decorativa no topo */}
        <div className="h-1 bg-gradient-to-r from-yellow-500 to-yellow-400" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Ícone do app */}
            <img
              src="/icon-192.png"
              alt="Fit Smart 360"
              className="w-14 h-14 rounded-2xl flex-shrink-0 border border-yellow-500/30"
            />

            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base leading-tight">Instalar Fit Smart 360°</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Acesse mais rápido, funciona offline e fica no seu celular como um app.
              </p>

              {platform === 'ios' && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-yellow-400 font-semibold">Como instalar no iPhone:</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <Share className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Toque em <strong>Compartilhar</strong> no Safari</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <Download className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Depois em <strong>"Adicionar à Tela de Início"</strong></span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-300 flex-shrink-0 mt-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {platform === 'android' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:border-gray-600"
              >
                Agora não
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black text-sm font-bold hover:from-yellow-400 hover:to-yellow-300 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar
              </button>
            </div>
          )}

          {platform === 'ios' && (
            <button
              onClick={handleDismiss}
              className="w-full mt-3 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium"
            >
              Entendi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
