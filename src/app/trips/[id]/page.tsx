"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Compass, Loader2, MapPinned, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CreateMemoryModal from "@/components/trips/CreateMemoryModal";
import JourneyTimeline, { type JourneyGroup, type JourneyStopItem } from "@/components/trips/detail/JourneyTimeline";
import TripFloatingActions from "@/components/trips/detail/TripFloatingActions";
import TripProgressIndicator from "@/components/trips/detail/TripProgressIndicator";
import TripStoryHero from "@/components/trips/detail/TripStoryHero";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useAuth } from "@/context/AuthContext";
import { fetchHotspots } from "@/lib/services/hotspots";
import { createSignedMediaUrl } from "@/lib/services/media";
import {
  addHotspotToTrip,
  buildTripShareText,
  fetchTrips,
  removeStopFromTrip,
  setTripCoverImage,
  toggleTripLike,
  toggleTripMediaHighlight,
  toggleTripSave,
  updateStopNote,
  updateStopVisitedAt,
  type Trip,
  type TripStop,
} from "@/lib/services/tripBuilder";
import type { Hotspot } from "@/types/hotspot";
import { getCategoryDisplay } from "@/types/hotspot";

const TripRouteMap = dynamic(() => import("@/components/trips/TripRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading map...
    </div>
  ),
});

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1469474968028-56623f02e42e";

type StopCarouselState = {
  stopId: string;
  index: number;
};

function getLeadMediaIndex(stop: TripStop): number {
  const highlightedIndex = stop.media.findIndex((media) => media.isHighlight);
  return highlightedIndex >= 0 ? highlightedIndex : 0;
}

