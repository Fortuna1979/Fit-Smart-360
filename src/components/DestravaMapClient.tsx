'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface Props {
  position: [number, number] | null;
  route: [number, number][];
}

export default function DestravaMapClient({ position, route }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').CircleMarker | null>(null);
  const polylineRef = useRef<import('leaflet').Polyline | null>(null);
  const readyRef = useRef(false);

  // Mount map once
  useEffect(() => {
    if (!containerRef.current || readyRef.current) return;
    readyRef.current = true;

    const init = async () => {
      const L = (await import('leaflet')).default;
      const center: [number, number] = position ?? [-23.5505, -46.6333];

      const map = L.map(containerRef.current!, {
        center,
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
      }).addTo(map);

      mapRef.current = map;
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        polylineRef.current = null;
        readyRef.current = false;
      }
    };
  }, []); // eslint-disable-line

  // Update position marker
  useEffect(() => {
    if (!position) return;
    const update = async () => {
      if (!mapRef.current) return;
      const L = (await import('leaflet')).default;
      if (markerRef.current) {
        markerRef.current.setLatLng(position);
      } else {
        markerRef.current = L.circleMarker(position, {
          radius: 10,
          color: '#ffffff',
          fillColor: '#FC4C02',
          fillOpacity: 1,
          weight: 3,
        }).addTo(mapRef.current);
      }
      mapRef.current.setView(position, mapRef.current.getZoom());
    };
    update();
  }, [position]);

  // Update route polyline
  useEffect(() => {
    if (route.length < 2) return;
    const update = async () => {
      if (!mapRef.current) return;
      const L = (await import('leaflet')).default;
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(route);
      } else {
        polylineRef.current = L.polyline(route, {
          color: '#FC4C02',
          weight: 5,
          opacity: 0.9,
        }).addTo(mapRef.current);
      }
    };
    update();
  }, [route]);

  return <div ref={containerRef} className="w-full h-full" />;
}
