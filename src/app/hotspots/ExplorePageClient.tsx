"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from "react";
import {FunnelPlus, MapPinPlus, Map} from "lucide-react"
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
import {
  ExploreHotspot,
  PopularTrip,
  fetchExploreHotspots,
  fetchPopularTrips,
} from "@/lib/services/explore";
import {
  toggleTripLike,
  toggleTripSave
} from "@/lib/services/tripBuilder";
import {
  toggleHotspotLike,
  toggleHotspotSave
} from "@/lib/services/hotspotSocial";
import { queryKeys } from '@/lib/react-query/queryKeys';

import { fetchInfluencerMentions, InfluencerMention } from "@/lib/services/influencers";
import { supabase } from "@/lib/Supabase/browser-client";
import { createSignedMediaUrl } from "@/lib/services/media";
import { toggleWishlist, toggleFavorite } from "@/lib/services/gamification";
import { Hotspot } from "@/types/hotspot";
import HotspotPanel from "@/components/HotspotPanel";
import AddHotspotModal from "@/components/MyHotspots/AddHotspotModal";
import { AnimatedGlassButton } from "@/components/ui/glass-button-hover";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import HotspotCard from "@/components/ui/HotspotCard";
import toast from "@/components/Toast"
import { useToast } from "@/context/ToastContext";
import { verifyVisitWithCurrentLocation } from "@/lib/services/visitVerification";

const MapContainer = dynamic(
  () => import("@/components/Map/MapContainer"),
  {
    ssr: false,
    loading: () => <div className="h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-emerald-600 font-semibold">Loading interactive map...</div>
    </div>
  }
);

function hasCoordinates(
  hotspot: ExploreHotspot
): hotspot is ExploreHotspot & { latitude: number; longitude: number } {
  return typeof hotspot.latitude === "number" && typeof hotspot.longitude === "number";
}

function mapExploreToHotspot(
  hotspot: ExploreHotspot & { latitude: number; longitude: number }
): Hotspot {
  return {
    id: hotspot.id,
    name: hotspot.name,
    latitude: hotspot.latitude,
    longitude: hotspot.longitude,
    lat: hotspot.latitude,
    lng: hotspot.longitude,
    category: hotspot.category,
    province: hotspot.province,
    description: hotspot.description,
    images: hotspot.imageUrl ? [hotspot.imageUrl] : undefined,
    visit_count: hotspot.visitCount,
    likes_count: hotspot.likesCount,
    saves_count: hotspot.savesCount,
  };
}

function findAdjacentHotspot(
  hotspots: ExploreHotspot[],
  startIndex: number,
  direction: 1 | -1
): (ExploreHotspot & { latitude: number; longitude: number }) | null {
  for (let i = startIndex + direction; i >= 0 && i < hotspots.length; i += direction) {
    const candidate = hotspots[i];
    if (hasCoordinates(candidate)) {
      return candidate;
    }
  }

  return null;
}

type ExploreSortMode = "popular" | "reviews" | "rating";

