"use client";

import { useState, useCallback, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { getCachedImageRequest } from "@/lib/cache/imageRequestCache";
import { limitImageRequests } from "@/lib/network/concurrencyLimiter";

/**
 * Retry configuration
 */
const RETRY_DELAYS = [500, 1000, 2000]; // Exponential backoff: 500ms, 1s, 2s
const MAX_RETRIES = 3;

/**
 * Default fallback image
 */
const DEFAULT_FALLBACK = "/branding/spotly-logo.svg";

export interface OptimizedImageProps extends Omit<ImageProps, "onError" | "onLoad"> {
  /**
   * Fallback image URL to use when the main image fails to load
   * Defaults to a placeholder image
   */
  fallbackUrl?: string;
  
  /**
   * Enable retry on failure (default: true)
   */
  enableRetry?: boolean;
  
  /**
   * Show skeleton placeholder while loading (default: true)
   */
  showSkeleton?: boolean;
  
  /**
   * Custom skeleton className
   */
  skeletonClassName?: string;
}

/**
 * Check if a URL is from a known image CDN that supports blur
 * These services generate blurDataURL automatically
 */
function supportsAutoBlur(src: string): boolean {
  const autoBlurDomains = [
    'images.unsplash.com',
    'res.cloudinary.com',
    'imgix.net',
    'cdn.imgix.com',
  ];
  try {
    const url = new URL(src);
    return autoBlurDomains.some(domain => url.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * OptimizedImage Component
 * 
 * A wrapper around Next.js Image component that provides:
 * - Retry logic with exponential backoff for 429 errors
 * - Request deduplication to prevent duplicate fetches
 * - Fallback image on error
 * - Skeleton loading state
 * 
 * This component helps prevent HTTP 429 (Too Many Requests) errors
 * when loading many images simultaneously.
 */
export default function OptimizedImage({
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
  ...rest
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src as string);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Determine effective loading strategy
  // Priority images should not use lazy loading
  const effectiveLoading = priority ? undefined : (loading || "lazy");
  
  // Determine effective placeholder
  // Blur placeholder requires blurDataURL for external images
  // Skip blur for external URLs unless they support auto-blur
  const effectivePlaceholder = (() => {
    if (placeholder !== "blur") return placeholder;
    // For blur, check if it's a supported CDN
    const srcStr = typeof src === 'string' ? src : '';
    if (supportsAutoBlur(srcStr)) return "blur";
    // Otherwise, skip blur (use skeleton instead)
    return undefined;
  })();

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src as string);
    setHasError(false);
    setRetryCount(0);
    setIsLoading(!priority);
  }, [src, priority]);

  /**
   * Attempt to load image with retry logic
   */
  const loadImageWithRetry = useCallback(
    async (imageSrc: string, attempt: number): Promise<void> => {
      if (attempt >= MAX_RETRIES) {
        throw new Error("Max retries reached");
      }

      // Wait for the delay before retrying (skip delay for first attempt)
      if (attempt > 0) {
        const delay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Use the concurrency limiter to prevent request spikes
      return limitImageRequests(async () => {
        return getCachedImageRequest(imageSrc, async () => {
          // Attempt to load the image
          return new Promise<void>((resolve, reject) => {
            const img = new window.Image();
            
            img.onload = () => resolve();
            img.onerror = (error) => {
              // Check if it's a 429 error
              // Since we can't directly access status, we'll treat all errors as potential retries
              reject(new Error("Image load failed"));
            };
            
            img.src = imageSrc;
          });
        });
      });
    },
    []
  );

  /**
   * Handle image error with retry logic
   */
  const handleError = useCallback(async () => {
    // If retries are disabled or we've reached max retries, show fallback
    if (!enableRetry || retryCount >= MAX_RETRIES) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Increment retry count
      setRetryCount((prev) => prev + 1);
      
      // Attempt to load with retry
      await loadImageWithRetry(src as string, retryCount + 1);
      
      // If successful, update the source
      setCurrentSrc(src as string);
      setHasError(false);
    } catch {
      // Retry failed, try again or show fallback
      if (retryCount + 1 >= MAX_RETRIES) {
        setHasError(true);
      } else {
        // Continue retrying
        handleError();
      }
    }
  }, [enableRetry, retryCount, src, loadImageWithRetry]);

  /**
   * Handle successful image load
   */
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  // Determine the final source to display
  const displaySrc = hasError || !currentSrc ? fallbackUrl : currentSrc;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader - shown while loading */}
      {showSkeleton && isLoading && (
        <div
          className={`absolute inset-0 z-10 ${skeletonClassName}`}
          aria-hidden="true"
        />
      )}
      
      {/* Next.js Image component */}
      <Image
        src={displaySrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        loading={effectiveLoading}
        placeholder={effectivePlaceholder}
        {...rest}
      />
    </div>
  );
}

/**
 * Preload an image to warm up the cache
 * Useful for critical images that should load immediately
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
    // Silently fail for preloads - they're best-effort
  }
}

/**
 * Preload multiple images with concurrency control
 */
export async function preloadImages(
  urls: string[],
  concurrency: number = 6
): Promise<void> {
  if (!urls || urls.length === 0) return;
  
  const { batchProcessImages } = await import("@/lib/network/concurrencyLimiter");
  
  await batchProcessImages(
    urls.filter(Boolean),
    (url) => preloadImage(url),
    concurrency
  );
}

