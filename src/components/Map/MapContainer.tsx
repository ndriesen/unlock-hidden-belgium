"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchHotspots } from "@/lib/services/hotspots";
import { markVisited } from "@/lib/services/gamification";
import MapView from "./MapView";
import { supabase } from "@/lib/Supabase/browser-client";
import { Hotspot } from "@/app/page";

interface Props {
  categoryFilter?: string;
  provinceFilter?: string;
  viewMode: "markers" | "heatmap";
  mapStyle?: "default" | "satellite";
  onSelect: (h: Hotspot) => void;
  onToast: (msg: string) => void;
}

export default function MapContainer({
  categoryFilter,
  provinceFilter,
  viewMode,
  mapStyle = "default",
  onSelect,
  onToast,
}: Props) {

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  /* ========================================================= */
  /* ================= AUTH + USER HOTSPOTS ================== */
  /* ========================================================= */

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id ?? null;
      setUserId(uid);

      if (!uid) return;

      const { data: userHotspots } = await supabase
        .from("user_hotspots")
        .select("hotspot_id, status")
        .eq("user_id", uid);

      if (!userHotspots) return;

      setVisitedIds(
        userHotspots
          .filter((d) => d.status === "visited")
          .map((d) => d.hotspot_id)
      );

      setWishlistIds(
        userHotspots
          .filter((d) => d.status === "wishlist")
          .map((d) => d.hotspot_id)
      );

      setFavoriteIds(
        userHotspots
          .filter((d) => d.status === "favorite")
          .map((d) => d.hotspot_id)
      );
    };

    getUser();
  }, []);

  /* ========================================================= */
  /* ================= LOAD HOTSPOTS ========================= */
  /* ========================================================= */

  const loadHotspots = useCallback(async () => {
    const data = await fetchHotspots();
    if (!data) return;

    const mapped: Hotspot[] = data
      .filter(
        (h: any) =>
          h.latitude != null &&
          h.longitude != null
      )
      .map((h: any) => ({
        id: h.id,
        name: h.name,
        latitude: Number(h.latitude),
        longitude: Number(h.longitude),
        category: h.category,
        province: h.province,
      }));

    setHotspots(mapped);
  }, []);

  useEffect(() => {
    loadHotspots();
  }, [loadHotspots]);

  /* ========================================================= */
  /* ================= REALTIME SUBSCRIPTIONS ================ */
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadHotspots]);

  /* ========================================================= */
  /* ================= FILTERING ============================= */
  /* ========================================================= */

  const filtered = useMemo(() => {
    if (!categoryFilter && !provinceFilter) return hotspots;

    return hotspots.filter(
      (h) =>
        (!categoryFilter || h.category === categoryFilter) &&
        (!provinceFilter || h.province === provinceFilter)
    );
  }, [hotspots, categoryFilter, provinceFilter]);

  /* ========================================================= */
  /* ================= VISIT HANDLER ========================= */
  /* ========================================================= */

  const handleVisit = async (hotspotId: string) => {
    if (!userId) {
      onToast("Login required");
      return;
    }

    if (visitedIds.includes(hotspotId)) return;

    await markVisited(userId, hotspotId);

    setVisitedIds((prev) => [...prev, hotspotId]);

    onToast("+10 XP earned!");
  };

  /* ========================================================= */
  /* ================= PREDICTIVE ENGINE ===================== */
  /* ========================================================= */

  const recommendations = useMemo(() => {
    if (!visitedIds.length) return [];

    const visitedHotspots = hotspots.filter((h) =>
      visitedIds.includes(h.id)
    );

    const categoryCount: Record<string, number> = {};

    visitedHotspots.forEach((h) => {
      categoryCount[h.category] =
        (categoryCount[h.category] || 0) + 1;
    });

    const favoriteCategory = Object.keys(categoryCount)
      .sort((a, b) => categoryCount[b] - categoryCount[a])[0];

    return hotspots.filter(
      (h) =>
        h.category === favoriteCategory &&
        !visitedIds.includes(h.id)
    );
  }, [hotspots, visitedIds]);

  /* ========================================================= */
  /* ================= ACHIEVEMENT CHECK ===================== */
  /* ========================================================= */

  useEffect(() => {
    if (visitedIds.length === 10) {
      onToast("🏆 Explorer Achievement Unlocked!");
    }

    if (visitedIds.length === 25) {
      onToast("🏆 Adventurer Achievement Unlocked!");
    }
  }, [visitedIds, onToast]);

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
      onVisit={handleVisit}
    />
  );
}