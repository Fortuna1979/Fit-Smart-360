'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Territory } from '@/lib/supabase';

interface Props {
  center: [number, number];
  territories: Territory[];
  myUserId?: string;
}

export default function TerritoryMapClient({ center, territories, myUserId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let L: typeof import('leaflet');
    let map: import('leaflet').Map;

    const init = async () => {
      L = (await import('leaflet')).default;

      // Fix Leaflet default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      map = L.map(containerRef.current!, {
        center,
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;
      drawTerritories(L, map, territories, myUserId, center);
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update territories when they change
  useEffect(() => {
    if (!mapRef.current) return;
    const doUpdate = async () => {
      const L = (await import('leaflet')).default;
      // Remove existing territory layers (keep tile layer)
      mapRef.current!.eachLayer(layer => {
        if ((layer as { _isTerritoryLayer?: boolean })._isTerritoryLayer) {
          mapRef.current!.removeLayer(layer);
        }
      });
      drawTerritories(L, mapRef.current!, territories, myUserId, center);
    };
    doUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territories]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 320 }} />;
}

function drawTerritories(
  L: typeof import('leaflet'),
  map: import('leaflet').Map,
  territories: Territory[],
  myUserId: string | undefined,
  center: [number, number]
) {
  const cellSize = 1 / 400; // ~277m

  // Draw each territory cell
  for (const t of territories) {
    const [gx, gy] = t.grid_key.split('_').map(Number);
    const latMin = gx / 400;
    const latMax = latMin + cellSize;
    const lngMin = gy / 400;
    const lngMax = lngMin + cellSize;

    const isMine = t.user_id === myUserId;
    const rect = L.rectangle(
      [[latMin, lngMin], [latMax, lngMax]],
      {
        color: isMine ? '#EAB308' : '#EF4444',
        fillColor: isMine ? '#EAB308' : '#EF4444',
        fillOpacity: isMine ? 0.4 : 0.25,
        weight: 2,
        opacity: 0.8,
      }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rect as any)._isTerritoryLayer = true;
    rect.bindPopup(`<b>${t.user_name}</b><br/>${isMine ? 'Seu território' : 'Território de outro atleta'}`);
    rect.addTo(map);
  }

  // Center marker
  const centerMarker = L.circleMarker(center, {
    radius: 10,
    color: '#EAB308',
    fillColor: '#EAB308',
    fillOpacity: 1,
    weight: 3,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (centerMarker as any)._isTerritoryLayer = true;
  centerMarker.bindPopup('Você está aqui').addTo(map);
}
