"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import { getProximityAlerts } from '@/lib/services/proximity';
import { useToast } from '@/context/ToastContext';

export interface ProximityAlert {
  id: string;
  name: string;
  distance_meters: number;
  category: string;
}

export function useProximityAlerts() {
  const { position } = useGeolocation();
  const addToast = useToast();
  const [nearby, setNearby] = useState<ProximityAlert[]>([]);
  const alertedHotspots = useRef<Map<string, number>>(new Map()); // timestamped: '1km-id' -> timestamp
  const lastPositionRef = useRef<{lat: number, lng: number} | null>(null);

  const checkProximity = useCallback(async () => {
    if (!position) return;

    // Movement threshold check
    if (lastPositionRef.current) {
      const delta = Math.sqrt(
        Math.pow(position.coords.latitude - lastPositionRef.current.lat, 2) +
        Math.pow(position.coords.longitude - lastPositionRef.current.lng, 2)
      ) * 111000; // approx meters
      if (delta < 50) return; // Less than 50m movement
    }
    lastPositionRef.current = { lat: position.coords.latitude, lng: position.coords.longitude };

    try {
      const alerts = await getProximityAlerts(
        position.coords.latitude,
        position.coords.longitude
      );

      const now = Date.now();

      // 1km alert (first time or >24h)
      const new1km = alerts.within_1km.filter(h => {
        const key = `1km-${h.id}`;
        const ts = alertedHotspots.current.get(key);
        return !ts || now - ts > 24*60*60*1000;
      });
      new1km.forEach(h => {
        addToast(`${h.name} is 1km away!`, 'info');
        alertedHotspots.current.set(`1km-${h.id}`, now);
      });

      // 500m special alert (first time or >24h)
      const new500m = alerts.within_500m.filter(h => {
        const key = `500m-${h.id}`;
        const ts = alertedHotspots.current.get(key);
        return !ts || now - ts > 24*60*60*1000;
      });
      new500m.forEach(h => {
        addToast(`🚨 Close! ${h.name} is ${(h.distance_meters).toFixed(0)}m away`, 'success');
        alertedHotspots.current.set(`500m-${h.id}`, now);
      });

      setNearby([...alerts.within_1km, ...alerts.within_500m]);
    } catch (error) {
      console.warn('Proximity check failed:', error);
    }
  }, [position, addToast]);

  // Check every 30 seconds when moving
  useEffect(() => {
    if (!position) return;

    checkProximity();

    const interval = setInterval(checkProximity, 30000); // 30s
    return () => clearInterval(interval);
  }, [position, checkProximity]);

  // Persist alerts across sessions (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem('proximity_alerts');
    if (saved) {
      alertedHotspots.current = new Map(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('proximity_alerts', JSON.stringify(Array.from(alertedHotspots.current.entries())));
  }, [alertedHotspots.current.size]);

  return {
    nearby,
    alertCount: alertedHotspots.current.size,
    checkProximity,
    clearAlerts: () => {
      alertedHotspots.current.clear();
      localStorage.removeItem('proximity_alerts');
    }
  };
}

