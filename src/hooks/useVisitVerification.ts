"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGeolocation } from './useGeolocation';
import { verifyVisit, getUserHotspotStatus, UserHotspotStatus } from '@/lib/services/visitVerification';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useGamification } from './useGamification';

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

export function useVisitVerification(hotspotId: string) {
  const { user } = useAuth();
  const { position, hasPermission } = useGeolocation();
  const addToast = useToast();
  const { handleVisit } = useGamification();
  const [state, setState] = useState<VerificationState>({
    isVerifying: false,
    status: null,
    lastVerification: null,
    canVerify: false
  });

  const refreshStatusRef = useRef(0);
  const refreshStatus = useCallback(async () => {
    const now = Date.now();
    if (now - refreshStatusRef.current < 500) return; // 500ms debounce
    refreshStatusRef.current = now;
    
    if (!user?.id || !hotspotId || !position?.coords.accuracy || position.coords.accuracy > 50) return; // Throttle + accuracy <=50m filter
    
    const status = await getUserHotspotStatus(user.id, hotspotId);
    setState(prev => ({
      ...prev,
      status,
      canVerify: !!(status?.visited && status.verification_status === 'none' && position && position.coords.accuracy <= 50 && hasPermission)
    }));
  }, [user?.id, hotspotId, position]);

  const verifyRef = useRef(0);  const verifyCurrentLocation = useCallback(async () => {    const now = Date.now();    if (now - verifyRef.current < 2000) return; // 2s debounce
      verifyRef.current = now;
          if (!hasPermission) {
                  addToast('Enable location services to verify GPS', 'error');
                        return;
                          }
                              if (!position || position.coords.accuracy > 50) {
                                      addToast('Poor GPS accuracy. Wait for better signal (<=50m)', 'info');
                                            return;    }
    // Pre-checks handled above

    setState(prev => ({ ...prev, isVerifying: true }));
    
    if (!user?.id) {
      addToast('User not logged in', 'error');
      return;
    }
    try {
      const result = await verifyVisit({
        userId: user.id,
        hotspotId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

      if (result.success) {
        if (result.status === 'verified') {
          addToast(`Verified! +25 XP (${result.distance_meters.toFixed(0)}m)`, 'success');
        } else {
          addToast(`Too far: ${result.distance_meters.toFixed(0)}m (need <100m)`, 'info');
        }
        
        setState(prev => ({
        ...prev,
        lastVerification: {
          distance_meters: result.distance_meters,
          status: result.status as 'verified' | 'failed', // RPC returns verified|failed
          timestamp: new Date()
        }
      }));
      } else {
        addToast('Verification failed', 'error');
      }
    } catch (error) {
      console.error('Verify failed:', error);
      addToast('Verification error - try again', 'error');
    } finally {
      setState(prev => ({ ...prev, isVerifying: false }));
      refreshStatus();
    }
  }, [user?.id, hotspotId, position, addToast, refreshStatus]);

  // Auto-refresh status
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const markVisited = useCallback(async () => {
    if (!user?.id) return;
    await handleVisit(hotspotId);
    refreshStatus();
  }, [user?.id, hotspotId, handleVisit, refreshStatus]);

  return {
    ...state,
    refreshStatus,
    verifyCurrentLocation,
    markVisited
  };
}

