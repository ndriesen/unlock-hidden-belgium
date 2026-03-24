"use client";

import { useEffect, useState, useCallback } from 'react';

export interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  hasPermission: boolean;
  isWatching: boolean;
}

export function useGeolocation(options: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000 // 1 minute
}) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    hasPermission: false,
    isWatching: false
  });

  const getCurrentPosition = useCallback((opts?: PositionOptions) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, opts);
    });
  }, []);

  const watchPosition = useCallback((opts?: PositionOptions) => {
    return new Promise<number>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setState(prev => ({ ...prev, position, hasPermission: true, isWatching: true }));
          resolve(watchId);
        },
        (error) => {
          setState(prev => ({ ...prev, error, isWatching: false }));
          reject(error);
        },
        { ...options, ...opts }
      );
    });
  }, [options]);

  const clearWatch = useCallback((watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
    setState(prev => ({ ...prev, isWatching: false }));
  }, []);

  useEffect(() => {
    let watchId: number;
    
    watchPosition().then(id => {
      watchId = id;
    }).catch(error => {
      console.warn('Geolocation watch failed:', error);
    });

    return () => {
      if (watchId) clearWatch(watchId);
    };
  }, [watchPosition, clearWatch]);

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
    clearWatch
  };
}

// Hook for simple current position
export function useCurrentPosition() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation not supported' } as any);
      setLoading(false);
      return;
    }

    const id = navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 } // 5min
    );

    return () => {
      // getCurrentPosition doesn't return watchId
    };
  }, []);

  return { position, error, loading };
}

