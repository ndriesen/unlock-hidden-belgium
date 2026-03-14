"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { Hotspot } from "@/types/hotspot";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface FeaturedHotspotsProps {
  hotspots: Hotspot[];
  wishlistIds?: string[];
  onWishlistToggle?: (hotspotId: string) => void;
  selectedCategory?: string;
}

export default function FeaturedHotspots({ 
  hotspots, 
  wishlistIds = [],
  onWishlistToggle,
  selectedCategory = ""
}: FeaturedHotspotsProps) {
  // Filter hotspots by category if selected
  const filteredHotspots = selectedCategory 
    ? hotspots.filter(h => h.category === selectedCategory)
    : hotspots;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Check for overflow to show/hide scroll indicators
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        const { scrollWidth, clientWidth } = scrollRef.current;
        setIsOverflowing(scrollWidth > clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [hotspots]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleImageLoad = useCallback((hotspotId: string) => {
    setLoadedImages(prev => new Set(prev).add(hotspotId));
  }, []);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Culture: "bg-rose-500",
      Nature: "bg-emerald-500",
      Food: "bg-amber-500",
      Activity: "bg-blue-500",
      Unknown: "bg-slate-500",
    };
    return colors[category] || colors.Unknown;
  };

  const getFirstImage = (hotspot: Hotspot): string => {
    // First try to get from images array
    if (hotspot.images && hotspot.images.length > 0) {
      return hotspot.images[0];
    }
    // Fallback to placeholder - avoids 429 rate limiting from external sources
    return "/branding/spotly-logo.svg";
  };

  if (!hotspots || hotspots.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              ✨ Hidden gems worth exploring
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Handpicked adventures across Belgium.
            </p>
          </div>
          
          <Link 
            href="/hotspots"
            className="hidden md:flex items-center gap-1 text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Scroll Controls (Desktop) */}
        {isOverflowing && (
          <div className="hidden md:flex gap-2 mb-4 justify-end">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Horizontal Scroll Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 md:pb-6 scroll-smooth snap-x snap-mandatory scrollbar-hide"
          style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {hotspots.map((hotspot, index) => {
            const imageUrl = getFirstImage(hotspot);
            const isWishlisted = wishlistIds.includes(hotspot.id);
            const isLoaded = loadedImages.has(hotspot.id);
            const isPriority = index < 3; // Load first 3 images immediately

            return (
              <article
                key={hotspot.id}
                className="flex-shrink-0 w-[260px] md:w-[280px] snap-align-start"
                style={{ scrollSnapAlign: 'start' }}
              >
                <Link href={`/hotspots/${hotspot.id}`}>
                  <div className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    {/* Image Container */}
                    <div className="relative h-40 md:h-44 overflow-hidden">
                      <OptimizedImage
                        src={imageUrl}
                        alt={hotspot.name}
                        fill
                        sizes="280px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        priority={isPriority}
                        onLoadCallback={() => handleImageLoad(hotspot.id)}
                      />
                      
                      {/* Category Badge */}
                      <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(hotspot.category)}`}>
                        {hotspot.category}
                      </div>

                      {/* Wishlist Button */}
                      {onWishlistToggle && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onWishlistToggle(hotspot.id);
                          }}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
                          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <span aria-hidden="true" className={`text-[16px] leading-none ${isWishlisted ? "text-amber-600" : "text-slate-600"}`}>⟟</span></button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 truncate mb-1 group-hover:text-emerald-600 transition-colors">
                        {hotspot.name}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-slate-500 text-sm">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{hotspot.province}</span>
                      </div>

                      {/* Visit Count */}
                      {hotspot.visit_count !== undefined && hotspot.visit_count > 0 && (
                        <p className="text-xs text-slate-500 mt-2">
                          {hotspot.visit_count} visits
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {/* Mobile View All Link */}
        <div className="md:hidden mt-4 text-center">
          <Link 
            href="/hotspots"
            className="inline-flex items-center gap-1 text-emerald-600 font-medium text-sm"
          >
            View all hotspots
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

