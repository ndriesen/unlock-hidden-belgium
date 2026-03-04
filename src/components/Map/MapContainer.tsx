"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchHotspots } from "@/lib/services/hotspots";
import { supabase } from "@/lib/Supabase/browser-client";
import MapView from "./MapView";
import { markVisited } from "@/lib/services/gamification";
import { Hotspot } from "@/types/hotspot";

export interface MapContainerProps {
  hotspots: Hotspot[];
  searchQuery?: string;
  categoryFilter?: string;
  provinceFilter?: string;
  viewMode: "markers" | "heatmap";
  mapStyle?: "default" | "satellite";
  visitedIds: string[];
  wishlistIds: string[];
  favoriteIds: string[];
  onSelect: (h: Hotspot) => void;
  onVisit: (id: string) => void;
  onToast: (msg: string) => void;
}

export default function MapContainer({
  categoryFilter,
  provinceFilter,
  viewMode,
  searchQuery,
  mapStyle = "default",
  visitedIds,
  wishlistIds,
  favoriteIds,
  onSelect,
  onVisit,
  onToast,
}: MapContainerProps) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  /* ========================================================= */
  /* ================= LOAD HOTSPOTS ========================= */
  /* ========================================================= */

  const loadHotspots = useCallback(async () => {
    const data = await fetchHotspots();
    if (!data) return;

    const mapped: Hotspot[] = data
      .filter((h: any) => h.latitude != null && h.longitude != null)
      .map((h: any) => ({
        id: h.id,
        name: h.name,
        latitude: Number(h.latitude),
        longitude: Number(h.longitude),
        category: h.category,
        province: h.province,
        description: h.description,
        images: h.images,
        opening_hours: h.opening_hours,
        combine_with: h.combine_with,
        visit_count: h.visit_count,
      }));

    setHotspots(mapped);
  }, []);

  useEffect(() => {
    loadHotspots();
  }, [loadHotspots]);

  /* ========================================================= */
  /* ================= REALTIME UPDATES ====================== */
  /* ========================================================= */

  useEffect(() => {
    const channel = supabase
      .channel("hotspots-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hotspots",
        },
        () => {
          loadHotspots();
          onToast("Map updated");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadHotspots, onToast]);

  /* ========================================================= */
  /* ================= FILTERING ============================= */
  /* ========================================================= */

  const filtered = useMemo(() => {
    return hotspots.filter((h) => {
      const matchesCategory =
        !categoryFilter || h.category === categoryFilter;

      const matchesProvince =
        !provinceFilter || h.province === provinceFilter;

      const matchesSearch =
        !searchQuery ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.province.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesProvince && matchesSearch;
    });
  }, [hotspots, categoryFilter, provinceFilter, searchQuery]);

  /* ========================================================= */
  /* ================= RENDER ================================ */
  /* ========================================================= */

  return (
    <MapView
      hotspots={filtered}
      visitedIds={visitedIds}
      wishlistIds={wishlistIds}
      favoriteIds={favoriteIds}
      viewMode={viewMode}
      mapStyle={mapStyle}
      onSelect={onSelect}
      onVisit={onVisit}
    />
  );
}