export default function ExplorePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const addToast = useToast();

  const queryClient = useQueryClient();

  // Base queries without filters for initial data
  const baseHotspotsQuery = useQuery({
    queryKey: queryKeys.allHotspots(),
    queryFn: () => fetchExploreHotspots(user?.id ?? null),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  // Query data
  const tripsQuery = useQuery({
    queryKey: queryKeys.popularTrips(user?.id),
    queryFn: () => fetchPopularTrips(5, user?.id ?? null),
  });

  const mentionsQuery = useQuery({
    queryKey: queryKeys.mentions(),
    queryFn: () => fetchInfluencerMentions(5),
  });

  const rawHotspots = baseHotspotsQuery.data ?? [];
  // Extract raw tripsData safely
  const tripsData = tripsQuery.data ?? { trips: [], warning: '' };
  const mentionsData = mentionsQuery.data ?? [];

  const mentions = mentionsData;
  const trips = tripsData.trips ?? [];
  const tripsWarning = tripsData.warning ?? '';

  const loading = baseHotspotsQuery.isLoading || tripsQuery.isLoading || mentionsQuery.isLoading;
  const errorMessage = baseHotspotsQuery.error ? (baseHotspotsQuery.error as Error).message : '';
  const hotspots = rawHotspots;
  const [tripCoverUrls, setTripCoverUrls] = useState<Record<string, string>>({});
  const { searchQuery, setSearchQuery } = useSearch();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [sortMode, setSortMode] = useState<ExploreSortMode>("popular");
  const [showAllHotspots, setShowAllHotspots] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [mapFocusId, setMapFocusId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [Toast, setToast] = useState<string | null>(null);

  // Removed loadExplore - React Query handles fetching


  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (!categoryParam) return;

    setCategoryFilter((prev) => (prev ? prev : categoryParam));
  }, [searchParams]);

  const categories = useMemo(
    () =>
      Array.from(new Set(hotspots.map((hotspot) => hotspot.category))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [hotspots]
  );

  const provinces = useMemo(
    () =>
      Array.from(new Set(hotspots.map((hotspot) => hotspot.province))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [hotspots]
  );

  const filteredHotspots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const output = hotspots.filter((hotspot) => {
      if (categoryFilter && hotspot.category !== categoryFilter) return false;
      if (provinceFilter && hotspot.province !== provinceFilter) return false;

      if (!query) return true;

      return (
        hotspot.name.toLowerCase().includes(query) ||
        hotspot.category.toLowerCase().includes(query) ||
        hotspot.province.toLowerCase().includes(query)
      );
    });

    output.sort((a, b) => {
      if (sortMode === "reviews") {
        return b.reviewCount - a.reviewCount || b.visitCount - a.visitCount;
      }

      if (sortMode === "rating") {
        return b.averageRating - a.averageRating || b.reviewCount - a.reviewCount;
      }

      const scoreA = a.visitCount + a.reviewCount * 2 + a.averageRating * 5;
      const scoreB = b.visitCount + b.reviewCount * 2 + b.averageRating * 5;

      return scoreB - scoreA;
    });

    return output;
  }, [categoryFilter, hotspots, provinceFilter, searchQuery, sortMode]);

  const canShowAllHotspots = filteredHotspots.length > 5;

  const visibleHotspots = useMemo(
    () => (showAllHotspots ? filteredHotspots : filteredHotspots.slice(0, 5)),
    [filteredHotspots, showAllHotspots]
  );

  const visitedIds = useMemo(
    () => filteredHotspots.filter((hotspot) => hotspot.visited).map((hotspot) => hotspot.id),
    [filteredHotspots]
  );

  const wishlistIds = useMemo(
    () => filteredHotspots.filter((hotspot) => hotspot.wishlist).map((hotspot) => hotspot.id),
    [filteredHotspots]
  );

  const favoriteIds = useMemo(
    () => filteredHotspots.filter((hotspot) => hotspot.favorite).map((hotspot) => hotspot.id),
    [filteredHotspots]
  );

  const mapHotspots = useMemo(
    () => filteredHotspots.filter(hasCoordinates).map(mapExploreToHotspot),
    [filteredHotspots]
  );

  const selectedMeta = useMemo(() => {
    if (!selectedHotspot) return null;
    return hotspots.find((hotspot) => hotspot.id === selectedHotspot.id) ?? null;
  }, [hotspots, selectedHotspot]);

  useEffect(() => {
    if (selectedHotspot && !filteredHotspots.find((hotspot) => hotspot.id === selectedHotspot.id)) {
      setSelectedHotspot(null);
    }
  }, [filteredHotspots, selectedHotspot]);

  useEffect(() => {
    if (mapFocusId && !filteredHotspots.find((hotspot) => hotspot.id === mapFocusId)) {
      setMapFocusId(null);
    }
  }, [filteredHotspots, mapFocusId]);

// Use signed URLs instead of public (bucket not public)
  useEffect(() => {
    const loadTripCovers = async () => {
      console.log('Loading signed URLs for trips');
      const newUrls: Record<string, string> = {};
      for (const trip of trips) {
        if (trip.coverImage?.startsWith('http')) {
          newUrls[trip.id] = trip.coverImage;
          continue;
        }
        const signedUrl = await createSignedMediaUrl(trip.coverImage);
        console.log(`Signed for ${trip.id}:`, signedUrl);
        newUrls[trip.id] = signedUrl || 'https://images.unsplash.com/photo-1527631746610-bca00a040d60';
      }
      setTripCoverUrls(newUrls);
    };

    if (trips.length > 0) {
      loadTripCovers();
    }
  }, [trips]);

  const handleMapSelect = useCallback((hotspot: Hotspot) => {
    setSelectedHotspot(hotspot);
    setMapFocusId(null);
  }, []);

  const handleNextHotspot = useCallback(() => {
    if (!selectedHotspot) return;

    const currentIndex = filteredHotspots.findIndex(
      (hotspot) => hotspot.id === selectedHotspot.id
    );

    if (currentIndex < 0) return;

    const nextHotspot = findAdjacentHotspot(filteredHotspots, currentIndex, 1);
    if (!nextHotspot) return;

    setSelectedHotspot(mapExploreToHotspot(nextHotspot));
    setMapFocusId(null);
  }, [filteredHotspots, selectedHotspot]);

  const handlePreviousHotspot = useCallback(() => {
    if (!selectedHotspot) return;

    const currentIndex = filteredHotspots.findIndex(
      (hotspot) => hotspot.id === selectedHotspot.id
    );

    if (currentIndex < 0) return;

    const prevHotspot = findAdjacentHotspot(filteredHotspots, currentIndex, -1);
    if (!prevHotspot) return;

    setSelectedHotspot(mapExploreToHotspot(prevHotspot));
    setMapFocusId(null);
  }, [filteredHotspots, selectedHotspot]);

  const navigationState = useMemo(() => {
    if (!selectedHotspot) {
      return { canGoPrevious: false, canGoNext: false, positionLabel: "" };
    }

    const currentIndex = filteredHotspots.findIndex(
      (hotspot) => hotspot.id === selectedHotspot.id
    );

    if (currentIndex < 0) {
      return { canGoPrevious: false, canGoNext: false, positionLabel: "" };
    }

    const canGoPrevious = !!findAdjacentHotspot(filteredHotspots, currentIndex, -1);
    const canGoNext = !!findAdjacentHotspot(filteredHotspots, currentIndex, 1);

    return {
      canGoPrevious,
      canGoNext,
      positionLabel: `${currentIndex + 1} / ${filteredHotspots.length}`,
    };
  }, [filteredHotspots, selectedHotspot]);

  const toggleWishlistInUi = useCallback(
    async (hotspotId: string) => {
      if (!user?.id) {
        addToast("Login required.");
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.allHotspots() });
      try {
        const next = await toggleWishlist(user.id, hotspotId);
        addToast(next ? "Added to wishlist" : "Removed from wishlist");
      } catch (error) {
        console.error("Wishlist toggle failed:", error);
        addToast("Could not update wishlist.");
      }
    },
    [user?.id, queryClient]
  );

  const toggleFavoriteInUi = useCallback(
    async (hotspotId: string) => {
      if (!user?.id) {
        addToast("Login required.");
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.allHotspots() });
      try {
        const next = await toggleFavorite(user.id, hotspotId);
        addToast(next ? "Added to favorites" : "Removed from favorites");
      } catch (error) {
        console.error("Favorite toggle failed:", error);
        addToast("Could not update favorites.");
      }
    },
    [user?.id, queryClient]
  );

  const handleVisit = useCallback(
    async (hotspotId: string) => {
      if (!user?.id) {
        addToast("Login required.");
        return;
      }

      const alreadyVisited = hotspots.find((hotspot) => hotspot.id === hotspotId)?.visited;
      if (alreadyVisited) {
        addToast("Already marked as visited.");
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.allHotspots() });
      try {
        const verification = await verifyVisitWithCurrentLocation(user.id, hotspotId);

        if (verification.reason === 'location_unavailable') {
          addToast("Enable location services to verify GPS");
          return;
        }

        if (verification.reason === 'poor_accuracy') {
          addToast("Poor GPS accuracy. Wait for better signal (<=50m)");
          return;
        }

        if (!verification.success) {
          addToast("Could not verify visit.");
          return;
        }

        if (verification.status === 'failed') {
          addToast(`Too far: ${verification.distance_meters.toFixed(0)}m (need <=100m)`);
          return;
        }

        addToast(`Visit verified at ${verification.distance_meters.toFixed(0)}m.`);
      } catch (error) {
        console.error("Visit update failed:", error);
        addToast("Could not mark visited.");
      }
    },
    [hotspots, user?.id, queryClient]
  );
