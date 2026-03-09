"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/Supabase/browser-client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import HotspotPanel from "@/components/HotspotPanel";
import HotspotSheet from "@/components/HotspotSheet";
import Toast from "@/components/Toast";
import {
  markVisited,
  toggleWishlist,
  toggleFavorite,
} from "@/lib/services/gamification";
import { useSearch } from "@/context/SearchContext";
import type { MapContainerProps } from "@/components/Map/MapContainer";
import { Hotspot } from "@/types/hotspot";
import BadgeCelebration from "@/components/BadgeCelebration";
import MissionDeck from "@/components/home/MissionDeck";
import LeaguePanel from "@/components/home/LeaguePanel";
import NearbyQuests from "@/components/home/NearbyQuests";
import HeroSection from "@/components/home/HeroSection";
import { fetchVisitStatsForUser } from "@/lib/services/engagement";
import { addHotspotToQuickTrip } from "@/lib/services/tripBuilder";
import { fetchHotspots } from "@/lib/services/hotspots";
import { NearbyQuest, buildNearbyQuests } from "@/lib/services/quests";

const MapContainer = dynamic(
  () =>
    import("@/components/Map/MapContainer").then(
      (mod) => mod.default as React.ComponentType<MapContainerProps>
    ),
  { ssr: false }
);

interface HotspotFilterRow {
  category: string | null;
  province: string | null;
}

interface UserHotspotRow {
  hotspot_id: string;
  visited: boolean;
  wishlist: boolean;
  favorite: boolean;
}

interface HotspotQuestRow {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  category: string | null;
  province: string | null;
  images?: string[] | null;
}

function mapQuestHotspots(rows: HotspotQuestRow[]): Hotspot[] {
  return rows
    .filter((row) => row.latitude !== null && row.longitude !== null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      category: row.category ?? "Unknown",
      province: row.province ?? "Unknown",
      images: row.images ?? undefined,
    }));
}

