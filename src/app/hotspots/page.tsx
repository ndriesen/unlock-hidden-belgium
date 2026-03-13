"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import {
  ExploreHotspot,
  PopularTrip,
  fetchExploreHotspots,
  fetchPopularTrips,
} from "@/lib/services/explore";
import { toggleTripLike, toggleTripSave } from "@/lib/services/tripBuilder";
import { fetchInfluencerMentions, InfluencerMention } from "@/lib/services/influencers";
import { toggleWishlist, toggleFavorite } from "@/lib/services/gamification";
import { Hotspot } from "@/types/hotspot";
import HotspotPanel from "@/components/HotspotPanel";
import AddHotspotModal from "@/components/MyHotspots/AddHotspotModal";

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
        preventZoom?: boolean;
        hotspots?: Hotspot[];
        selectedHotspotId?: string | null;
        loading?: boolean;
        onSelect?: (hotspot: Hotspot) => void;
        onVisit?: (hotspotId: string) => void;
        onToast?: (message: string) => void;
      }>
    ),
  { ssr: false }
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

  const [hotspots, setHotspots] = useState<ExploreHotspot[]>([]);
  const [trips, setTrips] = useState<PopularTrip[]>([]);
  const [mentions, setMentions] = useState<InfluencerMention[]>([]);
  const [tripsWarning, setTripsWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [sortMode, setSortMode] = useState<ExploreSortMode>("popular");

  const [actionMessage, setActionMessage] = useState("");
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [mapFocusId, setMapFocusId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadExplore = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [hotspotData, tripData, mentionData] = await Promise.all([
        fetchExploreHotspots(user?.id ?? null),
        fetchPopularTrips(6, user?.id ?? null),
        fetchInfluencerMentions(6),
      ]);

      setHotspots(hotspotData);
      setTrips(tripData.trips);
      setTripsWarning(tripData.warning);
      setMentions(mentionData);
    } catch (error) {
      setErrorMessage("Could not load explore data right now.");
      console.error("Explore load error:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadExplore();
  }, [loadExplore]);

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
        setActionMessage("Login required.");
        return;
      }

      try {
        const next = await toggleWishlist(user.id, hotspotId);

        setHotspots((prev) =>
          prev.map((hotspot) =>
            hotspot.id === hotspotId ? { ...hotspot, wishlist: next } : hotspot
          )
        );
      } catch (error) {
        console.error("Wishlist toggle failed:", error);
        setActionMessage("Could not update wishlist.");
      }
    },
    [user?.id]
  );

  const toggleFavoriteInUi = useCallback(
    async (hotspotId: string) => {
      if (!user?.id) {
        setActionMessage("Login required.");
        return;
      }

      try {
        const next = await toggleFavorite(user.id, hotspotId);

        setHotspots((prev) =>
          prev.map((hotspot) =>
            hotspot.id === hotspotId ? { ...hotspot, favorite: next } : hotspot
          )
        );
      } catch (error) {
        console.error("Favorite toggle failed:", error);
        setActionMessage("Could not update favorites.");
      }
    },
    [user?.id]
  );

  const toggleTripLikeInUi = async (item: PopularTrip) => {
    if (!user?.id) {
      setActionMessage("Login required.");
      return;
    }

    const next = await toggleTripLike({ userId: user.id, tripId: item.id, tripTitle: item.title });
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === item.id
          ? { ...trip, likedByMe: next, likesCount: Math.max(trip.likesCount + (next ? 1 : -1), 0) }
          : trip
      )
    );
  };

  const toggleTripSaveInUi = async (item: PopularTrip) => {
    if (!user?.id) {
      setActionMessage("Login required.");
      return;
    }

    const next = await toggleTripSave({ userId: user.id, tripId: item.id, tripTitle: item.title });
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === item.id
          ? { ...trip, savedByMe: next, savesCount: Math.max(trip.savesCount + (next ? 1 : -1), 0) }
          : trip
      )
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Explore</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Discover Hotspots and Community Trips</h1>
        <p className="mt-2 text-sm text-slate-600">
          Browse all hotspots, check visits and reviews at a glance, and discover popular trips shared by users.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/pricing"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Upgrade to Spotly Plus
          </Link>
          <Link
            href="/activity"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800"
          >
            Open Activity
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          + Add Hotspot
        </button>
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
            visitedIds={[]}
            wishlistIds={[]}
            favoriteIds={[]}
            loading={loading}
            onSelect={handleMapSelect}
            onToast={setActionMessage}
          />
        </div>
      </section>

      <HotspotPanel
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        onVisit={() => {}}
        onWishlist={toggleWishlistInUi}
        onFavorite={toggleFavoriteInUi}
        onAddToTrip={() => {}}
        isVisited={false}
        isWishlist={selectedMeta?.wishlist ?? false}
        isFavorite={selectedMeta?.favorite ?? false}
        canGoPrevious={navigationState.canGoPrevious}
        canGoNext={navigationState.canGoNext}
        onPrevious={handlePreviousHotspot}
        onNext={handleNextHotspot}
        positionLabel={navigationState.positionLabel}
      />

      {actionMessage && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          {actionMessage}
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Hotspots ({filteredHotspots.length})</h2>
            <Link href="/hotspots/my" className="text-sm font-medium text-emerald-700">
              Go to My Hotspots
            </Link>
          </div>

          {filteredHotspots.length === 0 && (
            <p className="text-sm text-slate-600">No hotspots found for this filter set.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredHotspots.map((hotspot, index) => (
              <article
                key={hotspot.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative h-44 w-full">
                  <Image
                    src={hotspot.imageUrl}
                    alt={hotspot.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    priority={index < 6}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="font-semibold text-white">{hotspot.name}</p>
                    <p className="text-xs text-white/85">
                      {hotspot.category} - {hotspot.province}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-3">
                  <p className="line-clamp-2 text-sm text-slate-700">{hotspot.description}</p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg border border-slate-200 p-2">
                      <p className="text-slate-500">Visits</p>
                      <p className="font-semibold text-slate-900">{hotspot.visitCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <p className="text-slate-500">Reviews</p>
                      <p className="font-semibold text-slate-900">{hotspot.reviewCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2">
                      <p className="text-slate-500">Rating</p>
                      <p className="font-semibold text-slate-900">{hotspot.averageRating.toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {hotspot.visited && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Visited</span>
                    )}
                    {hotspot.wishlist && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Wishlist</span>
                    )}
                    {hotspot.favorite && (
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">Favorite</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        void toggleWishlistInUi(hotspot.id);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        hotspot.wishlist ? "bg-amber-100 text-amber-700" : "border border-slate-200 text-slate-700"
                      }`}
                    >
                      {hotspot.wishlist ? "Wishlisted" : "Wishlist"}
                    </button>
                    <button
                      onClick={() => {
                        void toggleFavoriteInUi(hotspot.id);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        hotspot.favorite ? "bg-rose-100 text-rose-700" : "border border-slate-200 text-slate-700"
                      }`}
                    >
                      {hotspot.favorite ? "Favorited" : "Favorite"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/hotspots/${hotspot.id}`}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-800"
                    >
                      Open details
                    </Link>
                    <button
                      onClick={() => {
                        if (!hasCoordinates(hotspot)) {
                          setActionMessage("This hotspot has no coordinates yet.");
                          return;
                        }
                        setMapFocusId(hotspot.id);
                        setSelectedHotspot(null);
                      }}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                    >
                      Open map
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Popular user trips</h2>
          <Link href="/trips" className="text-sm font-medium text-emerald-700">
            Open trip builder
          </Link>
        </div>

        {tripsWarning && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {tripsWarning}
          </p>
        )}

        {!tripsWarning && trips.length === 0 && (
          <p className="text-sm text-slate-600">No public trips yet.</p>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip, index) => (
            <article key={trip.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  #{index + 1} {trip.title}
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                  Score {trip.score}
                </span>
              </div>

              <p className="text-xs text-slate-600">By {trip.authorName}</p>
              <p className="line-clamp-2 text-sm text-slate-700">{trip.description || "No description."}</p>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
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
                    void toggleTripLikeInUi(trip);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    trip.likedByMe ? "bg-rose-100 text-rose-700" : "border border-slate-200 text-slate-700"
                  }`}
                >
                  {trip.likedByMe ? "Liked" : "Like"}
                </button>
                <button
                  onClick={() => {
                    void toggleTripSaveInUi(trip);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    trip.savedByMe ? "bg-amber-100 text-amber-700" : "border border-slate-200 text-slate-700"
                  }`}
                >
                  {trip.savedByMe ? "Saved" : "Save"}
                </button>
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
          void loadExplore();
        }}
      />
    </div>
  );
}