function formatDateLabel(dateValue: string | null | undefined): string {
  if (!dateValue) return "Planned stop";

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return "Planned stop";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTripDateRange(trip: Trip): string {
  const start = formatDateLabel(trip.startDate);
  const end = formatDateLabel(trip.endDate);

  if (trip.startDate && trip.endDate) {
    return `${start} - ${end}`;
  }

  if (trip.startDate) {
    return `Started ${start}`;
  }

  return "Dates not set";
}

function isValidCoordinate(value: number): boolean {
  return Number.isFinite(value) && value !== 0;
}

function haversineDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function stopImage(stop: TripStop): string {
  const leadIndex = getLeadMediaIndex(stop);
  return stop.media[leadIndex]?.signedUrl || stop.photoUrl || DEFAULT_IMAGE;
}

function buildJourneyStops(stops: TripStop[]): JourneyStopItem[] {
  let previousWithCoordinates: TripStop | null = null;

  return stops.map((stop, index) => {
    let distanceFromPreviousKm: number | null = null;

    if (
      previousWithCoordinates &&
      isValidCoordinate(previousWithCoordinates.lat) &&
      isValidCoordinate(previousWithCoordinates.lng) &&
      isValidCoordinate(stop.lat) &&
      isValidCoordinate(stop.lng)
    ) {
      distanceFromPreviousKm = haversineDistanceKm(
        previousWithCoordinates.lat,
        previousWithCoordinates.lng,
        stop.lat,
        stop.lng
      );
    }

    if (isValidCoordinate(stop.lat) && isValidCoordinate(stop.lng)) {
      previousWithCoordinates = stop;
    }

    return {
      id: stop.id,
      hotspotId: stop.hotspotId,
      order: index + 1,
      name: stop.name,
      categoryLabel: getCategoryDisplay(stop.category),
      province: stop.province,
      note: stop.note,
      imageUrl: stopImage(stop),
      visitedLabel: formatDateLabel(stop.visitedAt),
      visitedAt: stop.visitedAt,
      mediaCount: stop.media.length,
      distanceFromPreviousKm,
    };
  });
}

function buildJourneyGroups(stops: JourneyStopItem[]): JourneyGroup[] {
  if (!stops.length) {
    return [];
  }

  const datedCount = stops.filter((stop) => Boolean(stop.visitedAt)).length;
  const useDayGrouping = datedCount >= 2;
  const groups = new Map<string, JourneyGroup>();

  for (const stop of stops) {
    let key = "";
    let title = "";
    let subtitle = "";

    if (useDayGrouping && stop.visitedAt) {
      const dayKey = stop.visitedAt.slice(0, 10);
      const date = new Date(stop.visitedAt);

      key = `day-${dayKey}`;
      title = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      subtitle = "Journey chapter by day";
    } else {
      const province = stop.province || "Across Belgium";
      key = `region-${province.toLowerCase()}`;
      title = province;
      subtitle = "Journey chapter by region";
    }

    if (!groups.has(key)) {
      groups.set(key, { key, title, subtitle, stops: [] });
    }

    groups.get(key)?.stops.push(stop);
  }

  return Array.from(groups.values());
}

function locationSummary(stops: TripStop[]): string {
  const provinces = Array.from(new Set(stops.map((stop) => stop.province).filter(Boolean)));
  if (!provinces.length) return "Belgium";
  if (provinces.length === 1) return provinces[0];
  if (provinces.length === 2) return `${provinces[0]} & ${provinces[1]}`;
  return `${provinces[0]}, ${provinces[1]} +${provinces.length - 2} regions`;
}

function buildGoogleMapsUrl(stops: TripStop[]): string | null {
  const validStops = stops.filter((stop) => isValidCoordinate(stop.lat) && isValidCoordinate(stop.lng));
  if (!validStops.length) return null;

  const origin = `${validStops[0].lat},${validStops[0].lng}`;
  const destinationStop = validStops[validStops.length - 1];
  const destination = `${destinationStop.lat},${destinationStop.lng}`;
  const waypointStops = validStops.slice(1, -1);

  const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "driving" });
  if (waypointStops.length) {
    params.set("waypoints", waypointStops.map((stop) => `${stop.lat},${stop.lng}`).join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

async function fetchTripsWithRetry(userId: string): Promise<Trip[]> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const trips = await fetchTrips(userId);
    if (trips.length > 0 || attempt === 2) return trips;
    await new Promise((resolve) => window.setTimeout(resolve, 180 * (attempt + 1)));
  }

  return [];
}

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const tripId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState(DEFAULT_IMAGE);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const [updatingReactions, setUpdatingReactions] = useState(false);
  const [selectedStop, setSelectedStop] = useState<JourneyStopItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Hotspot[]>([]);
  const [searchingHotspots, setSearchingHotspots] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [visitedDrafts, setVisitedDrafts] = useState<Record<string, string>>({});
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [carousel, setCarousel] = useState<StopCarouselState | null>(null);

  const inFlightRef = useRef<Promise<void> | null>(null);
  const requestVersionRef = useRef(0);
  const hotspotsCacheRef = useRef<Hotspot[] | null>(null);
  const loadTrip = useCallback(
    async ({ showLoader, preserveCurrent }: { showLoader: boolean; preserveCurrent: boolean }) => {
      if (!user?.id || !tripId) {
        setLoading(false);
        return;
      }

      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      const version = requestVersionRef.current + 1;
      requestVersionRef.current = version;

      const operation = (async () => {
        if (showLoader) setLoading(true);

        try {
          const trips = await fetchTripsWithRetry(user.id);
          const foundTrip = trips.find((candidate) => candidate.id === tripId) ?? null;

          if (requestVersionRef.current !== version) {
            return;
          }

          setTrip((current) => {
            if (foundTrip) return foundTrip;
            return preserveCurrent ? current : null;
          });
        } finally {
          if (showLoader && requestVersionRef.current === version) {
            setLoading(false);
          }
        }
      })();

      inFlightRef.current = operation.finally(() => {
        inFlightRef.current = null;
      });

      return inFlightRef.current;
    },
    [tripId, user?.id]
  );

  useEffect(() => {
    if (!user?.id || !tripId) {
      setLoading(false);
      return;
    }

    void loadTrip({ showLoader: true, preserveCurrent: false });
  }, [loadTrip, tripId, user?.id]);

  useEffect(() => {
    if (!trip) {
      setHeroImage(DEFAULT_IMAGE);
      return;
    }

    let cancelled = false;

    const resolveHero = async () => {
      if (trip.coverImage) {
        if (trip.coverImage.startsWith("http")) {
          if (!cancelled) setHeroImage(trip.coverImage);
          return;
        }

        const signedCover = await createSignedMediaUrl(trip.coverImage);
        if (!cancelled && signedCover) {
          setHeroImage(signedCover);
          return;
        }
      }

      const highlightImage = trip.stops
        .flatMap((stop) => stop.media)
        .find((media) => media.isHighlight)?.signedUrl;

      if (!cancelled && highlightImage) {
        setHeroImage(highlightImage);
        return;
      }

      if (!cancelled) {
        const firstStopImage = trip.stops.length ? stopImage(trip.stops[0]) : DEFAULT_IMAGE;
        setHeroImage(firstStopImage);
      }
    };

    void resolveHero();

    return () => {
      cancelled = true;
    };
  }, [trip]);

  const journeyStops = useMemo(() => (trip ? buildJourneyStops(trip.stops) : []), [trip]);
  const journeyGroups = useMemo(() => buildJourneyGroups(journeyStops), [journeyStops]);

  useEffect(() => {
    if (!trip) return;

    const nextNoteDrafts: Record<string, string> = {};
    const nextVisitedDrafts: Record<string, string> = {};

    trip.stops.forEach((stop) => {
      nextNoteDrafts[stop.id] = stop.note || "";
      nextVisitedDrafts[stop.id] = stop.visitedAt ? stop.visitedAt.slice(0, 10) : "";
    });

    setNoteDrafts(nextNoteDrafts);
    setVisitedDrafts(nextVisitedDrafts);
  }, [trip]);

  useEffect(() => {
    if (!journeyStops.length) {
      setActiveStopId(null);
      return;
    }

    const hasActive = activeStopId && journeyStops.some((stop) => stop.id === activeStopId);
    if (!hasActive) {
      setActiveStopId(journeyStops[0].id);
    }
  }, [journeyStops, activeStopId]);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      const term = searchTerm.trim();

      if (!term || term.length < 2 || !trip) {
        setSearchResults([]);
        setSearchingHotspots(false);
        return;
      }

      setSearchingHotspots(true);

      try {
        let hotspots = hotspotsCacheRef.current;

        if (!hotspots) {
          hotspots = ((await fetchHotspots()) as Hotspot[] | null) ?? [];
          hotspotsCacheRef.current = hotspots;
        }

        const normalizedTerm = term.toLowerCase();
        const existingHotspotIds = new Set(trip.stops.map((stop) => stop.hotspotId));

        const filtered = hotspots
          .filter((hotspot) => {
            if (!hotspot.id || existingHotspotIds.has(hotspot.id)) {
              return false;
            }

            const target = `${hotspot.name ?? ""} ${hotspot.province ?? ""} ${String(hotspot.category ?? "")}`;
            return target.toLowerCase().includes(normalizedTerm);
          })
          .slice(0, 8);

        if (!cancelled) {
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error("Hotspot search failed", error);
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchingHotspots(false);
        }
      }
    };

    const timeout = window.setTimeout(() => {
      void runSearch();
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [searchTerm, trip]);

  const activeStopIndex = useMemo(() => {
    if (!journeyStops.length || !activeStopId) {
      return 0;
    }

    const index = journeyStops.findIndex((stop) => stop.id === activeStopId);
    return index >= 0 ? index : 0;
  }, [activeStopId, journeyStops]);

  const totalDistanceKm = useMemo(() => {
    return journeyStops.reduce((sum, stop) => sum + (stop.distanceFromPreviousKm ?? 0), 0);
  }, [journeyStops]);

  const totalMemories = useMemo(() => {
    return trip ? trip.stops.reduce((sum, stop) => sum + stop.media.length, 0) : 0;
  }, [trip]);

  const mapsUrl = useMemo(() => (trip ? buildGoogleMapsUrl(trip.stops) : null), [trip]);

  const heroStats = useMemo(
    () => [
      { label: "Stops", value: `${journeyStops.length}` },
      { label: "Memories", value: `${totalMemories}` },
      { label: "Distance", value: `${totalDistanceKm.toFixed(1)} km` },
    ],
    [journeyStops.length, totalDistanceKm, totalMemories]
  );

  const refreshTrip = useCallback(async () => {
    await loadTrip({ showLoader: false, preserveCurrent: true });
  }, [loadTrip]);

  const handleLike = useCallback(async () => {
    if (!trip || !user?.id || updatingReactions) return;

    setUpdatingReactions(true);
    try {
      await toggleTripLike({ tripId: trip.id, userId: user.id, tripTitle: trip.title });
      await refreshTrip();
    } finally {
      setUpdatingReactions(false);
    }
  }, [refreshTrip, trip, updatingReactions, user?.id]);

  const handleSave = useCallback(async () => {
    if (!trip || !user?.id || updatingReactions) return;

    setUpdatingReactions(true);
    try {
      await toggleTripSave({ tripId: trip.id, userId: user.id, tripTitle: trip.title });
      await refreshTrip();
    } finally {
      setUpdatingReactions(false);
    }
  }, [refreshTrip, trip, updatingReactions, user?.id]);

  const handleShare = useCallback(async () => {
    if (!trip) return;

    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = buildTripShareText(trip);

    try {
      if (navigator.share) {
        await navigator.share({ title: trip.title, text, url });
        setShareFeedback("Trip shared");
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${trip.title}\n\n${text}\n\n${url}`);
        setShareFeedback("Trip link copied");
        return;
      }
    } catch {
      setShareFeedback("Share cancelled");
      return;
    }

    setShareFeedback("Sharing unavailable on this device");
  }, [trip]);

  const handleOpenMaps = useCallback(() => {
    if (!mapsUrl) {
      setShareFeedback("No route coordinates yet");
      return;
    }

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  }, [mapsUrl]);

  const handleAddStop = useCallback(
    async (hotspot: Hotspot) => {
      if (!trip || !user?.id) return;

      setBusyAction("add-stop");
      try {
        await addHotspotToTrip({ tripId: trip.id, hotspot });
        setSearchTerm("");
        setSearchResults([]);
        await refreshTrip();
      } finally {
        setBusyAction(null);
      }
    },
    [refreshTrip, trip, user?.id]
  );

  const handleAddCustomStop = useCallback(async () => {
    if (!trip || !user?.id || !searchTerm.trim()) return;

    setBusyAction("add-custom-stop");
    try {
      await addHotspotToTrip({
        tripId: trip.id,
        hotspot: {
          id: `custom-${Date.now()}`,
          name: searchTerm.trim(),
          category: "custom",
          province: "",
          images: [],
          latitude: 0,
          longitude: 0,
        } as Hotspot,
      });

      setSearchTerm("");
      setSearchResults([]);
      await refreshTrip();
    } finally {
      setBusyAction(null);
    }
  }, [refreshTrip, searchTerm, trip, user?.id]);

  const handleRemoveStop = useCallback(
    async (stopId: string) => {
      if (!trip) return;

      setBusyAction(`remove-${stopId}`);
      try {
        await removeStopFromTrip(trip.id, stopId);
        await refreshTrip();
      } finally {
        setBusyAction(null);
      }
    },
    [refreshTrip, trip]
  );

  const handleSaveStopNote = useCallback(
    async (stopId: string) => {
      if (!trip) return;

      setBusyAction(`note-${stopId}`);
      try {
        await updateStopNote(trip.id, stopId, noteDrafts[stopId] || "");
        await refreshTrip();
      } finally {
        setBusyAction(null);
      }
    },
    [noteDrafts, refreshTrip, trip]
  );

  const handleSaveStopVisitedDate = useCallback(
    async (stopId: string) => {
      if (!trip) return;

      setBusyAction(`visited-${stopId}`);
      try {
        await updateStopVisitedAt(trip.id, stopId, visitedDrafts[stopId] || null);
        await refreshTrip();
      } finally {
        setBusyAction(null);
      }
    },
    [refreshTrip, trip, visitedDrafts]
  );

  const handleSetLeadImage = useCallback(
    async (stop: TripStop, mediaId: string) => {
      if (!trip || !user?.id) return;

      setBusyAction(`lead-${stop.id}`);
      try {
        const highlightedElsewhere = stop.media.filter((media) => media.isHighlight && media.id !== mediaId);
        if (highlightedElsewhere.length) {
          await Promise.all(
            highlightedElsewhere.map((media) =>
              toggleTripMediaHighlight({ mediaId: media.id, userId: user.id, isHighlight: false })
            )
          );
        }

        const selected = stop.media.find((media) => media.id === mediaId);
        if (selected && !selected.isHighlight) {
          await toggleTripMediaHighlight({ mediaId: selected.id, userId: user.id, isHighlight: true });
        }

        await refreshTrip();
      } finally {
        setBusyAction(null);
      }
    },
    [refreshTrip, trip, user?.id]
  );

  const handleSetTripCoverFromMedia = useCallback(
    async (storagePath: string, stopId: string) => {
      if (!trip || !user?.id) return;

      setBusyAction(`cover-${stopId}`);
      try {
        await setTripCoverImage({ tripId: trip.id, userId: user.id, storagePath });
        await refreshTrip();
      } finally {
        setBusyAction(null);
      }
    },
    [refreshTrip, trip, user?.id]
  );

  const openCarousel = useCallback((stopId: string, index: number) => {
    setCarousel({ stopId, index });
  }, []);

  const handleTimelineImageClick = useCallback(
    (stop: JourneyStopItem) => {
      if (!trip) return;

      const fullStop = trip.stops.find((item) => item.id === stop.id);
      if (!fullStop || !fullStop.media.length) return;

      openCarousel(fullStop.id, getLeadMediaIndex(fullStop));
    },
    [openCarousel, trip]
  );

  const carouselPhotos = useMemo(() => {
    if (!trip || !carousel) return [];

    const stop = trip.stops.find((item) => item.id === carousel.stopId);
    return stop?.media ?? [];
  }, [carousel, trip]);

  const nextCarouselPhoto = useCallback(() => {
    if (!carousel || !carouselPhotos.length) return;
    setCarousel({ stopId: carousel.stopId, index: (carousel.index + 1) % carouselPhotos.length });
  }, [carousel, carouselPhotos.length]);

  const prevCarouselPhoto = useCallback(() => {
    if (!carousel || !carouselPhotos.length) return;
    setCarousel({ stopId: carousel.stopId, index: (carousel.index - 1 + carouselPhotos.length) % carouselPhotos.length });
  }, [carousel, carouselPhotos.length]);

  useEffect(() => {
    if (!shareFeedback) return;

    const timeout = window.setTimeout(() => setShareFeedback(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [shareFeedback]);

  const relatedStops = useMemo(() => journeyStops.slice(0, 8), [journeyStops]);

  if (loading) {
    return (
      <div className="space-y-4 pb-24">
        <div className="h-[420px] animate-pulse rounded-[2rem] bg-slate-200/80" />
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200/75" />
        <div className="h-[620px] animate-pulse rounded-[2rem] bg-slate-200/75" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">Trip not found</h1>
          <p className="text-sm text-slate-600">This trip may have been removed or you no longer have access.</p>
          <Link href="/trips" className="inline-flex rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d5f5a]">
            Back to trips
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(15,118,110,0.12),transparent_44%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.1),transparent_40%)]" />

      <div className="relative mx-auto max-w-5xl space-y-6">
        <TripProgressIndicator
          activeIndex={activeStopIndex}
          totalStops={journeyStops.length}
          activeLabel={journeyStops[activeStopIndex]?.name ?? "Start your trip"}
        />

        <TripStoryHero
          title={trip.title}
          description={trip.description}
          imageUrl={heroImage}
          dateRangeLabel={formatTripDateRange(trip)}
          creatorLabel={trip.creator?.display_name ?? trip.creator?.username ?? "Your curated journey"}
          locationSummary={locationSummary(trip.stops)}
          stats={heroStats}
          onBack={() => router.push("/trips")}
        />

        <section className="space-y-4 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_22px_40px_-34px_rgba(10,18,36,0.95)] backdrop-blur-xl sm:p-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Journey timeline
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Follow the story stop by stop</h2>
            </div>
            <p className="max-w-[260px] text-sm text-slate-600">
              Scroll to move through each chapter. Tap images to open the stop carousel.
            </p>
          </header>

          <JourneyTimeline
            groups={journeyGroups}
            activeStopId={activeStopId}
            onActiveStopChange={setActiveStopId}
            onAddMemory={setSelectedStop}
            onImageClick={handleTimelineImageClick}
          />
        </section>

        <section className="space-y-5 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_22px_40px_-34px_rgba(10,18,36,0.95)] backdrop-blur-xl sm:p-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Trip studio</h2>
              <p className="text-sm text-slate-600">Edit stop count, details, and media directly from one place.</p>
            </div>
          </header>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Add a stop</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search hotspots by name, category, or province"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!searchTerm.trim()) return;
                  void handleAddCustomStop();
                }}
                disabled={!searchTerm.trim() || busyAction === "add-custom-stop"}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add custom
              </button>
            </div>

            {searchingHotspots ? <p className="mt-2 text-xs text-slate-500">Searching hotspots...</p> : null}

            {searchResults.length > 0 ? (
              <div className="mt-3 space-y-2">
                {searchResults.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    onClick={() => {
                      void handleAddStop(hotspot);
                    }}
                    disabled={busyAction === "add-stop"}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-2 text-left transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
                      <OptimizedImage
                        src={hotspot.images?.[0] || DEFAULT_IMAGE}
                        alt={hotspot.name}
                        fill
                        showSkeleton
                        enableRetry
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{hotspot.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {getCategoryDisplay(hotspot.category)} {hotspot.province ? `• ${hotspot.province}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">Add</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            {trip.stops.map((stop, index) => {
              const leadIndex = getLeadMediaIndex(stop);
              const leadMedia = stop.media[leadIndex] ?? null;
              const thumbs = stop.media.slice(0, 6);

              return (
                <article key={stop.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Stop {index + 1}</p>
                      <h3 className="text-lg font-semibold text-slate-900">{stop.name}</h3>
                      <p className="text-xs text-slate-500">{getCategoryDisplay(stop.category)} {stop.province ? `• ${stop.province}` : ""}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { void handleRemoveStop(stop.id); }}
                      disabled={busyAction === `remove-${stop.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove stop
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {stop.media.length > 0 && leadMedia ? (
                      <div className="grid gap-2 lg:grid-cols-[1.8fr,1fr]">
                        <button
                          type="button"
                          onClick={() => openCarousel(stop.id, leadIndex)}
                          className="relative block aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200"
                        >
                          <OptimizedImage src={leadMedia.signedUrl} alt={leadMedia.caption || stop.name} fill showSkeleton enableRetry className="object-cover" sizes="(max-width: 1024px) 100vw, 700px" />
                          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">Lead photo</span>
                        </button>

                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                          {thumbs.map((media, mediaIndex) => {
                            const isLead = mediaIndex === leadIndex;

                            return (
                              <div key={media.id} className="space-y-1">
                                <button type="button" onClick={() => openCarousel(stop.id, mediaIndex)} className="relative block aspect-square overflow-hidden rounded-xl border border-slate-200">
                                  <OptimizedImage src={media.signedUrl} alt={media.caption || stop.name} fill showSkeleton enableRetry className="object-cover" sizes="120px" />
                                  {isLead ? <span className="absolute left-1 top-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Lead</span> : null}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { void handleSetLeadImage(stop, media.id); }}
                                  disabled={isLead || busyAction === `lead-${stop.id}`}
                                  className="w-full rounded-md border border-slate-200 px-1 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                  {isLead ? "Current lead" : "Set lead"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No photos yet for this stop.</div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStop({
                            id: stop.id,
                            hotspotId: stop.hotspotId,
                            order: index + 1,
                            name: stop.name,
                            categoryLabel: getCategoryDisplay(stop.category),
                            province: stop.province,
                            note: stop.note,
                            imageUrl: stopImage(stop),
                            visitedLabel: formatDateLabel(stop.visitedAt),
                            visitedAt: stop.visitedAt,
                            mediaCount: stop.media.length,
                            distanceFromPreviousKm: null,
                          })
                        }
                        className="rounded-xl bg-[#0f766e] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0d5f5a]"
                      >
                        Upload / manage photos
                      </button>

                      {leadMedia ? (
                        <button
                          type="button"
                          onClick={() => { void handleSetTripCoverFromMedia(leadMedia.storagePath, stop.id); }}
                          disabled={busyAction === `cover-${stop.id}`}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          Use lead as trip cover
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Stop note</label>
                        <textarea
                          value={noteDrafts[stop.id] || ""}
                          onChange={(event) => setNoteDrafts((current) => ({ ...current, [stop.id]: event.target.value }))}
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => { void handleSaveStopNote(stop.id); }}
                          disabled={busyAction === `note-${stop.id}`}
                          className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          Save note
                        </button>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Visited date</label>
                        <input
                          type="date"
                          value={visitedDrafts[stop.id] || ""}
                          onChange={(event) => setVisitedDrafts((current) => ({ ...current, [stop.id]: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => { void handleSaveStopVisitedDate(stop.id); }}
                          disabled={busyAction === `visited-${stop.id}`}
                          className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          Save date
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_22px_40px_-34px_rgba(10,18,36,0.95)] backdrop-blur-xl sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Route map</h2>
              <p className="text-sm text-slate-600">Visualize all stops and the trip path in one glance.</p>
            </div>
            <button type="button" onClick={handleOpenMaps} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              <MapPinned className="h-4 w-4" />
              Open in Maps
            </button>
          </header>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
            <TripRouteMap stops={trip.stops} height="340px" />
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_22px_40px_-34px_rgba(10,18,36,0.95)] backdrop-blur-xl sm:p-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Keep exploring</h2>
              <p className="text-sm text-slate-600">Jump into hotspots from this trip or start creating your own route.</p>
            </div>
          </header>

          {relatedStops.length > 0 ? (
            <div className="flex snap-x gap-3 overflow-x-auto pb-2">
              {relatedStops.map((stop) => {
                const hasHotspotLink = Boolean(stop.hotspotId && !stop.hotspotId.startsWith("custom"));
                return (
                  <div key={stop.id} className="min-w-[220px] max-w-[240px] snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-28">
                      <OptimizedImage src={stop.imageUrl} alt={stop.name} fill showSkeleton enableRetry className="object-cover" sizes="220px" />
                    </div>
                    <div className="space-y-2 p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">{stop.name}</p>
                      <p className="text-xs text-slate-500">{stop.province || "Belgium"}</p>

                      {hasHotspotLink ? (
                        <Link href={`/hotspots/${stop.hotspotId}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f766e]">
                          Open hotspot
                          <Compass className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <p className="text-xs font-medium text-slate-500">Custom stop</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Add stops to start building this journey.</div>
          )}

          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">
            <p className="text-sm text-slate-700">Inspired by this trip? Create your own version and share your hidden gems with the community.</p>
            <Link href="/trips" className="mt-3 inline-flex rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d5f5a]">
              Create a new trip
            </Link>
          </div>
        </section>
      </div>

      <TripFloatingActions
        likesCount={trip.likesCount}
        savesCount={trip.savesCount}
        likedByMe={trip.likedByMe}
        savedByMe={trip.savedByMe}
        onLike={handleLike}
        onSave={handleSave}
        onShare={handleShare}
        onOpenMaps={handleOpenMaps}
        disabled={updatingReactions}
      />

      {shareFeedback ? (
        <div className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {shareFeedback}
        </div>
      ) : null}

      <CreateMemoryModal
        isOpen={Boolean(selectedStop && user?.id)}
        onClose={() => setSelectedStop(null)}
        onSuccess={() => {
          void refreshTrip();
        }}
        stopId={selectedStop?.id ?? ""}
        stopName={selectedStop?.name ?? ""}
        tripId={trip.id}
        userId={user?.id ?? ""}
        hotspotId={selectedStop && !selectedStop.hotspotId.startsWith("custom") ? selectedStop.hotspotId : ""}
      />

      {carousel && carouselPhotos.length > 0 ? (
        <div
          className="fixed inset-0 z-[100] bg-black/95"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setCarousel(null);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setCarousel(null)}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/35 bg-black/35 p-2 text-white"
            aria-label="Close carousel"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              prevCarouselPhoto();
            }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/35 bg-black/35 px-3 py-2 text-2xl text-white"
            aria-label="Previous photo"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              nextCarouselPhoto();
            }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/35 bg-black/35 px-3 py-2 text-2xl text-white"
            aria-label="Next photo"
          >
            ›
          </button>

          <div className="relative mx-auto h-full w-full max-w-6xl">
            <Image
              src={carouselPhotos[carousel.index].signedUrl}
              alt={carouselPhotos[carousel.index].caption || "Trip memory"}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-sm font-medium text-white">
              {carousel.index + 1} / {carouselPhotos.length}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
