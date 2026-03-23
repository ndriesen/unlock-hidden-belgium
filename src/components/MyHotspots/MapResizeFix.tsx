"use client";

import { useMap, useMapEvent } from "react-leaflet";
import { useEffect, useRef } from "react";

export function MapResizeFix() {
  const map = useMap();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!map) return;

    // Force initial resize after render
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Observe container size changes
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

  // Optional: force redraw after each moveend
  useMapEvent("moveend", () => {
    map.invalidateSize();
  });

  return null;
}