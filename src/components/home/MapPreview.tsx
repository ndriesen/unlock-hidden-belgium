"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin, Maximize2, Layers, Navigation } from "lucide-react";
import { Hotspot } from "@/types/hotspot";

const MapContainer = dynamic(
  () =>
    import("@/components/Map/MapContainer").then(
      (mod) => mod.default as React.ComponentType<{
        viewMode?: "markers" | "heatmap";
        mapStyle?: "default" | "satellite" | "retro" | "terrain";
        searchQuery?: string;
        categoryFilter?: string;
        provinceFilter?: string;
        visitedIds?: string[];
        wishlistIds?: string[];
        favoriteIds?: string[];
        onSelect?: (hotspot: Hotspot) => void;
        onVisit?: (hotspotId: string) => void;
        onToast?: (message: string) => void;
        compact?: boolean;
      }>
    ),
  { ssr: false }
);

interface MapPreviewProps {
  hotspots: Hotspot[];
  visitedIds: string[];
  wishlistIds: string[];
  favoriteIds: string[];
  onSelect?: (hotspot: Hotspot) => void;
  onVisit?: (hotspotId: string) => void;
  onToast?: (message: string) => void;
}

export default function MapPreview({
  hotspots,
  visitedIds,
  wishlistIds,
  favoriteIds,
  onSelect,
  onVisit,
  onToast,
}: MapPreviewProps) {
  const [viewMode, setViewMode] = useState<"markers" | "heatmap">("markers");
  const [mapStyle, setMapStyle] = useState<"default" | "satellite" | "retro" | "terrain">("default");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleExploreMap = useCallback(() => {
    // Navigate to hotspots page for full exploration
    window.location.href = "/hotspots";
  }, []);

  return (
    <section 
      ref={containerRef}
      className={`relative rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 ${
        isFullscreen 
          ? "fixed inset-0 z-50 rounded-none" 
          : "h-[220px] md:h-[280px] lg:h-[320px] shadow-xl border border-slate-200"
      }`}
    >
      {/* Map Container */}
      <div className="absolute inset-0">
        <MapContainer
          viewMode={viewMode}
          mapStyle={mapStyle}
          visitedIds={visitedIds}
          wishlistIds={wishlistIds}
          favoriteIds={favoriteIds}
          onSelect={onSelect}
          onVisit={onVisit}
          onToast={onToast}
          compact={true}
        />
      </div>

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Top Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        {/* Location Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-sm">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-slate-800">Belgium</span>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode((prev) => prev === "markers" ? "heatmap" : "markers")}
            className="p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
            title={viewMode === "markers" ? "Switch to heatmap" : "Switch to markers"}
          >
            <Layers className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            <Maximize2 className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="flex items-center justify-between gap-3">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-sm">
              <span className="text-sm font-semibold text-slate-800">{hotspots.length}</span>
              <span className="text-xs text-slate-500 ml-1">spots</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-500/90 backdrop-blur-sm rounded-full shadow-sm">
              <span className="text-sm font-semibold text-white">{visitedIds.length}</span>
              <span className="text-xs text-white/80 ml-1">visited</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleExploreMap}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Navigation className="w-4 h-4" />
            <span className="text-sm">Explore Map</span>
          </button>
        </div>
      </div>

      {/* Map Style Selector - Shown on hover/focus */}
      <div className="absolute bottom-16 right-3 flex flex-col gap-1 opacity-0 hover:opacity-100 transition-opacity z-10">
        {(["default", "satellite", "retro", "terrain"] as const).map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className={`px-2 py-1 text-xs font-medium rounded capitalize transition-colors ${
              mapStyle === style
                ? "bg-emerald-500 text-white"
                : "bg-white/90 text-slate-600 hover:bg-white"
            }`}
          >
            {style}
          </button>
        ))}
      </div>
    </section>
  );
}

