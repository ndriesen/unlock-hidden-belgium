"use client";

import { useMap } from 'react-leaflet';
import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Hotspot } from '@/types/hotspot';

interface GeolocationControlProps {
  autoLocate?: boolean;
  hotspots?: Hotspot[];
}

function SafeGeolocationControl({ autoLocate, hotspots = [] }: GeolocationControlProps) {
  const map = useMap() as L.Map;
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const locate = useCallback(() => {
    if (!map) return;
    console.log('🧭 Starting geolocation...');
    map.invalidateSize();
    map.locate({
      setView: false,
      maxZoom: 8,
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000,
    });
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const handleLocationFound = (e: L.LocationEvent) => {
      console.log('📍 Location found:', e.latlng);
      map.setView(e.latlng, 12, { animate: true });

      if (markerRef.current) markerRef.current.setLatLng(e.latlng);
      else markerRef.current = L.marker(e.latlng).addTo(map).bindPopup("You are here");

      if (circleRef.current) circleRef.current.setLatLng(e.latlng).setRadius(e.accuracy ?? 50);
      else circleRef.current = L.circle(e.latlng, {
        radius: e.accuracy ?? 50,
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.2,
        weight: 2
      }).addTo(map);
    };

    const handleLocationError = () => {
      console.warn('⚠️ Geolocation denied or failed');

      if (hotspots.length > 0) {
        // Fit bounds to all hotspots
        const points = hotspots
          .map(h => [h.lat ?? h.latitude, h.lng ?? h.longitude] as [number, number])
          .filter(([lat, lng]) => typeof lat === 'number' && typeof lng === 'number');

        if (points.length) {
          const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
          map.fitBounds(bounds, { padding: [50, 50] });
          return;
        }
      }

      // Fallback if no hotspots
      const fallback: L.LatLngTuple = [50.8503, 4.3517];
      map.setView(fallback, 8, { animate: true });
      if (!markerRef.current) markerRef.current = L.marker(fallback).addTo(map).bindPopup("Default location");
      else markerRef.current.setLatLng(fallback);
      if (!circleRef.current) circleRef.current = L.circle(fallback, { radius: 50 }).addTo(map);
      else circleRef.current.setLatLng(fallback).setRadius(50);
    };

    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    return () => {
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
      markerRef.current?.remove();
      circleRef.current?.remove();
    };
  }, [map, hotspots]);

  useEffect(() => {
    if (!autoLocate) return;
    const timer = setTimeout(locate, 500);
    return () => clearTimeout(timer);
  }, [autoLocate, locate]);

  return (
    <div className="leaflet-control-container">
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control-locate leaflet-bar leaflet-control">
          <a
            className="leaflet-control-locate-toggle"
            href="#"
            title="Locate me"
            role="button"
            aria-label="Locate me"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              locate();
            }}
          >
            <span className="leaflet-control-locate-location">📍</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export function GeolocationControl({ autoLocate = true, hotspots }: GeolocationControlProps) {
  return autoLocate ? <SafeGeolocationControl autoLocate hotspots={hotspots} /> : null;
}