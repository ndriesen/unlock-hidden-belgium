"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchHotspots } from "@/lib/services/hotspots";
import { supabase } from "@/lib/Supabase/browser-client";
import MapView from "./MapView";
import { Hotspot } from "@/types/hotspot";

export interface MapContainerProps {
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
  const [loading, setLoading] = useState(true);

  /* ========================================================= */
  /* LOAD HOTSPOTS                                             */
  /* ========================================================= */

  const loadHotspots = useCallback(async () => {
    setLoading(true);

    const data = await fetchHotspots();

    if (!data) {
      setLoading(false);
      return;
    }

    const mapped: Hotspot[] = data
      .filter((h: any) => h.latitude && h.longitude)
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
        visit_count: h.visit_count ?? 0,
      }));

    setHotspots(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHotspots();
  }, [loadHotspots]);

  /* ========================================================= */
  /* REALTIME UPDATES                                          */
  /* ========================================================= */

  useEffect(() => {
    const channel = supabase
      .channel("hotspots-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hotspots" },
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
  /* FILTERING                                                 */
  /* ========================================================= */

  const filtered = useMemo(() => {
    const q = searchQuery?.toLowerCase();

    return hotspots.filter((h) => {
      if (categoryFilter && h.category !== categoryFilter) return false;
      if (provinceFilter && h.province !== provinceFilter) return false;

      if (!q) return true;

      return (
        h.name.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q) ||
        h.province.toLowerCase().includes(q)
      );
    });
  }, [hotspots, categoryFilter, provinceFilter, searchQuery]);

  /* ========================================================= */
  /* RENDER                                                    */
  /* ========================================================= */

  return (
    <MapView
      hotspots={filtered}
      loading={loading}
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