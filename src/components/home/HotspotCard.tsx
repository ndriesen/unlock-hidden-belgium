"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { MapPin, Star, Navigation } from "lucide-react";
import { Hotspot } from "@/types/hotspot";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface HotspotCardProps {
  hotspot: Hotspot;
  distance?: number; // in km
  isWishlisted?: boolean;
  isVisited?: boolean;
  showDistance?: boolean;
  onWishlistToggle?: (hotspotId: string) => void;
  onVisit?: (hotspotId: string) => void;
  priority?: boolean;
}

import { getSafeDisplay } from "@/types/hotspot";

function getCategoryColor(category: Hotspot['category']): string {
const displayName = getSafeDisplay(category);
  const colors: Record<string, string> = {
    Nature: "bg-emerald-500",
    Bars: "bg-amber-500",
    Castles: "bg-purple-500",
    Waterfalls: "bg-cyan-500",
    Viewpoints: "bg-blue-500",
    Food: "bg-orange-500",
    Culture: "bg-rose-500",
    Activity: "bg-yellow-500",
    Sunset: "bg-gradient-to-r from-orange-500 to-pink-500",
    Schedule: "bg-indigo-500",
    Unknown: "bg-slate-500",
  };
  return colors[displayName] || colors.Unknown;
}

function getFirstImage(hotspot: Hotspot): string {
  if (hotspot.images && hotspot.images.length > 0) {
    return hotspot.images[0];
  }
  return "/images/placeholder-image.jfif";
}

function formatDistance(distanceKm: number | undefined): string {
  if (distanceKm === undefined || distanceKm === null) return "";
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export default function HotspotCard({
  hotspot,
  distance,
  isWishlisted = false,
  isVisited = false,
  showDistance = true,
  onWishlistToggle,
  onVisit,
  priority = false,
}: HotspotCardProps) {
  const [isTapped, setIsTapped] = useState(false);
  const [heartBounce, setHeartBounce] = useState(false);

  const handleWishlistClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartBounce(true);
    onWishlistToggle?.(hotspot.id);
    setTimeout(() => setHeartBounce(false), 300);
  }, [hotspot.id, onWishlistToggle]);

  const handleTapStart = useCallback(() => {
    setIsTapped(true);
  }, []);

  const handleTapEnd = useCallback(() => {
    setIsTapped(false);
  }, []);

  const imageUrl = getFirstImage(hotspot);
  const categoryColor = getCategoryColor(hotspot.category);

  return (
    <article
      className="flex-shrink-0 w-[260px] md:w-[280px] snap-align-start"
      style={{ scrollSnapAlign: 'start' }}
      onTouchStart={handleTapStart}
      onTouchEnd={handleTapEnd}
      onMouseDown={handleTapStart}
      onMouseUp={handleTapEnd}
      onMouseLeave={handleTapEnd}
    >
      <Link href={`/hotspots/${hotspot.id}`}>
        <div 
          className={`
            group relative rounded-2xl border border-slate-200 bg-white overflow-hidden
            transition-all duration-200 ease-out
            hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]
            active:scale-[0.97] active:shadow-md
            ${isTapped ? 'scale-[0.97] shadow-md' : 'shadow-sm'}
          `}
        >
          {/* Image Container */}
          <div className="relative h-40 md:h-44 overflow-hidden">
            <OptimizedImage
              src={imageUrl}
              alt={hotspot.name}
              fill
              sizes="280px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority={priority}
            />
            
            {/* Category Badge */}
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-lg ${categoryColor}`}>
{getSafeDisplay(hotspot.category)}
            </div>

            {/* Wishlist Button */}
            {onWishlistToggle && (
              <button
                onClick={handleWishlistClick}
                className={`
                  absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm 
                  flex items-center justify-center transition-all duration-200 
                  hover:scale-110 active:scale-95 shadow-md
                  ${heartBounce ? 'animate-bounce' : ''}
                `}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <span aria-hidden="true" className={`text-[16px] leading-none ${isWishlisted ? "text-amber-600" : "text-slate-600"}`}>⟟</span></button>
            )}

            {/* Visited Badge */}
            {isVisited && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-emerald-500 shadow-lg flex items-center gap-1">
                <span aria-hidden="true" className="text-[14px] leading-none">✓</span> Visited
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-slate-900 truncate flex-1 group-hover:text-emerald-600 transition-colors">
                {hotspot.name}
              </h3>
              
              {/* Rating */}
              {(hotspot.visit_count !== undefined && hotspot.visit_count > 0) && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium text-slate-700">
                    {hotspot.visit_count > 100 ? 'Popular' : hotspot.visit_count}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{hotspot.province}</span>
            </div>

            {/* Distance */}
            {showDistance && distance !== undefined && distance !== null && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Navigation className="w-3 h-3" />
                {formatDistance(distance)} away
              </div>
            )}

            {/* Visit Count */}
            {hotspot.visit_count !== undefined && hotspot.visit_count > 0 && (
              <p className="text-xs text-slate-500">
                {hotspot.visit_count} explorers visited
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

// Horizontal scroll carousel component
interface HotspotCarouselProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  hotspots: Hotspot[];
  distances?: Record<string, number>;
  wishlistIds?: string[];
  visitedIds?: string[];
  onWishlistToggle?: (hotspotId: string) => void;
  onVisit?: (hotspotId: string) => void;
  viewAllLink?: string;
  loading?: boolean;
}

export function HotspotCarousel({
  title,
  subtitle,
  icon,
  hotspots,
  distances = {},
  wishlistIds = [],
  visitedIds = [],
  onWishlistToggle,
  onVisit,
  viewAllLink,
  loading = false,
}: HotspotCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

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

  if (loading) {
    return (
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="h-6 bg-slate-200 rounded w-40 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-60 animate-pulse" />
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[260px] animate-pulse">
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="h-40 md:h-44 bg-slate-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && <div className="text-2xl">{icon}</div>}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h2>
              {subtitle && (
                <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          
          {viewAllLink && (
            <Link 
              href={viewAllLink}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              View all
            </Link>
          )}
        </div>

        {/* Scroll Controls */}
        {hotspots.length > 3 && (
          <div className="hidden md:flex gap-2 mb-4 justify-end">
            <button
              onClick={() => scroll('left')}
              className={`w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm ${!showLeftArrow ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!showLeftArrow}
            >
              <svg className="w-5 h-5 text-slate-600 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className={`w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm ${!showRightArrow ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!showRightArrow}
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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
          {hotspots.map((hotspot, index) => (
            <HotspotCard
              key={hotspot.id}
              hotspot={hotspot}
              distance={distances[hotspot.id]}
              isWishlisted={wishlistIds.includes(hotspot.id)}
              isVisited={visitedIds.includes(hotspot.id)}
              onWishlistToggle={onWishlistToggle}
              onVisit={onVisit}
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



