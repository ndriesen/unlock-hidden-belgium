"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { fetchHotspots } from "@/lib/services/hotspots";
import { supabase } from "@/lib/Supabase/browser-client";
import MapView from "./MapView";
import { Hotspot } from "@/types/hotspot";

interface HotspotRow {
  id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
  category: string | null;
  province: string | null;
  description?: string | null;
  images?: string[] | null;
  opening_hours?: string | null;
  combine_with?: string[] | null;
  visit_count?: number | null;
  likes_count?: number | null;
  saves_count?: number | null;
}

export interface MapContainerProps {
  searchQuery?: string;
  categoryFilter?: string;
  provinceFilter?: string;
  viewMode: "markers" | "heatmap";
  mapStyle?: "default" | "satellite" | "retro" | "terrain";

  visitedIds: string[];
  wishlistIds: string[];
  favoriteIds: string[];

  onSelect: (hotspot: Hotspot) => void;
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
  const onToastRef = useRef(onToast);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const loadHotspots = useCallback(async () => {
    setLoading(true);

    try {
      const data = (await fetchHotspots()) as HotspotRow[] | null;

      if (!data) {
        setHotspots([]);
        return;
      }

      const mapped: Hotspot[] = data
        .filter((hotspot) => hotspot.latitude !== null && hotspot.longitude !== null)
        .map((hotspot) => ({
          id: hotspot.id,
          name: hotspot.name,
          latitude: Number(hotspot.latitude),
          longitude: Number(hotspot.longitude),
          category: hotspot.category ?? "Unknown",
          province: hotspot.province ?? "Unknown",
          description: hotspot.description ?? undefined,
          images: hotspot.images ?? undefined,
          opening_hours: hotspot.opening_hours ?? undefined,
          combine_with: hotspot.combine_with ?? undefined,
          visit_count: hotspot.visit_count ?? 0,
          likes_count: hotspot.likes_count ?? 0,
          saves_count: hotspot.saves_count ?? 0,
        }));

      setHotspots(mapped);
    } catch (error) {
      console.error("Failed to load hotspots:", error);
      onToastRef.current("Unable to load hotspots.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHotspots();
  }, [loadHotspots]);

  useEffect(() => {
    const channel = supabase
      .channel("hotspots-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hotspots" },
        async () => {
          await loadHotspots();
          onToastRef.current("Map updated.");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadHotspots]);

  const filtered = useMemo(() => {
    const q = searchQuery?.trim().toLowerCase();

    return hotspots.filter((hotspot) => {
      if (categoryFilter && hotspot.category !== categoryFilter) return false;
      if (provinceFilter && hotspot.province !== provinceFilter) return false;

      if (!q) return true;

      return (
        hotspot.name.toLowerCase().includes(q) ||
        hotspot.category.toLowerCase().includes(q) ||
        hotspot.province.toLowerCase().includes(q)
      );
    });
  }, [hotspots, categoryFilter, provinceFilter, searchQuery]);

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

