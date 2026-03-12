"use client";

import { useRouter } from "next/navigation";
import { fetchHotspots } from "@/lib/services/hotspots";


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
import HeroDiscoverySection from "@/components/home/HeroDiscoverySection";
import CategoryExplorer from "@/components/home/DiscoveryChips";
import ExplorerProgressPanel from "@/components/home/ExplorerProgressPanel";
import MapPreviewSection from "@/components/home/MapPreviewSection";
import { fetchVisitStatsForUser } from "@/lib/services/engagement";

// Pre-login components
import PreLoginHero from "@/components/home/PreLoginHero";
import HowItWorks from "@/components/home/HowItWorks";
import PreLoginFooter from "@/components/home/PreLoginFooter";
import FeaturedHotspots from "@/components/home/FeaturedHotspots";

// New logged-in components - Premium Redesign
import StickyHeader from "@/components/home/StickyHeader";
import TrendingHotspots from "@/components/home/TrendingHotspots";

const MapContainer = dynamic(
  () =>
    import("@/components/Map/MapContainer").then(
      (mod) => mod.default as React.ComponentType<MapContainerProps>
    ),
  { ssr: false }
);

interface NearbyQuest {
  hotspot: Hotspot;
  distance: number;
}

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
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [tripsVersion, setTripsVersion] = useState(0);
  
  // User position for distance calculations
  const [userPosition, setUserPosition] = useState<[number, number] | undefined>(undefined);
  
  // Category filter for CategoryExplorer
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(""); 

  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Navigate to explore page with filter
    router.push(`/hotspots?category=${encodeURIComponent(category)}`);
  };

  // Stub missing functions
  const buildNearbyQuests = (
    hotspots: Hotspot[], 
    userPos: [number, number], 
    visitedIds: string[]
  ): NearbyQuest[] => {
    return []; // Stub: return empty for now
  };

  const addHotspotToQuickTrip = async (userId: string, hotspot: Hotspot) => {
    console.log('Stub: Added to quick trip:', hotspot.name);
  };

  const getTopHotspots = async (count: number) => {
    return questCandidates.slice(0, count).map(h => ({
      hotspot_id: h.id,
      hotspot_name: h.name,
      latitude: h.latitude,
      longitude: h.longitude,
      category: h.category,
      province: h.province,
      images: h.images || [],
      description: '',
      tags: [],
      saves_count: 0,
      views_count: 0,
      trip_visits_count: Math.floor(Math.random() * 100),
      visit_count: Math.floor(Math.random() * 100),
    }));
  };
  
  // Get user position on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        // User denied or unavailable - continue without position
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

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

  // Surprise Me handler
  const handleSurpriseMe = useCallback(() => {
    if (questCandidates.length === 0) return;
    const randomIndex = Math.floor(Math.random() * questCandidates.length);
    const random = questCandidates[randomIndex];
    setSelected(random);
    showToast(`Surprise! Discover: ${random.name}`);
  }, [questCandidates, showToast]);

  // State for ranked hotspots
  const [rankedHotspots, setRankedHotspots] = useState<Hotspot[]>([]);

  // Fetch ranked hotspots for FeaturedHotspots (pre-login)
  useEffect(() => {
    async function fetchRankedHotspots() {
      try {
        const rankings = await getTopHotspots(10);
        if (rankings && rankings.length > 0) {
          const converted: Hotspot[] = rankings.map((r) => ({
            id: r.hotspot_id,
            name: r.hotspot_name,
            latitude: r.latitude,
            longitude: r.longitude,
            category: r.category,
            province: r.province,
            description: r.description || '',
            images: r.images || [],
            tags: r.tags || [],
            saves_count: r.saves_count,
            views_count: r.views_count,
            visit_count: r.trip_visits_count,
          }));
          setRankedHotspots(converted);
        }
      } catch (error) {
        console.warn('Ranking not available yet:', error);
      }
    }

    if (!user) {
      fetchRankedHotspots();
    }
  }, [user]);

  // Render pre-login homepage
  const renderPreLoginHomepage = () => (
    <div className="flex flex-col min-h-screen">
      <PreLoginHero hotspotCount={questCandidates.length} explorerCount={12000} />
      <HowItWorks />
      <FeaturedHotspots 
        hotspots={rankedHotspots.length > 0 ? rankedHotspots : questCandidates.slice(0, 10)} 
        wishlistIds={[]}
      />
      <PreLoginFooter />

    </div>
  );

  // Render logged-in homepage - PREMIUM DISCOVERY-FIRST STRUCTURE
  const renderLoggedInHomepage = () => (
    <div className="flex flex-col min-h-screen">
      {/* Using SidebarLayout header only (no duplicate) */}
      
      {/* Main Content - Discovery First */}
      <main className="flex-1 pt-0">

        <HeroDiscoverySection 
          hotspots={questCandidates}
          user={user}
          onSurpriseMe={handleSurpriseMe}
        />
        
        <TrendingHotspots
          hotspots={questCandidates.slice(0, 8)}
          wishlistIds={wishlistIds}
          visitedIds={visitedIds}
          onWishlistToggle={handleWishlist}
          loading={!userDataLoaded}
          selectedCategory={selectedCategory}
        />

        <div className="max-w-4xl mx-auto px-4 py-4">
          <CategoryExplorer 
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        <FeaturedHotspots 
          hotspots={questCandidates.slice(0, 8)}
          wishlistIds={wishlistIds}
          onWishlistToggle={handleWishlist}
          selectedCategory={selectedCategory}
        /> 

        <MapPreviewSection
          hotspots={questCandidates.filter(h => !selectedCategory || h.category === selectedCategory)}
          visitedIds={visitedIds}
          wishlistIds={wishlistIds}
          favoriteIds={favoriteIds}
          selectedCategory={selectedCategory}
          onSelect={setSelected}
          onVisit={handleVisit}
          onToast={showToast}
        /> 

        <div className="max-w-4xl mx-auto px-4 py-8">
          <ExplorerProgressPanel
            visitedCount={visitedIds.length}
            wishlistCount={wishlistIds.length}
            streak={visitStreak}
          />
        </div>
      </main>


      {/* Hotspot Panel/Drawer */}
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
        showTripSelector={showTripSelector}
        onShowTripSelector={setShowTripSelector}
        onTripUpdated={() => setTripsVersion((v) => v + 1)}
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
        showTripSelector={showTripSelector}
        onShowTripSelector={setShowTripSelector}
        onTripUpdated={() => setTripsVersion((v) => v + 1)}
      />

      {toast && <Toast message={toast} />}

      <BadgeCelebration
        trigger={badgeCelebration}
        onComplete={() => setBadgeCelebration(false)}
      />
    </div>
  );

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

  // Conditional rendering based on auth status
  if (!user) {
    return renderPreLoginHomepage();
  }

  return renderLoggedInHomepage();
}

