"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image, { ImageProps } from "next/image";
import { getCachedImageRequest } from "@/lib/cache/imageRequestCache";
import { limitImageRequests } from "@/lib/network/concurrencyLimiter";

/**
 * Retry configuration
 */
const RETRY_DELAYS = [500, 1000, 2000];
const MAX_RETRIES = RETRY_DELAYS.length;

/**
 * Default fallback image
 */
const DEFAULT_FALLBACK = "/images/placeholder-image.png";

export interface OptimizedImageProps extends Omit<ImageProps, "onError" | "onLoad"> {
  fallbackUrl?: string;
  enableRetry?: boolean;
  showSkeleton?: boolean;
  skeletonClassName?: string;
  onLoadCallback?: () => void;
}

function supportsAutoBlur(src: string): boolean {
  const autoBlurDomains = ["images.unsplash.com", "res.cloudinary.com", "imgix.net", "cdn.imgix.com"];

  try {
    const url = new URL(src);
    return autoBlurDomains.some((domain) => url.hostname.includes(domain));
  } catch {
    return false;
  }
}

function normalizeSrc(src: ImageProps["src"]): string {
  if (typeof src === "string") {
    return src;
  }

  if (src && typeof src === "object" && "src" in src && typeof src.src === "string") {
    return src.src;
  }

  return "";
}

function OptimizedImageComponent({
  src,
  alt,
  fallbackUrl = DEFAULT_FALLBACK,
  enableRetry = true,
  showSkeleton = true,
  skeletonClassName = "bg-slate-200 animate-pulse",
  className = "",
  priority = false,
  placeholder,
  loading,
  onLoadCallback,
  ...rest
}: OptimizedImageProps) {
  const normalizedSrc = useMemo(() => normalizeSrc(src), [src]);
  const [currentSrc, setCurrentSrc] = useState<string>(normalizedSrc);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isMountedRef = useRef(false);
  const retryInFlightRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      retryInFlightRef.current = false;
    };
  }, []);

  // Reset local state only when source/priority actually changes.
  useEffect(() => {
    retryInFlightRef.current = false;
    setCurrentSrc(normalizedSrc);
    setHasError(false);
    setRetryCount(0);
    setIsLoading(!priority);
  }, [normalizedSrc, priority]);

  const effectiveLoading = useMemo(() => {
    return priority ? undefined : (loading ?? "lazy");
  }, [loading, priority]);

  const effectivePlaceholder = useMemo(() => {
    if (placeholder !== "blur") {
      return placeholder;
    }

    return supportsAutoBlur(normalizedSrc) ? "blur" : undefined;
  }, [normalizedSrc, placeholder]);

  const loadImageWithRetry = useCallback(async (imageSrc: string, attempt: number): Promise<void> => {
    if (attempt > MAX_RETRIES) {
      throw new Error("Max retries reached");
    }

    if (attempt > 1) {
      const delayIndex = Math.min(attempt - 2, RETRY_DELAYS.length - 1);
      const delay = RETRY_DELAYS[delayIndex];
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    return limitImageRequests(async () => {
      return getCachedImageRequest(imageSrc, async () => {
        return new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Image load failed"));
          img.src = imageSrc;
        });
      });
    });
  }, []);

  const handleError = useCallback(async () => {
    if (retryInFlightRef.current || hasError) {
      return;
    }

    if (!enableRetry || !normalizedSrc) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    retryInFlightRef.current = true;

    let succeeded = false;
    let lastAttempt = retryCount;

    try {
      for (let attempt = retryCount + 1; attempt <= MAX_RETRIES; attempt += 1) {
        lastAttempt = attempt;
        if (isMountedRef.current) {
          setRetryCount(attempt);
        }

        try {
          await loadImageWithRetry(normalizedSrc, attempt);
          succeeded = true;
          break;
        } catch {
          // Continue with the next attempt.
        }
      }
    } finally {
      retryInFlightRef.current = false;
    }

    if (!isMountedRef.current) {
      return;
    }

    if (succeeded) {
      setCurrentSrc(normalizedSrc);
      setHasError(false);
    } else {
      setHasError(true);
    }

    setRetryCount(lastAttempt);
    setIsLoading(false);
  }, [enableRetry, hasError, loadImageWithRetry, normalizedSrc, retryCount]);

  const handleLoad = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
    onLoadCallback?.();
  }, [onLoadCallback]);

  const displaySrc = useMemo(() => {
    return hasError || !currentSrc ? fallbackUrl : currentSrc;
  }, [currentSrc, fallbackUrl, hasError]);

  const useFill = rest.fill === true;

  return (
    <div className={`relative overflow-hidden ${useFill ? "h-full w-full" : className}`}>
      {showSkeleton && isLoading && (
        <div className={`absolute inset-0 z-10 ${skeletonClassName}`} aria-hidden="true" />
      )}

      <Image
        {...rest}
        src={displaySrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        loading={effectiveLoading}
        placeholder={effectivePlaceholder}
        fill={useFill}
        className={useFill ? `object-cover ${className}`.trim() : className}
      />
    </div>
  );
}

const OptimizedImage = memo(OptimizedImageComponent);
OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;

/**
 * Preload an image to warm up the cache
 */
export async function preloadImage(src: string): Promise<void> {
  if (!src || typeof src !== "string") return;

  try {
    await getCachedImageRequest(src, async () => {
      return new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to preload image"));
        img.src = src;
      });
    });
  } catch {
    // Best-effort preload only.
  }
}

/**
 * Preload multiple images with concurrency control
 */
export async function preloadImages(urls: string[], concurrency: number = 6): Promise<void> {
  if (!urls || urls.length === 0) return;

  const { batchProcessImages } = await import("@/lib/network/concurrencyLimiter");

  await batchProcessImages(
    urls.filter(Boolean),
    (url) => preloadImage(url),
    concurrency
  );
}
