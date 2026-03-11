"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Trees, Mountain, ChevronRight, Leaf } from "lucide-react";
import { Hotspot } from "@/types/hotspot";
import HotspotCard from "./HotspotCard";
import SkeletonCard from "./SkeletonCard";

interface NatureDiscoveriesProps {
  hotspots: Hotspot[];
  wishlistIds: string[];
  visitedIds: string[];
  onWishlistToggle: (hotspotId: string) => void;
  loading?: boolean;
}

export default function NatureDiscoveries({
  hotspots,
  wishlistIds,
  visitedIds,
  onWishlistToggle,
  loading = false,
}: NatureDiscoveriesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Filter hotspots by Nature category or related categories
  const natureCategories = ['Nature', 'Waterfalls', 'Viewpoints'];
  const natureHotspots = hotspots
    .filter(h => natureCategories.includes(h.category))
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
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 rounded-lg">
              <Trees className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              Nature Discoveries
            </h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Escape to forests, waterfalls, and scenic viewpoints
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

  if (!hotspots || natureHotspots.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 rounded-lg">
            <Trees className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Nature Discoveries
          </h2>
        </div>
        
        <p className="text-sm text-slate-600 mb-4">
          Escape to forests, waterfalls, and scenic viewpoints
        </p>

        {/* Scroll Controls */}
        {natureHotspots.length > 3 && (
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
          {natureHotspots.map((hotspot, index) => (
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

        {/* View All Link */}
        <div className="mt-4 text-center">
          <Link 
            href="/hotspots?category=Nature"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Explore more nature
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

