import { useEffect, useState, useCallback, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import { getProximityAlerts } from '@/lib/services/proximity';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/Supabase/browser-client';

export interface ProximityAlert {
  id: string;
  name: string;
  distance_meters: number;
  category: string;
}

interface UseProximityAlertsOptions {
  enabled?: boolean;
}

export function useProximityAlerts(options: UseProximityAlertsOptions = {}) {
  const { enabled = true } = options;
  const { user } = useAuth();
  const { position } = useGeolocation();
  const addToast = useToast();
  const [nearby, setNearby] = useState<ProximityAlert[]>([]);
  const alertedHotspots = useRef<Map<string, number>>(new Map());
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const persistAlerts = useCallback(() => {
    localStorage.setItem(
      'proximity_alerts',
      JSON.stringify(Array.from(alertedHotspots.current.entries()))
    );
  }, []);

  const checkProximity = useCallback(async () => {
    if (!enabled || !user?.id || !position) return;

    if (lastPositionRef.current) {
      const delta = Math.sqrt(
        Math.pow(position.coords.latitude - lastPositionRef.current.lat, 2) +
          Math.pow(position.coords.longitude - lastPositionRef.current.lng, 2)
      ) * 111000;
      if (delta < 50) return;
    }
    lastPositionRef.current = { lat: position.coords.latitude, lng: position.coords.longitude };

    try {
      const alerts = await getProximityAlerts(
        position.coords.latitude,
        position.coords.longitude
      );

      const nearbyIds = alerts.within_1km.map((h) => h.id);
      let visitedSet = new Set<string>();

      if (nearbyIds.length > 0) {
        const { data, error } = await supabase
          .from('user_hotspots')
          .select('hotspot_id, visited')
          .eq('user_id', user.id)
          .in('hotspot_id', nearbyIds)
          .eq('visited', true);

        if (!error && data) {
          visitedSet = new Set((data as Array<{ hotspot_id: string }>).map((row) => row.hotspot_id));
        }
      }

      const nonVisitedWithin1km = alerts.within_1km.filter((h) => !visitedSet.has(h.id));
      const nonVisitedWithin500m = nonVisitedWithin1km.filter((h) => h.distance_meters <= 500);

      const now = Date.now();
      let hasNewAlert = false;

      const new1km = nonVisitedWithin1km.filter((h) => {
        const key = `1km-${h.id}`;
        const ts = alertedHotspots.current.get(key);
        return !ts || now - ts > 24 * 60 * 60 * 1000;
      });
      new1km.forEach((h) => {
        addToast(`${h.name} is 1km away!`, 'info');
        alertedHotspots.current.set(`1km-${h.id}`, now);
        hasNewAlert = true;
      });

      const new500m = nonVisitedWithin500m.filter((h) => {
        const key = `500m-${h.id}`;
        const ts = alertedHotspots.current.get(key);
        return !ts || now - ts > 24 * 60 * 60 * 1000;
      });
      new500m.forEach((h) => {
        addToast(`Nearby hotspot: ${h.name} is ${h.distance_meters.toFixed(0)}m away`, 'success');
        alertedHotspots.current.set(`500m-${h.id}`, now);
        hasNewAlert = true;
      });

      if (hasNewAlert) {
        persistAlerts();
      }

      setNearby(nonVisitedWithin1km);
    } catch (error) {
      console.warn('Proximity check failed:', error);
    }
  }, [enabled, user?.id, position, addToast, persistAlerts]);

  useEffect(() => {
    if (!enabled || !user?.id || !position) return;

    void checkProximity();

    const interval = setInterval(() => {
      void checkProximity();
    }, 30000);

    return () => clearInterval(interval);
  }, [enabled, user?.id, position, checkProximity]);

  useEffect(() => {
    if (!enabled) return;

    const saved = localStorage.getItem('proximity_alerts');
    if (saved) {
      alertedHotspots.current = new Map(JSON.parse(saved));
    }
  }, [enabled]);

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
