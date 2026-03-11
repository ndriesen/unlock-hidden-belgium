"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { MapPin, Navigation, Sparkles, ChevronRight } from "lucide-react";
import { Hotspot } from "@/types/hotspot";
import HotspotCard from "./HotspotCard";
import SkeletonCard from "./SkeletonCard";

interface AdventuresNearYouProps {
  hotspots: Hotspot[];
  userPosition?: [number, number];
  wishlistIds: string[];
  visitedIds: string[];
  onWishlistToggle: (hotspotId: string) => void;
  loading?: boolean;
}

function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function AdventuresNearYou({
  hotspots,
  userPosition,
  wishlistIds,
  visitedIds,
  onWishlistToggle,
  loading = false,
}: AdventuresNearYouProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Calculate distances when user position or hotspots change
  useEffect(() => {
    if (!userPosition || hotspots.length === 0) {
      setDistances({});
      return;
    }

    const newDistances: Record<string, number> = {};
    hotspots.forEach((hotspot) => {
      if (hotspot.latitude && hotspot.longitude) {
        const dist = calculateDistance(
          userPosition[0],
          userPosition[1],
          Number(hotspot.latitude),
          Number(hotspot.longitude)
        );
        newDistances[hotspot.id] = dist;
      }
    });
    setDistances(newDistances);
  }, [hotspots, userPosition]);

  // Sort hotspots by distance
  const sortedHotspots = [...hotspots].sort((a, b) => {
    const distA = distances[a.id] ?? Infinity;
    const distB = distances[b.id] ?? Infinity;
    return distA - distB;
  });

  // Get nearest hotspots (first 6)
  const nearestHotspots = sortedHotspots.slice(0, 6);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <section className="py-6 bg-gradient-to-b from-emerald-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              Adventures Near You
            </h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Personalized recommendations based on your location
          </p>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} variant="hotspot" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!hotspots || hotspots.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-gradient-to-b from-emerald-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Adventures Near You
          </h2>
        </div>
        
        <p className="text-sm text-slate-600 mb-4">
          {userPosition 
            ? "Personalized recommendations based on your location" 
            : "Enable location for personalized nearby discoveries"}
        </p>

        {/* Location prompt if no position */}
        {!userPosition && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800">
              <Navigation className="w-4 h-4" />
              <span className="text-sm font-medium">
                Enable location access to see nearby adventures
              </span>
            </div>
          </div>
        )}

        {/* Scroll Controls */}
        {nearestHotspots.length > 3 && (
          <div className="hidden md:flex gap-2 mb-4 justify-end">
            <button
              onClick={() => scroll('left')}
              className={`w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm ${!showLeftArrow ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!showLeftArrow}
            >
              <ChevronRight className="w-5 h-5 rotate-180 text-slate-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className={`w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm ${!showRightArrow ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!showRightArrow}
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        )}

        {/* Horizontal Scroll Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 md:pb-6 scroll-snap-x scroll-mandatory scrollbar-hide"
          style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
          onScroll={checkScroll}
        >
          {nearestHotspots.map((hotspot, index) => (
            <HotspotCard
              key={hotspot.id}
              hotspot={hotspot}
              distance={distances[hotspot.id]}
              isWishlisted={wishlistIds.includes(hotspot.id)}
              isVisited={visitedIds.includes(hotspot.id)}
              onWishlistToggle={onWishlistToggle}
              priority={index < 3}
            />
          ))}
        </div>

        {/* View All Link */}
        {hotspots.length > 6 && (
          <div className="mt-4 text-center">
            <Link 
              href="/hotspots"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              View all {hotspots.length} spots
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
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

