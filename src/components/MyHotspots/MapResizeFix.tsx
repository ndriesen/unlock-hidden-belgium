"use client";

import { useMap, useMapEvent } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function MapResizeFix() {
  const map = useMap();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!map) return;

    // Initial resize fix
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // ResizeObserver for dynamic container
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

  useMapEvent('moveend', () => {
    map.invalidateSize();
  });

  return null;
}
