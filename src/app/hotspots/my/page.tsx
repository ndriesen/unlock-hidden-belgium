"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";

import { fetchMyHotspots, MyHotspotEntry } from "@/lib/services/myHotspots";
import { toggleFavorite } from "@/lib/services/gamification";
import { Hotspot } from "@/types/hotspot";
import AddHotspotModal from "@/components/MyHotspots/AddHotspotModal";
import HotspotPanel from "@/components/HotspotPanel";
const MapContainer = dynamic(
  () => import("@/components/Map/MapContainer").then((mod) => mod.default),
  { ssr: false }
);




type StatusFilter = "all" | "visited" | "wishlist" | "favorite";

const MapView = dynamic(() => import("@/components/Map/MapView"), {
  ssr: false,
}) as React.ComponentType<{
  hotspots: Hotspot[];
  loading: boolean;
  visitedIds?: string[];
  wishlistIds?: string[];
  favoriteIds?: string[];
  viewMode: "markers" | "heatmap";
  mapStyle: "default" | "satellite" | "retro" | "terrain";
  onSelect?: (hotspot: Hotspot) => void;
}>;

function parseStatusFilter(value: string | null): StatusFilter {
  if (value === "visited" || value === "wishlist" || value === "favorite") {
    return value;
  }

  return "all";
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "medium",
  }).format(date);
}

