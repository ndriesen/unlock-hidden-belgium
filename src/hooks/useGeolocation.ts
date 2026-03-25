"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  hasPermission: boolean;
  isWatching: boolean;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};

function toGeolocationError(message: string): GeolocationPositionError {
  return { code: 0, message } as GeolocationPositionError;
}

export function useGeolocation(options: PositionOptions = DEFAULT_OPTIONS) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    hasPermission: false,
    isWatching: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);
  const permissionDeniedRef = useRef(false);
  const initialOptionsRef = useRef<PositionOptions>({
    ...DEFAULT_OPTIONS,
    ...options,
  });

  const clearWatch = useCallback((watchId?: number) => {
    const id = watchId ?? watchIdRef.current;
    if (id === null || id === undefined) {
      return;
    }

    navigator.geolocation.clearWatch(id);

    if (watchIdRef.current === id) {
      watchIdRef.current = null;
    }

    if (isMountedRef.current) {
      setState((prev) => (prev.isWatching ? { ...prev, isWatching: false } : prev));
    }
  }, []);

  const getCurrentPosition = useCallback((opts?: PositionOptions) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = toGeolocationError("Geolocation not supported");
        reject(error);
        return;
      }

      if (permissionDeniedRef.current) {
        reject(toGeolocationError("Geolocation permission denied"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          if (error.code === 1) {
            permissionDeniedRef.current = true;
          }
          reject(error);
        },
        {
          ...initialOptionsRef.current,
          ...opts,
        }
      );
    });
  }, []);

  const watchPosition = useCallback(
    (opts?: PositionOptions) => {
      return new Promise<number>((resolve, reject) => {
        if (!navigator.geolocation) {
          const error = toGeolocationError("Geolocation not supported");
          if (isMountedRef.current) {
            setState((prev) => ({
              ...prev,
              error,
              hasPermission: false,
              isWatching: false,
            }));
          }
          reject(error);
          return;
        }

        if (permissionDeniedRef.current) {
          const error = toGeolocationError("Geolocation permission denied");
          if (isMountedRef.current) {
            setState((prev) => ({
              ...prev,
              error,
              hasPermission: false,
              isWatching: false,
            }));
          }
          reject(error);
          return;
        }

        if (watchIdRef.current !== null) {
          resolve(watchIdRef.current);
          return;
        }

        let settled = false;

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (!isMountedRef.current) return;

            setState((prev) => ({
              ...prev,
              position,
              hasPermission: true,
              error: null,
              isWatching: true,
            }));

            if (!settled) {
              settled = true;
              resolve(watchId);
            }
          },
          (error) => {
            if (error.code === 1) {
              permissionDeniedRef.current = true;
              clearWatch(watchId);
            }

            if (isMountedRef.current) {
              setState((prev) => {
                const nextHasPermission = error.code === 1 ? false : prev.hasPermission;
                const nextIsWatching = error.code === 1 ? false : prev.isWatching;
                const sameError =
                  prev.error?.code === error.code && prev.error?.message === error.message;

                if (
                  sameError &&
                  prev.hasPermission === nextHasPermission &&
                  prev.isWatching === nextIsWatching
                ) {
                  return prev;
                }

                return {
                  ...prev,
                  error,
                  hasPermission: nextHasPermission,
                  isWatching: nextIsWatching,
                };
              });
            }

            if (!settled) {
              settled = true;
              reject(error);
            }
          },
          {
            ...initialOptionsRef.current,
            ...opts,
          }
        );

        watchIdRef.current = watchId;

        if (isMountedRef.current) {
          setState((prev) => (prev.isWatching ? prev : { ...prev, isWatching: true }));
        }
      });
    },
    [clearWatch]
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!navigator.geolocation || permissionDeniedRef.current || watchIdRef.current !== null) {
      return () => {
        isMountedRef.current = false;
      };
    }

    // Run watch once on mount to avoid effect dependency loops/reinitialization.
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMountedRef.current) return;

        setState((prev) => ({
          ...prev,
          position,
          hasPermission: true,
          error: null,
          isWatching: true,
        }));
      },
      (error) => {
        if (error.code === 1) {
          permissionDeniedRef.current = true;
          clearWatch(watchId);
        }

        if (!isMountedRef.current) return;

        setState((prev) => {
          const nextHasPermission = error.code === 1 ? false : prev.hasPermission;
          const nextIsWatching = error.code === 1 ? false : prev.isWatching;
          const sameError = prev.error?.code === error.code && prev.error?.message === error.message;

          if (
            sameError &&
            prev.hasPermission === nextHasPermission &&
            prev.isWatching === nextIsWatching
          ) {
            return prev;
          }

          return {
            ...prev,
            error,
            hasPermission: nextHasPermission,
            isWatching: nextIsWatching,
          };
        });
      },
      initialOptionsRef.current
    );

    watchIdRef.current = watchId;
    setState((prev) => (prev.isWatching ? prev : { ...prev, isWatching: true }));

    return () => {
      isMountedRef.current = false;
      clearWatch(watchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
}

// Hook for simple current position
export function useCurrentPosition() {
  const geolocationSupported = typeof navigator !== "undefined" && "geolocation" in navigator;
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(() =>
    geolocationSupported ? null : toGeolocationError("Geolocation not supported")
  );
  const [loading, setLoading] = useState(geolocationSupported);

  useEffect(() => {
    if (!geolocationSupported) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [geolocationSupported]);

  return { position, error, loading };
}
