'use client';

import { useEffect, useRef } from 'react';
import { Megaphone } from 'lucide-react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT_ID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

export function AdBanner() {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.error('Erro ao carregar anúncio:', error);
    }
  }, []);

  if (!ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) {
    return (
      <div className="w-full max-w-sm aspect-video bg-gray-900 border border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2">
        <Megaphone className="w-8 h-8 text-gray-600" />
        <p className="text-sm text-gray-500">Anúncio</p>
      </div>
    );
  }

  return (
    <ins
      ref={insRef}
      className="adsbygoogle block w-full max-w-sm"
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={ADSENSE_SLOT_ID}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