const toggleTripLikeInUi = useCallback(async (item: PopularTrip) => {
  if (!user?.id) {
    addToast("Login required");
    return;
  }
  try {
    const next = await toggleTripLike({ tripId: item.id, userId: user.id, tripTitle: item.title });
    queryClient.invalidateQueries({ queryKey: queryKeys.popularTrips(user.id) });
    addToast(next ? "Liked" : "Unliked");
  } catch (error) {
    console.error("Toggle like failed:", error);
    addToast("Like failed");
  }
}, [user?.id, queryClient]);

const toggleTripSaveInUi = useCallback(async (item: PopularTrip) => {
  if (!user?.id) {
    addToast("Login required");
    return;
  }
  try {
    const next = await toggleTripSave({ tripId: item.id, userId: user.id, tripTitle: item.title });
    queryClient.invalidateQueries({ queryKey: queryKeys.popularTrips(user.id) });
    addToast(next ? "Saved" : "Unsaved");
  } catch (error) {
    console.error("Toggle save failed:", error);
    addToast("Save failed");
  }
}, [user?.id, queryClient]);

const toggleHotspotLikeInUi = useCallback(async (hotspot: ExploreHotspot) => {
  if (!user?.id) {
    addToast("Login required");
    return;
  }
  try {
    const next = await toggleHotspotLike({ 
      userId: user.id, 
      hotspotId: hotspot.id, 
      hotspotName: hotspot.name 
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.allHotspots() });
    addToast(next ? "Liked" : "Unliked");
  } catch (error) {
    console.error("Toggle hotspot like failed:", error);
    addToast("Like failed");
  }
}, [user?.id, queryClient]);

