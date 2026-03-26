"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin, Layers, Navigation } from "lucide-react";
import { Hotspot } from "@/types/hotspot";

const MapContainer = dynamic(
  () =>
    import("@/components/Map/MapContainer").then(
      (mod) => mod.default as React.ComponentType<MapContainerProps>
    ),
  { ssr: false }
);
import type { MapContainerProps } from '@/components/Map/MapContainer';

interface MapPreviewSectionProps {
  hotspots: Hotspot[];
  selectedCategory?: string;
  visitedIds: string[];
  wishlistIds: string[];
  favoriteIds: string[];
  onSelect?: (hotspot: Hotspot) => void;
  onVisit?: (hotspotId: string) => void;
  onToast?: (message: string) => void;
}

export default function MapPreviewSection({
  hotspots,
  visitedIds,
  wishlistIds,
  favoriteIds,
  onSelect,
  onVisit,
  onToast,
}: MapPreviewSectionProps) {
  const [viewMode, setViewMode] = useState<"markers" | "heatmap">("markers");
  const [mapStyle, setMapStyle] = useState<"default" | "satellite" | "retro" | "terrain">("default");

  const handleExploreFullMap = () => {
    window.location.href = "/hotspots";
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="h-[400px] md:h-[500px] relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 hover:shadow-3xl transition-all duration-500">
          {/* Map Container */}
          <div className="absolute inset-0">
            <MapContainer
              hotspots={hotspots}
              viewMode={viewMode}
              mapStyle={mapStyle}
              visitedIds={visitedIds}
              wishlistIds={wishlistIds}
              favoriteIds={favoriteIds}
              onSelect={onSelect}
              onVisit={onVisit}
              onToast={onToast}
              compact={true}
              autoFit={true}
              key={hotspots?.length}
            />
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        

          {/* Bottom CTA */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <button
              onClick={handleExploreFullMap}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.97] hover-lift text-lg"
            >
              <Navigation className="w-5 h-5" />
              Explore Full Map
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
