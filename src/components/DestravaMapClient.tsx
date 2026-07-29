'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const VOYAGER   = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const DARK      = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS    = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png';
const TOPO      = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
const CYCLING   = 'https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png';

interface Props {
  position:       [number, number] | null;
  route:          [number, number][];
  isDay:          boolean;
  mapStyleId:     string;
  overlays:       string[];
  compassHeading: number | null;
}

function getTileUrl(styleId: string, isDay: boolean): string {
  switch (styleId) {
    case 'satelite': return SATELLITE;
    case 'hibrido':  return SATELLITE;
    case 'noturno':  return DARK;
    case 'topo':     return TOPO;
    default:         return isDay ? VOYAGER : DARK;
  }
}

export default function DestravaMapClient({ position, route, isDay, mapStyleId, overlays, compassHeading }: Props) {
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<import('leaflet').Map | null>(null);
  const baseTileRef   = useRef<import('leaflet').TileLayer | null>(null);
  const labelsRef     = useRef<import('leaflet').TileLayer | null>(null);
  const cyclingRef    = useRef<import('leaflet').TileLayer | null>(null);
  const markerRef     = useRef<import('leaflet').CircleMarker | null>(null);
  const polylineRef   = useRef<import('leaflet').Polyline | null>(null);
  const readyRef      = useRef(false);

  // Mount map once
  useEffect(() => {
    if (!containerRef.current || readyRef.current) return;
    readyRef.current = true;

    const init = async () => {
      const L = (await import('leaflet')).default;
      const center: [number, number] = position ?? [-23.5505, -46.6333];

      const map = L.map(containerRef.current!, {
        center, zoom: 16, zoomControl: false, attributionControl: false,
      });

      baseTileRef.current = L.tileLayer(getTileUrl(mapStyleId, isDay), { maxZoom: 20 }).addTo(map);

      if (mapStyleId === 'hibrido') {
        labelsRef.current = L.tileLayer(LABELS, { maxZoom: 20 }).addTo(map);
      }

      mapRef.current = map;
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = baseTileRef.current = labelsRef.current =
          cyclingRef.current = markerRef.current = polylineRef.current = null;
        readyRef.current = false;
      }
    };
  }, []); // eslint-disable-line

  // Swap base tile when style or isDay changes
  useEffect(() => {
    if (!mapRef.current) return;
    const swap = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current!;
      if (baseTileRef.current) map.removeLayer(baseTileRef.current);
      if (labelsRef.current)   { map.removeLayer(labelsRef.current); labelsRef.current = null; }
      baseTileRef.current = L.tileLayer(getTileUrl(mapStyleId, isDay), { maxZoom: 20 }).addTo(map);
      if (mapStyleId === 'hibrido') {
        labelsRef.current = L.tileLayer(LABELS, { maxZoom: 20 }).addTo(map);
      }
    };
    swap();
  }, [mapStyleId, isDay]);

  // Ciclovias overlay toggle
  useEffect(() => {
    if (!mapRef.current) return;
    const toggle = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current!;
      const want = overlays.includes('ciclovias');
      if (want && !cyclingRef.current) {
        cyclingRef.current = L.tileLayer(CYCLING, { maxZoom: 20, opacity: 0.85 }).addTo(map);
      } else if (!want && cyclingRef.current) {
        map.removeLayer(cyclingRef.current);
        cyclingRef.current = null;
      }
    };
    toggle();
  }, [overlays]);

  // Compass rotation via CSS transform on wrapper
  useEffect(() => {
    if (!wrapperRef.current) return;
    wrapperRef.current.style.transform =
      compassHeading !== null ? `rotate(${-compassHeading}deg)` : 'none';
  }, [compassHeading]);

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
          radius: 10, color: '#ffffff', fillColor: '#FC4C02', fillOpacity: 1, weight: 3,
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
        polylineRef.current = L.polyline(route, { color: '#FC4C02', weight: 5, opacity: 0.9 }).addTo(mapRef.current);
      }
    };
    update();
  }, [route]);

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full"
      style={{ transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