const toggleHotspotSaveInUi = useCallback(async (hotspot: ExploreHotspot) => {
  if (!user?.id) {
    addToast("Login required");
    return;
  }
  try {
    const next = await toggleHotspotSave({ 
      userId: user.id, 
      hotspotId: hotspot.id, 
      hotspotName: hotspot.name 
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.allHotspots() });
    addToast(next ? "Saved" : "Unsaved");
  } catch (error) {
    console.error("Toggle hotspot save failed:", error);
    addToast("Save failed");
  }
}, [user?.id, queryClient]);




  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Explore</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Discover Hotspots and Community Trips</h1>
        <p className="mt-2 text-sm text-slate-600">
          Browse all hotspots, check visits and reviews at a glance, and discover popular trips shared by users.
        </p>

        <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
          <Link
            href="/pricing"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Upgrade to Spotly Plus
          </Link>
        <div className="flex justify-center gap-4">
   
          <AnimatedGlassButton
            size="sm"
            icon= {<MapPinPlus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-all duration-500"/>}
            label="Add Hotspot"
            contentClassName="text-slate-600 font-bold"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Hotspot
          </AnimatedGlassButton>

          <AnimatedGlassButton
            size="sm"
            icon={<FunnelPlus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-all duration-500"/>}
            label="Show Filters"
            contentClassName="text-slate-600 font-bold"
            onClick={() => setShowFilters(prev => !prev)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </AnimatedGlassButton>
        </div>

        {/* Animated filter panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            showFilters ? "max-h-[1000px] opacity-100 mt-3" : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, category or province"
              className="rounded-xl border border-slate-200 px-3 py-2"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={provinceFilter}
              onChange={(event) => setProvinceFilter(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="">All provinces</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as ExploreSortMode)}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="popular">Most popular</option>
              <option value="reviews">Most reviewed</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>
        </div>
        </div>
      </section>

      
      {/* Interactive Map Section */}
      <section className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
        <div className="h-[400px] md:h-[500px]">
          <MapContainer
            viewMode="markers"
            mapStyle="default"
            preventZoom={false}
            hotspots={mapHotspots}
            selectedHotspotId={selectedHotspot?.id ?? mapFocusId ?? null}
            visitedIds={visitedIds}
            wishlistIds={wishlistIds}
            favoriteIds={favoriteIds}
            loading={loading}
            onSelect={handleMapSelect}
            onToast={addToast}
          />
        </div>
      </section>

      <HotspotPanel
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        onVisit={handleVisit}
        onWishlist={toggleWishlistInUi}
        onFavorite={toggleFavoriteInUi}
        onLike={(id) => toggleHotspotLikeInUi(hotspots.find(h => h.id === id)!)}
        onSave={(id) => toggleHotspotSaveInUi(hotspots.find(h => h.id === id)!)}
        onAddToTrip={() => setShowTripSelector(true)}
        isVisited={selectedMeta?.visited ?? false}
        isLiked={selectedMeta?.likedByMe ?? false}
        isSaved={selectedMeta?.savedByMe ?? false}
        isWishlist={selectedMeta?.wishlist ?? false}
        isFavorite={selectedMeta?.favorite ?? false}
        canGoPrevious={navigationState.canGoPrevious}
        canGoNext={navigationState.canGoNext}
        onPrevious={handlePreviousHotspot}
        onNext={handleNextHotspot}
        positionLabel={navigationState.positionLabel}
        showTripSelector={showTripSelector}
        onShowTripSelector={setShowTripSelector}
        onTripUpdated={() => addToast("Trip updated.")}
      />

      {Toast && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          {Toast}
        </p>
      )}

      {loading && <p className="text-sm text-slate-600">Loading explore feed...</p>}

      {errorMessage && !loading && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {!loading && !errorMessage && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                All hotspots ({filteredHotspots.length})
              </h2>
              <p className="text-xs text-slate-500">Browse the full community collection.</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {canShowAllHotspots && (
                <button
                  type="button"
                  onClick={() => setShowAllHotspots(prev => !prev)}
                  className="font-medium text-emerald-700"
                >
                  {showAllHotspots ? "Show less" : "Show all"}
                </button>
              )}
              <Link href="/hotspots/my" className="font-medium text-emerald-700">
                Go to My Hotspots
              </Link>
            </div>
          </div>

          {filteredHotspots.length === 0 && (
            <p className="text-sm text-slate-600">No hotspots found for this filter set.</p>
          )}


              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {visibleHotspots.map((hotspot) => (
                    <HotspotCard
                    key={hotspot.id}
                    hotspot={{
                      id: hotspot.id,
                      name: hotspot.name,
                      description: hotspot.description,
                      category: hotspot.category,
                      province: hotspot.province,
                      latitude: hotspot.latitude ?? undefined,
                      longitude: hotspot.longitude ?? undefined,
                      imageUrl: hotspot.imageUrl,
                      visitCount: hotspot.visitCount,
                      likesCount: hotspot.likesCount,
                      savesCount: hotspot.savesCount,
                      viewsCount: hotspot.viewsCount,
                      visited: hotspot.visited,
                      wishlist: hotspot.wishlist,
                      favorite: hotspot.favorite,
                      likedByMe: hotspot.likedByMe,
                      savedByMe: hotspot.savedByMe,
                    }}
                    onVisit={(h) => handleVisit(h.id)}
                    onLike={(h) => toggleHotspotLikeInUi(h as any)}
                    onSave={(h) => toggleHotspotSaveInUi(h as any)}
                    onWishlist={toggleWishlistInUi}
                    onFavorite={toggleFavoriteInUi}
                    onMap={(id) => {
                      const selected = hotspots.find(h => h.id === id);
                      if (!selected || !hasCoordinates(selected)) {
                        addToast("This hotspot has no coordinates yet.");
                        return;
                      }
                      setMapFocusId(id);
                      setSelectedHotspot(null);
                    }}
                  />
                ))}
              
            
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Popular Community Trips</h2>
          <Link href="/trips" className="text-sm font-medium text-emerald-700">
            Open trip builder
          </Link>
        </div>

        {tripsQuery.isLoading && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-slate-200 to-slate-300" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-slate-300 rounded w-3/4" />
                  <div className="h-3 bg-slate-300 rounded w-1/2" />
                  <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-12 bg-slate-200 rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tripsWarning && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0">⚠️</div>
              <div>
                <p className="font-semibold text-amber-900">{tripsWarning}</p>
                <p className="text-sm text-amber-800 mt-1">Try creating your first public trip!</p>
              </div>
            </div>
          </div>
        )}

        {!tripsWarning && trips.length === 0 && !tripsQuery.isLoading && (
          <div className="text-center py-12 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No public trips yet</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">Be the first to share your adventure! Community trips will appear here.</p>
            <Link 
              href="/trips" 
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
            >
              Create Your First Trip
            </Link>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trips.map((trip, index) => (
            <article key={trip.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-24">
                <Link href={`/trip/${trip.id}`} className="block h-full">
                  <Image
src={tripCoverUrls[trip.id] || trip.coverImage || "https://images.unsplash.com/photo-1527631746610-bca00a040d60"}
                    alt={trip.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    priority={index < 4}
                  />
                </Link>
              </div>

              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{trip.title}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    Score {trip.score}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  By{' '}
                  <Link href={`/profile/${trip.authorId}`} className="font-semibold text-emerald-700">
                    {trip.authorName}
                  </Link>
                </p>
                <p className="line-clamp-2 text-xs text-slate-700">{trip.description || "No description."}</p>

                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  <div className="rounded-lg border border-slate-200 p-1.5">
                    <p className="text-slate-500">Stops</p>
                    <p className="font-semibold text-slate-900">{trip.stopCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-1.5">
                    <p className="text-slate-500">Likes</p>
                    <p className="font-semibold text-slate-900">{trip.likesCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-1.5">
                    <p className="text-slate-500">Saves</p>
                    <p className="font-semibold text-slate-900">{trip.savesCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-1.5">
                    <p className="text-slate-500">Views</p>
                    <p className="font-semibold text-slate-900">{trip.viewsCount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (!user) return;
                      toggleTripLikeInUi(trip);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      trip.likedByMe ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {trip.likedByMe ? "Liked" : "Like"}
                  </button>
                  <button
                    onClick={() => {
                      if (!user) return;
                      toggleTripSaveInUi(trip);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      trip.savedByMe ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {trip.savedByMe ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">What influencers are saying</h2>
          <span className="text-xs text-slate-500">Auto-ranked by recency and sentiment</span>
        </div>

        {mentions.length === 0 && (
          <p className="text-sm text-slate-600">
            No social mentions yet. Start ingesting entries in the `influencer_mentions` table.
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {mentions.map((mention) => (
            <article key={mention.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{mention.source}</span>
                <span>{new Date(mention.createdAt).toLocaleDateString("nl-BE")}</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">@{mention.authorHandle}</p>
              <p className="text-sm text-slate-700 line-clamp-3">{mention.content}</p>
              <a
                href={mention.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-xs font-semibold text-emerald-700"
              >
                Open source post
              </a>
            </article>
          ))}
        </div>
      </section>

      <AddHotspotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={() => {
          setIsAddModalOpen(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.allHotspots() });
        }}
      />
    </div>
  );
}









