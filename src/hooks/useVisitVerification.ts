"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import { verifyVisit, getUserHotspotStatus, markAsVisited, UserHotspotStatus } from '@/lib/services/visitVerification';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export interface VerificationState {
  isVerifying: boolean;
  status: UserHotspotStatus | null;
  lastVerification: {
    distance_meters: number;
    status: 'verified' | 'failed';
    timestamp: Date;
  } | null;
  canVerify: boolean;
}

const MAX_VERIFICATION_ACCURACY_METERS = 50;
const VERIFY_DEBOUNCE_MS = 2000;

function computeCanVerify(
  status: UserHotspotStatus | null,
  position: GeolocationPosition | null
): boolean {
  if (!position) return false;
  return (
    position.coords.accuracy <= MAX_VERIFICATION_ACCURACY_METERS &&
    status?.verification_status === 'none'
  );
}

export function useVisitVerification(hotspotId: string) {
  const { user } = useAuth();
  const { position, hasPermission } = useGeolocation();
  const addToast = useToast();
  const [state, setState] = useState<VerificationState>({
    isVerifying: false,
    status: null,
    lastVerification: null,
    canVerify: false
  });

  const verifyDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyResolversRef = useRef<Array<() => void>>([]);
  const verifyCoordsRef = useRef<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!user?.id || !hotspotId) {
      setState(prev => ({
        ...prev,
        status: null,
        canVerify: false
      }));
      return;
    }
    try {
      const status = await getUserHotspotStatus(user.id, hotspotId);
      setState(prev => ({ ...prev, status }));
    } catch (error) {
      console.error('Failed to refresh visit verification status:', error);
    }
  }, [user?.id, hotspotId]);

  useEffect(() => {
    setState(prev => {
      const nextCanVerify = computeCanVerify(prev.status, position);
      if (prev.canVerify === nextCanVerify) return prev;
      return { ...prev, canVerify: nextCanVerify };
    });
  }, [position, state.status?.verification_status]);

  const executeVerification = useCallback(async (coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }) => {
    if (!user?.id) {
      addToast('User not logged in', 'error');
      return;
    }

    setState(prev => ({ ...prev, isVerifying: true }));
    try {
      const result = await verifyVisit({
        userId: user.id,
        hotspotId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy
      });

      if (result.success && (result.status === 'verified' || result.status === 'failed')) {
        const verificationStatus: 'verified' | 'failed' = result.status;
        setState(prev => ({
          ...prev,
          lastVerification: {
            distance_meters: result.distance_meters,
            status: verificationStatus,
            timestamp: new Date()
          }
        }));

        if (verificationStatus === 'verified') {
          addToast(`Verified! +25 XP (${result.distance_meters.toFixed(0)}m)`, 'success');
        } else {
          addToast(`Too far: ${result.distance_meters.toFixed(0)}m (need <100m)`, 'info');
        }
      } else {
        addToast('Verification failed', 'error');
      }
    } catch (error) {
      console.error('Verify failed:', error);
      addToast('Verification error - try again', 'error');
    } finally {
      setState(prev => ({ ...prev, isVerifying: false }));
      await refreshStatus();
    }
  }, [user?.id, hotspotId, addToast, refreshStatus]);

  const verifyCurrentLocation = useCallback((): Promise<void> => {
    if (!hasPermission || !position) {
      addToast('Enable location services to verify GPS', 'error');
      return Promise.resolve();
    }

    if (position.coords.accuracy > MAX_VERIFICATION_ACCURACY_METERS) {
      addToast('Poor GPS accuracy. Wait for better signal (<=50m)', 'info');
      return Promise.resolve();
    }

    verifyCoordsRef.current = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };

    if (verifyDebounceTimerRef.current) {
      clearTimeout(verifyDebounceTimerRef.current);
    }

    return new Promise<void>((resolve) => {
      verifyResolversRef.current.push(resolve);
      verifyDebounceTimerRef.current = setTimeout(() => {
        const coords = verifyCoordsRef.current;
        verifyCoordsRef.current = null;

        const run = async () => {
          if (coords) {
            await executeVerification(coords);
          }
          const resolvers = verifyResolversRef.current.splice(0);
          resolvers.forEach(done => done());
        };

        void run();
      }, VERIFY_DEBOUNCE_MS);
    });
  }, [hasPermission, position, addToast, executeVerification]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    return () => {
      if (verifyDebounceTimerRef.current) {
        clearTimeout(verifyDebounceTimerRef.current);
      }
    };
  }, []);

  const markVisited = useCallback(async () => {
    if (!user?.id) {
      addToast('User not logged in', 'error');
      return;
    }
    try {
      const result = await markAsVisited(user.id, hotspotId);
      if (result.alreadyVisited) {
        addToast('Hotspot already marked as visited', 'info');
      } else if (typeof result.xpGained === 'number') {
        addToast(`Visited! +${result.xpGained} XP`, 'success');
      } else {
        addToast('Hotspot marked as visited', 'success');
      }
    } catch (error) {
      console.error('Failed to mark hotspot as visited:', error);
      addToast('Failed to mark as visited', 'error');
    } finally {
      await refreshStatus();
    }
  }, [user?.id, hotspotId, addToast, refreshStatus]);

  return {
    ...state,
    refreshStatus,
    verifyCurrentLocation,
    markVisited
  };
}

