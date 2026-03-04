"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/Supabase/browser-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import HotspotPanel from "@/components/HotspotPanel";
import HotspotSheet from "@/components/HotspotSheet";
import Toast from "@/components/Toast";
import { markVisited } from "@/lib/services/gamification";
import SidebarLayout from "@/components/SidebarLayout";
import { useSearch } from "@/context/SearchContext";
import type { MapContainerProps } from "@/components/Map/MapContainer";
import { Hotspot } from "@/types/hotspot";



const MapContainer = dynamic(
  () =>
    import("@/components/Map/MapContainer").then(
      (mod) => mod.default as React.ComponentType<MapContainerProps>
    ),
  { ssr: false }
);


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { searchQuery } = useSearch();
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [viewMode, setViewMode] = useState<"markers" | "heatmap">("markers");
  const [mapStyle, setMapStyle] = useState<"default" | "satellite">("default");
  const [toast, setToast] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  const handleWishlist = async (id: string) => {
     // call supabase update
  };

  const handleFavorite = async (id: string) => {
    // call supabase update
  };


  // FETCH FILTER VALUES FROM SUPABASE
  useEffect(() => {
  const loadFilters = async () => {
    const { data, error } = await supabase
      .from("hotspots")
      .select("category, province");

    if (error || !data) return;

    const uniqueCategories = Array.from(
      new Set(data.map((h) => h.category).filter(Boolean))
    );

    const uniqueProvinces = Array.from(
      new Set(data.map((h) => h.province).filter(Boolean))
    );

    setCategories(uniqueCategories);
    setProvinces(uniqueProvinces);
  };

  loadFilters();
}, []);



  /* ========================================================= */
  /* ================= LOAD USER HOTSPOTS ==================== */
  /* ========================================================= */

  useEffect(() => {
    const loadUserHotspots = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("user_hotspots")
        .select("hotspot_id, status")
        .eq("user_id", user.id);

      if (!data) return;

      setVisitedIds(
        data.filter((d) => d.status === "visited").map((d) => d.hotspot_id)
      );

      setWishlistIds(
        data.filter((d) => d.status === "wishlist").map((d) => d.hotspot_id)
      );

      setFavoriteIds(
        data.filter((d) => d.status === "favorite").map((d) => d.hotspot_id)
      );
    };

    loadUserHotspots();
  }, [user]);

  /* ========================================================= */
  /* ================= VISIT HANDLER ========================= */
  /* ========================================================= */

  const handleVisit = async (hotspotId: string) => {
    if (!user) {
      setToast("Login required");
      return;
    }

    if (visitedIds.includes(hotspotId)) return;

    await markVisited(user.id, hotspotId);

    setVisitedIds((prev) => [...prev, hotspotId]);

    setToast("+50 XP earned!");

    // 🏆 Simple achievements
    if (visitedIds.length + 1 === 10) {
      setToast("🏆 Explorer Achievement Unlocked!");
    }

    if (visitedIds.length + 1 === 25) {
      setToast("🏆 Adventurer Achievement Unlocked!");
    }
  };

  if (loading) return null;

return (
  <div className="flex flex-col h-full space-y-6">

    {/* CONTROL BAR */}
    <div className="backdrop-blur-xl bg-white/70 border border-white/40 shadow-xl rounded-2xl p-4 flex flex-wrap gap-4 items-center">

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat}>{cat}</option>
        ))}
      </select>

      <select
        value={provinceFilter}
        onChange={(e) => setProvinceFilter(e.target.value)}
        className="px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm"
      >
        <option value="">All Provinces</option>
        {provinces.map((prov) => (
          <option key={prov}>{prov}</option>
        ))}
      </select>

      <div className="flex-1" />

      <button
        onClick={() =>
          setViewMode((prev) =>
            prev === "markers" ? "heatmap" : "markers"
          )
        }
        className="px-4 py-2 bg-emerald-600 text-white rounded-full"
      >
        {viewMode === "markers" ? "Heatmap" : "Markers"}
      </button>

      <button
        onClick={() =>
          setMapStyle((prev) =>
            prev === "default" ? "satellite" : "default"
          )
        }
        className="px-4 py-2 bg-slate-800 text-white rounded-full"
      >
        {mapStyle === "default" ? "Satellite" : "Default"}
      </button>
    </div>

    {/* MAP */}
    <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl border border-white/40">
      <MapContainer
        hotspots = {hotspots}
        viewMode={viewMode}
        mapStyle={mapStyle}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        provinceFilter={provinceFilter}
        visitedIds={visitedIds}
        wishlistIds={wishlistIds}
        favoriteIds={favoriteIds}
        onSelect={setSelected}
        onVisit={handleVisit}
        onToast={(msg) => {
          setToast(msg);
          setTimeout(() => setToast(null), 3000);
        }}
      />
    </div>

    <HotspotPanel
      hotspot={selected}
      onClose={() => setSelected(null)}
      onVisit={handleVisit}
      onWishlist={handleWishlist}
      onFavorite={handleFavorite}
      isVisited={visitedIds.includes(selected?.id ?? "")}
      isWishlist={wishlistIds.includes(selected?.id ?? "")}
      isFavorite={favoriteIds.includes(selected?.id ?? "")}
    />

    <HotspotSheet
      hotspot={selected}
      onClose={() => setSelected(null)}
      onVisit={handleVisit}
      onWishlist={handleWishlist}
      onFavorite={handleFavorite}
      isVisited={visitedIds.includes(selected?.id ?? "")}
      isWishlist={wishlistIds.includes(selected?.id ?? "")}
      isFavorite={favoriteIds.includes(selected?.id ?? "")}
    />

    {toast && <Toast message={toast} />}
  </div>
);
}