export default function MyHotspotsPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useState<MyHotspotEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { searchQuery, setSearchQuery } = useSearch();
  const [provinceFilter, setProvinceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showMap, setShowMap] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState<"default" | "satellite" | "retro" | "terrain">("default");
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);


  useEffect(() => {
    const timer = setTimeout(() => {
      const filter = parseStatusFilter(
        new URLSearchParams(window.location.search).get("filter")
      );
      setStatusFilter(filter);
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) {
        setEntries([]);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const data = await fetchMyHotspots(user.id);
        if (active) {
          setEntries(data);
        }
      } catch (error) {
        if (active) {
          setErrorMessage("Could not load your hotspots right now.");
        }
        console.error("My hotspots load error:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user]);

  const provinces = useMemo(
    () =>
      Array.from(new Set(entries.map((entry) => entry.province))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [entries]
  );

  const counts = useMemo(
    () => ({
      total: entries.length,
      visited: entries.filter((entry) => entry.visited).length,
      wishlist: entries.filter((entry) => entry.wishlist).length,
      favorite: entries.filter((entry) => entry.favorite).length,
    }),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      if (provinceFilter && entry.province !== provinceFilter) return false;

      if (statusFilter === "visited" && !entry.visited) return false;
      if (statusFilter === "wishlist" && !entry.wishlist) return false;
      if (statusFilter === "favorite" && !entry.favorite) return false;

      if (!query) return true;

      return (
        entry.name.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query) ||
        entry.province.toLowerCase().includes(query)
      );
    });
  }, [entries, provinceFilter, searchQuery, statusFilter]);

  const mapHotspots = useMemo<Hotspot[]>(
    () =>
      filteredEntries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        category: entry.category,
        province: entry.province,
        description: entry.description,
        images: [entry.imageUrl],
        visit_count: entry.visitCount,
        latitude: entry.latitude,
        longitude: entry.longitude,
      })),
    [filteredEntries]
  );

  const visitedIds = useMemo(
    () => filteredEntries.filter((entry) => entry.visited).map((entry) => entry.id),
    [filteredEntries]
  );

  const wishlistIds = useMemo(
    () => filteredEntries.filter((entry) => entry.wishlist).map((entry) => entry.id),
    [filteredEntries]
  );

  const favoriteIds = useMemo(
    () => filteredEntries.filter((entry) => entry.favorite).map((entry) => entry.id),
    [filteredEntries]
  );

  const toggleFavoriteInUi = useCallback(
    async (hotspotId: string) => {
      if (!user?.id) return;

      try {
        const next = await toggleFavorite(user.id, hotspotId);
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === hotspotId ? { ...entry, favorite: next } : entry
          )
        );
      } catch (error) {
        console.error("Favorite toggle failed:", error);
      }
    },
    [user?.id]
  );

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-slate-700">
        Please log in to view your saved hotspots.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">My Hotspots</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Your Personal Hotspot Hub</h1>
        <p className="mt-2 text-sm text-slate-600">
          One place for your visited, wishlist and favorite hotspots with fast filters and optional map view.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-bold text-slate-900">{counts.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Visited</p>
            <p className="text-lg font-bold text-emerald-700">{counts.visited}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Wishlist</p>
            <p className="text-lg font-bold text-amber-700">{counts.wishlist}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Favorite</p>
            <p className="text-lg font-bold text-rose-700">{counts.favorite}</p>
          </div>
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
            placeholder="Search your hotspots"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />

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

          <div className="rounded-xl border border-slate-200 p-1 grid grid-cols-4 gap-1">
            {[
              { id: "all", label: "All" },
              { id: "visited", label: "Visited" },
              { id: "wishlist", label: "Wishlist" },
              { id: "favorite", label: "Favorites" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${
                  statusFilter === tab.id
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowMap((prev) => !prev)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
            {showMap ? "Hide map" : "Show map"}
          </button>

          <select
            value={mapStyle}
            onChange={(event) =>
              setMapStyle(event.target.value as "default" | "satellite" | "retro" | "terrain")
            }
            className="rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="default">Default</option>
            <option value="satellite">Satellite</option>
            <option value="retro">Retro</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>
      </section>

      {loading && <p className="text-sm text-slate-600">Loading your hotspots...</p>}

      {errorMessage && !loading && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {!loading && !errorMessage && showMap && (
        <section className="h-[52vh] min-h-[22rem] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <MapView
            hotspots={mapHotspots}
            loading={false}
            visitedIds={visitedIds}
            wishlistIds={wishlistIds}
            favoriteIds={favoriteIds}
            viewMode="markers"
            mapStyle={mapStyle}
            onSelect={setSelectedHotspot}
          />





        </section>
      )}
      <HotspotPanel
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        onVisit={() => {}}
        onWishlist={() => {}}
        onFavorite={toggleFavoriteInUi}
        onAddToTrip={() => {}}
        isVisited={false}
        isWishlist={false}
        isFavorite={false}
        canGoPrevious={false}
        canGoNext={false}
        onPrevious={() => {}}
        onNext={() => {}}
        positionLabel=""
      />


      {!loading && !errorMessage && filteredEntries.length === 0 && (
        <p className="text-sm text-slate-600">No hotspots found for this filter set.</p>
      )}


      {!loading && !errorMessage && filteredEntries.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {filteredEntries.map((entry, index) => (
            <article key={entry.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-32 w-full">
                <Link href={`/hotspots/${entry.id}`} className="block h-full">
                  <Image
                    src={entry.imageUrl}
                    alt={entry.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    priority={index < 6}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-sm font-semibold text-white">{entry.name}</p>
                    <p className="text-[11px] text-white/85">{entry.category} - {entry.province}</p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void toggleFavoriteInUi(entry.id);
                  }}
                  className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/90 shadow-sm ${
                    entry.favorite ? "text-rose-600" : "text-slate-600"
                  }`}
                  aria-label={entry.favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <span aria-hidden="true" className="text-[16px] leading-none">♡</span>
                </button>
              </div>

              <div className="space-y-2 p-3">
                <p className="line-clamp-2 text-xs text-slate-700">{entry.description}</p>

                <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                  <div className="rounded-lg border border-slate-200 p-1.5">
                    <p className="text-slate-500">Visits</p>
                    <p className="font-semibold text-slate-900">{entry.visitCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-1.5">
                    <p className="text-slate-500">Reviews</p>
                    <p className="font-semibold text-slate-900">{entry.reviewCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-1.5">
                    <p className="text-slate-500">Rating</p>
                    <p className="font-semibold text-slate-900">{entry.averageRating.toFixed(1)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-1.5">
                    <p className="text-slate-500">Likes</p>
                    <p className="font-semibold text-slate-900">{entry.likesCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-1.5">
                    <p className="text-slate-500">Saves</p>
                    <p className="font-semibold text-slate-900">{entry.savesCount}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {entry.visited && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                      <span aria-hidden="true" className="text-[13px] leading-none">✓</span>
                      Visited
                    </span>
                  )}
                  {entry.wishlist && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                      <span aria-hidden="true" className="text-[13px] leading-none">⟟</span>
                      Wishlist
                    </span>
                  )}
                  {entry.favorite && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-rose-700">
                      <span aria-hidden="true" className="text-[13px] leading-none">♡</span>
                      Favorite
                    </span>
                  )}
                  {entry.visitedAt && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                      {formatDate(entry.visitedAt)}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <AddHotspotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={() => {
          // Close modal and refresh data
          setIsAddModalOpen(false);
          // The useEffect will reload the hotspots
        }}
      />
    </div>
  );
}


