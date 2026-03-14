"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Flame, ChevronRight, TrendingUp } from "lucide-react";
import { Hotspot } from "@/types/hotspot";
import HotspotCard from "./HotspotCard";
import SkeletonCard from "./SkeletonCard";

interface TrendingHotspotsProps {
  hotspots: Hotspot[];
  wishlistIds: string[];
  visitedIds: string[];
  onWishlistToggle: (hotspotId: string) => void;
  loading?: boolean;
  selectedCategory?: string;
}

export default function TrendingHotspots({
  hotspots,
  wishlistIds,
  visitedIds,
  onWishlistToggle,
  loading = false,
  selectedCategory = "",
}: TrendingHotspotsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Filter by category first, then get top 6 trending
  const filteredHotspots = selectedCategory 
    ? hotspots.filter(h => h.category === selectedCategory)
    : hotspots;
    
  // Get top 6 trending hotspots (by visit count)
  const trendingHotspots = [...filteredHotspots]
    .sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0))
    .slice(0, 6);

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
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              Trending This Week
            </h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Hotspots getting the most attention from explorers
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
    <section className="py-6">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-orange-500 to-rose-500 rounded-lg">
            <span className="text-lg">🔥</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Trending near you
          </h2>
        </div>
        
        <p className="text-sm text-slate-600 mb-4">
          Places explorers are discovering this week.
        </p>
        {/* View All + Scroll Controls */}
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/hotspots?sort=popular"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            See all trending
            <ChevronRight className="w-4 h-4" />
          </Link>

          {trendingHotspots.length > 3 && (
            <div className="hidden md:flex gap-2">
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
        </div>

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
          {trendingHotspots.map((hotspot, index) => (
            <HotspotCard
              key={hotspot.id}
              hotspot={hotspot}
              isWishlisted={wishlistIds.includes(hotspot.id)}
              isVisited={visitedIds.includes(hotspot.id)}
              onWishlistToggle={onWishlistToggle}
              priority={index < 3}
            />
          ))}
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