export default function Home() {
  const { user, loading } = useAuth();
  const { searchQuery } = useSearch();

  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [viewMode, setViewMode] = useState<"markers" | "heatmap">("markers");
  const [mapStyle, setMapStyle] = useState<"default" | "satellite" | "retro" | "terrain">("default");
  const [toast, setToast] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [badgeCelebration, setBadgeCelebration] = useState(false);
  const [visitStreak, setVisitStreak] = useState(0);
  const [visitedToday, setVisitedToday] = useState(false);

  const [questCandidates, setQuestCandidates] = useState<Hotspot[]>([]);
  const [nearbyQuests, setNearbyQuests] = useState<NearbyQuest[]>([]);
  const [questLoading, setQuestLoading] = useState(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleWishlist = useCallback(
    async (hotspotId: string) => {
      if (!user) {
        showToast("Login required.");
        return;
      }

      try {
        const newValue = await toggleWishlist(user.id, hotspotId);

        setWishlistIds((prev) => {
          if (newValue) {
            if (prev.includes(hotspotId)) return prev;
            return [...prev, hotspotId];
          }

          return prev.filter((id) => id !== hotspotId);
        });

        showToast(newValue ? "Added to wishlist." : "Removed from wishlist.");
      } catch (error) {
        console.error("Wishlist toggle failed:", error);
        showToast("Could not update wishlist.");
      }
    },
    [showToast, user]
  );

  const handleFavorite = useCallback(
    async (hotspotId: string) => {
      if (!user) {
        showToast("Login required.");
        return;
      }

      try {
        const newValue = await toggleFavorite(user.id, hotspotId);

        setFavoriteIds((prev) => {
          if (newValue) {
            if (prev.includes(hotspotId)) return prev;
            return [...prev, hotspotId];
          }

          return prev.filter((id) => id !== hotspotId);
        });

        showToast(newValue ? "Added to favorites." : "Removed from favorites.");
      } catch (error) {
        console.error("Favorite toggle failed:", error);
        showToast("Could not update favorites.");
      }
    },
    [showToast, user]
  );

  const handleAddToTrip = useCallback(
    async (hotspot: Hotspot) => {
      if (!user) {
        showToast("Login required.");
        return;
      }

      await addHotspotToQuickTrip(user.id, hotspot);
      showToast(`Added ${hotspot.name} to Quick Ideas.`);
    },
    [showToast, user]
  );

  useEffect(() => {
    const loadFiltersAndQuests = async () => {
      try {
        const { data, error } = await supabase
          .from("hotspots")
          .select("category, province");

        if (!error && data) {
          const rows = data as HotspotFilterRow[];

          const uniqueCategories = Array.from(
            new Set(
              rows
                .map((item) => item.category)
                .filter((value): value is string => Boolean(value))
            )
          ).sort((a, b) => a.localeCompare(b));

          const uniqueProvinces = Array.from(
            new Set(
              rows
                .map((item) => item.province)
                .filter((value): value is string => Boolean(value))
            )
          ).sort((a, b) => a.localeCompare(b));

          setCategories(uniqueCategories);
          setProvinces(uniqueProvinces);
        }

        const hotspotData = (await fetchHotspots()) as HotspotQuestRow[] | null;
        if (hotspotData) {
          setQuestCandidates(mapQuestHotspots(hotspotData));
        }
      } catch (error) {
        console.error("Failed to load filters/quests:", error);
      }
    };

    void loadFiltersAndQuests();
  }, []);

  useEffect(() => {
    if (!questCandidates.length) {
      setNearbyQuests([]);
      return;
    }

    if (!navigator.geolocation) {
      setNearbyQuests([]);
      return;
    }

    let active = true;
    setQuestLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!active) return;

        const userPosition: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        const quests = buildNearbyQuests(questCandidates, userPosition, visitedIds);
        setNearbyQuests(quests);
        setQuestLoading(false);
      },
      () => {
        if (active) {
          setNearbyQuests([]);
          setQuestLoading(false);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 7000,
      }
    );

    return () => {
      active = false;
    };
  }, [questCandidates, visitedIds]);

  useEffect(() => {
    const loadUserHotspots = async () => {
      if (loading) {
        return;
      }

      if (!user) {
        setVisitedIds([]);
        setWishlistIds([]);
        setFavoriteIds([]);
        setVisitStreak(0);
        setVisitedToday(false);
        setUserDataLoaded(true);
        return;
      }

      setUserDataLoaded(false);

      try {
        const { data, error } = await supabase
          .from("user_hotspots")
          .select("hotspot_id, visited, wishlist, favorite")
          .eq("user_id", user.id);

        if (error || !data) {
          setUserDataLoaded(true);
          return;
        }

        const rows = data as UserHotspotRow[];

        setVisitedIds(
          rows.filter((row) => row.visited).map((row) => row.hotspot_id)
        );
        setWishlistIds(
          rows.filter((row) => row.wishlist).map((row) => row.hotspot_id)
        );
        setFavoriteIds(
          rows.filter((row) => row.favorite).map((row) => row.hotspot_id)
        );

        const stats = await fetchVisitStatsForUser(user.id);
        setVisitStreak(stats.streak);
        setVisitedToday(stats.visitedToday);
      } catch (error) {
        console.error("Error loading user hotspots:", error);
      } finally {
        setUserDataLoaded(true);
      }
    };

    void loadUserHotspots();
  }, [loading, user]);

  const handleVisit = useCallback(
    async (hotspotId: string) => {
      if (!user) {
        showToast("Login required.");
        return;
      }

      if (visitedIds.includes(hotspotId)) {
        return;
      }

      try {
        const unlockedBadges = await markVisited(user.id, hotspotId);

        setVisitedIds((prev) => [...prev, hotspotId]);

        const stats = await fetchVisitStatsForUser(user.id);
        setVisitStreak(stats.streak);
        setVisitedToday(stats.visitedToday);

        showToast("Visited hotspot. +50 XP earned.");

        if (unlockedBadges?.length) {
          setBadgeCelebration(true);
          showToast(`Badge unlocked: ${unlockedBadges[0].name}`);
        }

        const projectedCount = visitedIds.length + 1;

        if (projectedCount === 10) {
          showToast("Achievement unlocked: Explorer.");
        }

        if (projectedCount === 25) {
          showToast("Achievement unlocked: Adventurer.");
        }
      } catch (error) {
        console.error("Failed to mark visit:", error);
        showToast("Could not save visit.");
      }
    },
    [showToast, user, visitedIds]
  );

  const handleOpenQuest = useCallback(
    (hotspotId: string) => {
      const found = questCandidates.find((hotspot) => hotspot.id === hotspotId);
      if (!found) return;
      setSelected(found);
    },
    [questCandidates]
  );
  const selectedIndex = useMemo(() => {
    if (!selected) return -1;
    return questCandidates.findIndex((hotspot) => hotspot.id === selected.id);
  }, [questCandidates, selected]);

  const canNavigatePrevious = selectedIndex > 0;
  const canNavigateNext = selectedIndex >= 0 && selectedIndex < questCandidates.length - 1;

  const handleSelectPrevious = useCallback(() => {
    if (!canNavigatePrevious) return;
    setSelected(questCandidates[selectedIndex - 1]);
  }, [canNavigatePrevious, questCandidates, selectedIndex]);

  const handleSelectNext = useCallback(() => {
    if (!canNavigateNext) return;
    setSelected(questCandidates[selectedIndex + 1]);
  }, [canNavigateNext, questCandidates, selectedIndex]);

  useEffect(() => {
    if (!selected) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        handleSelectPrevious();
      }

      if (event.key === "ArrowRight") {
        handleSelectNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleSelectNext, handleSelectPrevious, selected]);

  if (loading) return null;

  if (user && !userDataLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-emerald-600 text-xl font-semibold">
          Loading your hotspots...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6">
      {/* Hero Section with 3D Globe */}
      <HeroSection hotspots={questCandidates} />

      {/* Quick Actions - Below Hero */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-3 items-center mt-4 md:mt-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
            Spotly
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Your adventures await</h1>
          <p className="text-sm text-slate-600 mt-1">
            Find hidden gems, must-sees, activities and food spots.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 ml-auto">
          <Link href="/trips" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium">
            Open Trips
          </Link>
          <Link href="/buddies" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium">
            Find Buddies
          </Link>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Spotly Plus</p>
          <p className="text-sm text-slate-700 mt-1">Unlock advanced trip insights, richer timeline tools and priority discovery alerts.</p>
        </div>
        <Link href="/pricing" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          View plans
        </Link>
      </section>

      <MissionDeck
        visitedCount={visitedIds.length}
        wishlistCount={wishlistIds.length}
        favoriteCount={favoriteIds.length}
        streak={visitStreak}
        visitedToday={visitedToday}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <LeaguePanel userId={user?.id ?? null} />
        <NearbyQuests
          quests={nearbyQuests}
          loading={questLoading}
          onOpenHotspot={handleOpenQuest}
        />
      </div>

      <div className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>

        <select
          value={provinceFilter}
          onChange={(e) => setProvinceFilter(e.target.value)}
          className="px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm"
        >
          <option value="">All provinces</option>
          {provinces.map((province) => (
            <option key={province}>{province}</option>
          ))}
        </select>

        <div className="flex-1" />

        <button
          onClick={() => {
            if (questCandidates.length === 0) return;
            const randomIndex = Math.floor(Math.random() * questCandidates.length);
            const random = questCandidates[randomIndex];
            setSelected(random);
            showToast(`Surprise! Discover: ${random.name}`);
          }}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
        >
          🎲 Surprise Me
        </button>

        <button
          onClick={() =>
            setViewMode((prev) => (prev === "markers" ? "heatmap" : "markers"))
          }
          className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm"
        >
          {viewMode === "markers" ? "Heatmap" : "Markers"}
        </button>

        <select
          value={mapStyle}
          onChange={(event) =>
            setMapStyle(event.target.value as "default" | "satellite" | "retro" | "terrain")
          }
          className="px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm text-sm"
        >
          <option value="default">Default</option>
          <option value="satellite">Satellite</option>
          <option value="retro">Retro</option>
          <option value="terrain">Terrain</option>
        </select>
      </div>

      <div className="h-[70vh] min-h-[32rem] md:h-[75vh] rounded-3xl overflow-hidden shadow-2xl border border-white/40">
        <MapContainer
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
          onToast={showToast}
        />
      </div>

      <HotspotPanel
        hotspot={selected}
        onClose={() => setSelected(null)}
        onVisit={handleVisit}
        onAddToTrip={handleAddToTrip}
        onWishlist={handleWishlist}
        onFavorite={handleFavorite}
        isVisited={visitedIds.includes(selected?.id ?? "")}
        isWishlist={wishlistIds.includes(selected?.id ?? "")}
        isFavorite={favoriteIds.includes(selected?.id ?? "")}
        canGoPrevious={canNavigatePrevious}
        canGoNext={canNavigateNext}
        onPrevious={handleSelectPrevious}
        onNext={handleSelectNext}
        positionLabel={selectedIndex >= 0 ? `Hotspot ${selectedIndex + 1} / ${questCandidates.length}` : "Hotspot"}
      />

      <HotspotSheet
        hotspot={selected}
        onClose={() => setSelected(null)}
        onVisit={handleVisit}
        onAddToTrip={handleAddToTrip}
        onWishlist={handleWishlist}
        onFavorite={handleFavorite}
        isVisited={visitedIds.includes(selected?.id ?? "")}
        isWishlist={wishlistIds.includes(selected?.id ?? "")}
        isFavorite={favoriteIds.includes(selected?.id ?? "")}
        canGoPrevious={canNavigatePrevious}
        canGoNext={canNavigateNext}
        onPrevious={handleSelectPrevious}
        onNext={handleSelectNext}
        positionLabel={selectedIndex >= 0 ? `Hotspot ${selectedIndex + 1} / ${questCandidates.length}` : "Hotspot"}
      />

      {toast && <Toast message={toast} />}

      <BadgeCelebration
        trigger={badgeCelebration}
        onComplete={() => setBadgeCelebration(false)}
      />
    </div>
  );
}


