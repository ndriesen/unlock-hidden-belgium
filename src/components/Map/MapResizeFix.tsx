"use client";

import { useMap, useMapEvent } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function MapResizeFix() {
  return <MapResizeFixInner />;
}

function MapResizeFixInner() {
  const map = useMap();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!map) return;

    // Initial invalidateSize after mount (critical for SSR/Next.js)
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // ResizeObserver for dynamic changes (mobile orientation, modals)
    const container = map.getContainer();
    if (container) {
      resizeObserverRef.current = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserverRef.current.observe(container);
    }

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [map]);

  // Additional resize on map events
  useMapEvent('moveend', () => {
    map?.invalidateSize();
  });

  // Tile debugging events
  useMapEvent('tileloadstart', () => {
    console.log('🗺️ Tile load started');
  });

  useMapEvent('tileload', () => {
    console.log('✅ Tile loaded successfully');
  });

  useMapEvent('tileerror', (e) => {
    console.error('❌ Tile error:', e);
  });

  return null;
}

