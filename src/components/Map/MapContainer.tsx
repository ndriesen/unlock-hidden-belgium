"use client";

import { useEffect, useMemo, useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { fetchHotspots } from "@/lib/services/hotspots";
import { supabase } from "@/lib/Supabase/browser-client";
import MapView, { MapViewHandle } from "./MapView";
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
  compact?: boolean;
  selectedCategory?: string;
  hotspots?: Hotspot[];
  selectedHotspotId?: string | null;
  loading?: boolean;

  searchQuery?: string;
  categoryFilter?: string;
  provinceFilter?: string;
  viewMode: "markers" | "heatmap";
  mapStyle?: "default" | "satellite" | "retro" | "terrain";
  preventZoom?: boolean;

  visitedIds: string[];
  wishlistIds: string[];
  favoriteIds: string[];

  onSelect?: (hotspot: Hotspot) => void;
  onVisit?: (id: string) => void;
  onToast?: (msg: string) => void;
}

export interface MapContainerHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

function getCoordinates(hotspot: Hotspot): [number, number] | null {
  const lat = hotspot.lat ?? hotspot.latitude;
  const lng = hotspot.lng ?? hotspot.longitude;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return [lat, lng];
}

// Wrap MapContainer with forwardRef to expose flyTo method
const MapContainer = forwardRef<MapContainerHandle, MapContainerProps>(({
  compact = false,
  categoryFilter,
  provinceFilter,
  viewMode,
  searchQuery,
  mapStyle = "default",
  preventZoom = false,
  visitedIds,
  wishlistIds,
  favoriteIds,
  onSelect,
  onVisit,
  onToast,
  hotspots: providedHotspots,
  selectedHotspotId,
  loading: loadingOverride,
}, ref) => {
  const [internalHotspots, setInternalHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(!providedHotspots);
  const mapViewRef = useRef<MapViewHandle | null>(null);
  const onToastRef = useRef(onToast);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const loadHotspots = useCallback(async () => {
    if (providedHotspots) return;

    setLoading(true);
    try {
      const data = (await fetchHotspots()) as HotspotRow[] | null;

      if (!data) {
        setInternalHotspots([]);
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

      setInternalHotspots(mapped);
    } catch (error) {
      console.error("Failed to load hotspots:", error);
      onToastRef.current?.("Unable to load hotspots.");
    } finally {
      setLoading(false);
    }
  }, [providedHotspots]);

  useEffect(() => {
    if (providedHotspots) {
      setLoading(false);
      return;
    }

    void loadHotspots();
  }, [loadHotspots, providedHotspots]);

  useEffect(() => {
    if (providedHotspots) return;

    const channel = supabase
      .channel("hotspots-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hotspots" },
        async () => {
          await loadHotspots();
          onToastRef.current?.("Map updated.");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadHotspots, providedHotspots]);

  const activeHotspots = providedHotspots ?? internalHotspots;

  // Filter hotspots based on search & filters (skip if provided list is already filtered)
  const filtered = useMemo(() => {
    if (providedHotspots) return activeHotspots;

    const q = searchQuery?.trim().toLowerCase();

    return activeHotspots.filter((hotspot) => {
      if (categoryFilter && hotspot.category !== categoryFilter) return false;
      if (provinceFilter && hotspot.province !== provinceFilter) return false;

      if (!q) return true;

      return (
        hotspot.name.toLowerCase().includes(q) ||
        hotspot.category.toLowerCase().includes(q) ||
        hotspot.province.toLowerCase().includes(q)
      );
    });
  }, [activeHotspots, categoryFilter, provinceFilter, searchQuery, providedHotspots]);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, zoom = 16) => {
      mapViewRef.current?.flyTo([lat, lng], zoom);
    },
  }));

  useEffect(() => {
    if (!selectedHotspotId || preventZoom) return;

    const selected = filtered.find((hotspot) => hotspot.id === selectedHotspotId);
    if (!selected) return;

    const coords = getCoordinates(selected);
    if (!coords) return;

    mapViewRef.current?.flyTo(coords, 16);
  }, [filtered, preventZoom, selectedHotspotId]);

  const isLoading = typeof loadingOverride === "boolean" ? loadingOverride : loading;

  return (
    <MapView
      ref={mapViewRef}
      hotspots={filtered}
      loading={isLoading}
      compact={compact}
      visitedIds={visitedIds}
      wishlistIds={wishlistIds}
      favoriteIds={favoriteIds}
      viewMode={viewMode}
      mapStyle={mapStyle}
      preventZoom={preventZoom}
      onSelect={onSelect}
      onVisit={onVisit ?? undefined}
      selectedHotspotId={selectedHotspotId ?? null}
    />
  );
});

export default MapContainer;
