"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface ViewportPreloadOptions {
  /**
   * Distance in pixels before viewport to trigger preload
   */
  rootMargin?: string;
  
  /**
   * Number of items to preload ahead
   */
  preloadCount?: number;
  
  /**
   * Callback when items enter the preload zone
   */
  onPreload?: (indices: number[]) => void;
}

/**
 * useViewportPreloader
 * 
 * Hook that uses IntersectionObserver to detect when content is about to 
 * enter the viewport and trigger preloading.
 * 
 * This ensures images appear instantly during scrolling by preloading them
 * 300px before they become visible.
 * 
 * @param itemCount - Total number of items
 * @param options - Configuration options
 */
export function useViewportPreloader(
  itemCount: number,
  options: ViewportPreloadOptions = {}
) {
  const {
    rootMargin = "300px",
    preloadCount = 6,
    onPreload,
  } = options;

  const preloadedRef = useRef<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<number, HTMLElement>>(new Map());

  // Register an element for observation
  const registerElement = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      elementsRef.current.set(index, element);
    } else {
      elementsRef.current.delete(index);
    }
  }, []);

  // Set up intersection observer
  useEffect(() => {
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute("data-index") || "0", 10);
          
          // Calculate indices to preload
          const indicesToPreload: number[] = [];
          for (let i = 1; i <= preloadCount; i++) {
            const nextIndex = index + i;
            if (nextIndex < itemCount && !preloadedRef.current.has(nextIndex)) {
              indicesToPreload.push(nextIndex);
              preloadedRef.current.add(nextIndex);
            }
          }
          
          if (indicesToPreload.length > 0 && onPreload) {
            onPreload(indicesToPreload);
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold: 0,
    });

    // Observe all registered elements
    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [itemCount, rootMargin, preloadCount, onPreload]);

  // Update observation when elements change
  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;

    // Disconnect old observations
    elementsRef.current.forEach((element) => {
      observer.unobserve(element);
    });

    // Observe current elements
    elementsRef.current.forEach((element) => {
      observer.observe(element);
    });
  });

  return { registerElement };
}

/**
 * Intersection Observer hook for lazy loading
 * 
 * @param options - Configuration options
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.rootMargin, options.threshold, options.root]);

  return { elementRef, isIntersecting };
}

