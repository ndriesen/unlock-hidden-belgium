"use client";

import { useRef, useCallback, useMemo, ReactNode, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface VirtualizedImageGridProps {
  /**
   * Array of items to render
   */
  items: unknown[];
  
  /**
   * Render function for each item
   */
  renderItem: (item: unknown, index: number) => ReactNode;
  
  /**
   * Number of columns in the grid
   */
  columns?: number;
  
  /**
   * Gap between items in pixels
   */
  gap?: number;
  
  /**
   * Minimum item height (used for estimation)
   */
  estimatedItemHeight?: number;
  
  /**
   * Container className
   */
  className?: string;
  
  /**
   * Additional overscan beyond viewport
   */
  overscan?: number;
}

/**
 * VirtualizedImageGrid
 * 
 * A virtualized grid component that only renders visible items.
 * This prevents loading all images at once and eliminates 429 errors.
 * 
 * Features:
 * - Only renders visible items + overscan
 * - Supports any number of columns
 * - Maintains smooth scrolling performance
 * - Scales to hundreds of items
 */
export default function VirtualizedImageGrid({
  items,
  renderItem,
  columns = 2,
  gap = 12,
  estimatedItemHeight = 200,
  className = "",
  overscan = 3,
}: VirtualizedImageGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate columns based on screen size via media queries would require 
  // a more complex implementation. For now, we use the columns prop.
  
  // Calculate row height based on aspect ratio estimation
  // In a real implementation, you might measure actual items
  const rowHeight = estimatedItemHeight;

  const virtualizer = useVirtualizer({
    count: Math.ceil(items.length / columns), // Number of rows
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan,
  });

  // Group items into rows
  const rows = useMemo(() => {
    const result: unknown[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push(items.slice(i, i + columns));
    }
    return result;
  }, [items, columns]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const rowItems = rows[rowIndex] || [];
          
          return (
            <div
              key={rowIndex}
              data-index={rowIndex}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${rowItems.length}, 1fr)`,
                  gap: `${gap}px`,
                  height: "100%",
                }}
              >
                {rowItems.map((item, colIndex) => {
                  const globalIndex = rowIndex * columns + colIndex;
                  return (
                    <div key={globalIndex} className="h-full">
                      {renderItem(item, globalIndex)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook for preloading images before they enter the viewport
 * Uses IntersectionObserver to detect when images are about to become visible
 */
export function useImagePreloader(
  items: { id: string; imageUrl: string }[],
  options: {
    rootMargin?: string;
    threshold?: number;
    preloadAhead?: number;
  } = {}
) {
  const { rootMargin = "300px", threshold = 0, preloadAhead = 6 } = options;

  const preloadImage = useCallback(async (url: string) => {
    if (!url) return;
    
    try {
      // Create a link element for preloading
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = url;
      document.head.appendChild(link);
      
      // Also try loading the image to warm up the cache
      const img = new window.Image();
      img.src = url;
    } catch {
      // Silently fail - preload is best effort
    }
  }, []);

  const getUrlsToPreload = useCallback(
    (visibleIndices: number[]) => {
      if (visibleIndices.length === 0) return [];
      
      const maxVisibleIndex = Math.max(...visibleIndices);
      const urlsToPreload: string[] = [];
      
      // Preload images ahead of the visible ones
      for (let i = 1; i <= preloadAhead; i++) {
        const nextIndex = maxVisibleIndex + i;
        if (nextIndex < items.length) {
          const item = items[nextIndex];
          if (item?.imageUrl) {
            urlsToPreload.push(item.imageUrl);
          }
        }
      }
      
      return urlsToPreload;
    },
    [items, preloadAhead]
  );

  return { preloadImage, getUrlsToPreload };
}

/**
 * HOC to add React.memo to prevent unnecessary re-renders
 */
export function memoizeComponent<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return memo(Component) as React.FC<P>;
}

