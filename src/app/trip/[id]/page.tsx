"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Compass, Edit3, Loader2, MapPinned, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JourneyTimeline, { type JourneyGroup, type JourneyStopItem } from "@/components/trips/detail/JourneyTimeline";
import TripFloatingActions from "@/components/trips/detail/TripFloatingActions";
import TripProgressIndicator from "@/components/trips/detail/TripProgressIndicator";
import TripStoryHero from "@/components/trips/detail/TripStoryHero";
import StopImagesGrid from "@/components/trips/StopImagesGrid";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useAuth } from "@/context/AuthContext";
import { fetchPublicTrip } from "@/lib/services/publicTrip";
import { buildTripShareText } from "@/lib/services/tripBuilder";
import type { Trip, TripStop } from "@/types/trip";
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

type LightboxState = {
  index: number;
};

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

function getLeadMediaIndex(stop: TripStop): number {
  const highlightedIndex = stop.media.findIndex((media) => media.isHighlight);
  return highlightedIndex >= 0 ? highlightedIndex : 0;
}

function getStopPreviewUrls(stop: TripStop): string[] {
  const leadIndex = getLeadMediaIndex(stop);
  const orderedMedia = stop.media.length
    ? [stop.media[leadIndex], ...stop.media.filter((_, index) => index !== leadIndex)]
    : [];

  const uniqueUrls: string[] = [];
  const seen = new Set<string>();

  orderedMedia.forEach((item) => {
    if (!item?.signedUrl || seen.has(item.signedUrl)) {
      return;
    }

    seen.add(item.signedUrl);
    uniqueUrls.push(item.signedUrl);
  });

  return uniqueUrls;
}

function stopImage(stop: TripStop): string {
  const previewUrls = getStopPreviewUrls(stop);
  return previewUrls[0] || stop.photoUrl || DEFAULT_IMAGE;
}

function stopSortTime(stop: TripStop): number {
  if (!stop.visitedAt) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = Date.parse(stop.visitedAt);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function sortStopsChronologically(stops: TripStop[]): TripStop[] {
  return [...stops].sort((a, b) => {
    const byVisitedAt = stopSortTime(a) - stopSortTime(b);
    if (byVisitedAt !== 0) {
      return byVisitedAt;
    }

    return a.addedAt.localeCompare(b.addedAt);
  });
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

    const previewUrls = getStopPreviewUrls(stop);

    return {
      id: stop.id,
      hotspotId: stop.hotspotId,
      order: index + 1,
      name: stop.name,
      categoryLabel: getCategoryDisplay(stop.category),
      province: stop.province,
      note: stop.note,
      imageUrl: previewUrls[0] || stop.photoUrl || DEFAULT_IMAGE,
      mediaPreviewUrls: previewUrls,
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
      title = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      subtitle = "Journey chapter by day";
    } else {
      const province = stop.province || "Across Belgium";
      key = `region-${province.toLowerCase()}`;
      title = province;
      subtitle = "Journey chapter by region";
    }

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title,
        subtitle,
        stops: [],
      });
    }

    groups.get(key)?.stops.push(stop);
  }

  return Array.from(groups.values());
}

function locationSummary(stops: TripStop[]): string {
  const provinces = Array.from(new Set(stops.map((stop) => stop.province).filter(Boolean)));

  if (!provinces.length) {
    return "Belgium";
  }

  if (provinces.length === 1) {
    return provinces[0];
  }

  if (provinces.length === 2) {
    return `${provinces[0]} & ${provinces[1]}`;
  }

  return `${provinces[0]}, ${provinces[1]} +${provinces.length - 2} regions`;
}

function buildGoogleMapsUrl(stops: TripStop[]): string | null {
  const validStops = stops.filter((stop) => isValidCoordinate(stop.lat) && isValidCoordinate(stop.lng));

  if (!validStops.length) {
    return null;
  }

  const origin = `${validStops[0].lat},${validStops[0].lng}`;
  const destinationStop = validStops[validStops.length - 1];
  const destination = `${destinationStop.lat},${destinationStop.lng}`;
  const waypointStops = validStops.slice(1, -1);

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });

  if (waypointStops.length) {
    params.set(
      "waypoints",
      waypointStops.map((stop) => `${stop.lat},${stop.lng}`).join("|")
    );
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function PublicTripPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const tripId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const [updatingLike, setUpdatingLike] = useState(false);
  const [updatingSave, setUpdatingSave] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [showTripStudio, setShowTripStudio] = useState(false);
  const studioSectionRef = useRef<HTMLElement | null>(null);

  const allTripPhotos = useMemo(() => (trip ? trip.stops.flatMap((stop) => stop.media) : []), [trip]);
  const canEditTrip = Boolean(user?.id && trip?.creator?.id && user.id === trip.creator.id);

  const loadTrip = useCallback(async () => {
    if (!tripId) {
      setError("Trip not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const publicTrip = await fetchPublicTrip(tripId);

      if (!publicTrip) {
        setError("Trip not found or not public");
        setTrip(null);
        return;
      }

      setTrip(publicTrip);
    } catch (loadError) {
      console.error(loadError);
      setError("Failed to load trip");
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void loadTrip();
  }, [loadTrip, user?.id]);

  useEffect(() => {
    const tripLoadedId = trip?.id;

    if (!tripId || !tripLoadedId) {
      return;
    }

    const key = `viewed-${tripId}`;
    if (sessionStorage.getItem(key)) {
      return;
    }

    const trackView = async () => {
      try {
        const response = await fetch(`/api/trip/${tripId}/view`, { method: "POST" });

        if (!response.ok) {
          return;
        }

        const data = (await response.json().catch(() => ({}))) as { viewCount?: number };

        if (typeof data.viewCount === "number") {
          setTrip((current) => (current ? { ...current, viewsCount: data.viewCount as number } : current));
        }

        sessionStorage.setItem(key, "true");
      } catch (viewError) {
        console.error("View tracking failed", viewError);
      }
    };

    void trackView();
  }, [tripId, trip?.id]);

  const timelineSortedStops = useMemo(() => (trip ? sortStopsChronologically(trip.stops) : []), [trip]);
  const journeyStops = useMemo(() => buildJourneyStops(timelineSortedStops), [timelineSortedStops]);
  const journeyGroups = useMemo(() => buildJourneyGroups(journeyStops), [journeyStops]);

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
    if (!showTripStudio) return;

    studioSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showTripStudio]);

  useEffect(() => {
    if (!canEditTrip && showTripStudio) {
      setShowTripStudio(false);
    }
  }, [canEditTrip, showTripStudio]);

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

  const heroImage = useMemo(() => {
    if (!trip) return DEFAULT_IMAGE;

    if (trip.coverImage) {
      return trip.coverImage;
    }

    const highlight = trip.stops.flatMap((stop) => stop.media).find((media) => media.isHighlight)?.signedUrl;
    return highlight || (trip.stops.length ? stopImage(trip.stops[0]) : DEFAULT_IMAGE);
  }, [trip]);

  const mapsUrl = useMemo(() => (trip ? buildGoogleMapsUrl(trip.stops) : null), [trip]);

  const heroStats = useMemo(
    () => [
      { label: "Stops", value: `${journeyStops.length}` },
      { label: "Views", value: `${trip?.viewsCount ?? 0}` },
      { label: "Distance", value: `${totalDistanceKm.toFixed(1)} km` },
    ],
    [journeyStops.length, totalDistanceKm, trip?.viewsCount]
  );

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  const openLightboxByUrl = useCallback(
    (imageUrl: string) => {
      if (!imageUrl) {
        return;
      }

      const index = allTripPhotos.findIndex((photo) => photo.signedUrl === imageUrl);

      if (index >= 0) {
        setLightbox({ index });
      }
    },
    [allTripPhotos]
  );

  const openLightboxFromTimeline = useCallback(
    (stop: JourneyStopItem, imageUrl?: string) => {
      openLightboxByUrl(imageUrl || stop.imageUrl);
    },
    [openLightboxByUrl]
  );

  const nextPhoto = useCallback(() => {
    if (!lightbox || !allTripPhotos.length) {
      return;
    }

    setLightbox({ index: (lightbox.index + 1) % allTripPhotos.length });
  }, [allTripPhotos.length, lightbox]);

  const prevPhoto = useCallback(() => {
    if (!lightbox || !allTripPhotos.length) {
      return;
    }

    setLightbox({ index: (lightbox.index - 1 + allTripPhotos.length) % allTripPhotos.length });
  }, [allTripPhotos.length, lightbox]);

  const handleLike = useCallback(async () => {
    if (!trip || !tripId) {
      return;
    }

    if (!user?.id) {
      setShareFeedback("Log in to like this trip");
      return;
    }

    if (updatingLike) {
      return;
    }

    setUpdatingLike(true);

    try {
      const response = await fetch(`/api/trip/${tripId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }

      const payload = (await response.json()) as { liked: boolean; likesCount: number };

      setTrip((current) =>
        current
          ? {
              ...current,
              likedByMe: payload.liked,
              likesCount: Number(payload.likesCount) || current.likesCount,
            }
          : current
      );
    } catch (likeError) {
      console.error("Like failed", likeError);
      setShareFeedback("Could not update like");
    } finally {
      setUpdatingLike(false);
    }
  }, [trip, tripId, updatingLike, user?.id]);

  const handleSave = useCallback(async () => {
    if (!trip || !tripId) {
      return;
    }

    if (!user?.id) {
      setShareFeedback("Log in to save this trip");
      return;
    }

    if (updatingSave) {
      return;
    }

    setUpdatingSave(true);

    try {
      const response = await fetch(`/api/trip/${tripId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle save");
      }

      const payload = (await response.json()) as { saved: boolean; savesCount: number };

      setTrip((current) =>
        current
          ? {
              ...current,
              savedByMe: payload.saved,
              savesCount: Number(payload.savesCount) || current.savesCount,
            }
          : current
      );
    } catch (saveError) {
      console.error("Save failed", saveError);
      setShareFeedback("Could not update save");
    } finally {
      setUpdatingSave(false);
    }
  }, [trip, tripId, updatingSave, user?.id]);

  const handleShare = useCallback(async () => {
    if (!trip) {
      return;
    }

    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = buildTripShareText(trip);

    try {
      if (navigator.share) {
        await navigator.share({
          title: trip.title,
          text,
          url,
        });
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

  useEffect(() => {
    if (!shareFeedback) {
      return;
    }

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

  if (error || !trip) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">Trip not found</h1>
          <p className="text-sm text-slate-600">This public trip is unavailable or no longer exists.</p>
          <Link
            href="/"
            className="inline-flex rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d5f5a]"
          >
            Back to discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
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
            creatorLabel={trip.creator?.display_name ?? trip.creator?.username ?? "Unknown traveler"}
            locationSummary={locationSummary(trip.stops)}
            stats={heroStats}
            onBack={() => router.push("/")}
          />

          {canEditTrip ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowTripStudio((current) => !current)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-expanded={showTripStudio}
                aria-controls="trip-studio"
              >
                <Edit3 className="h-4 w-4" />
                {showTripStudio ? "Close studio" : "Edit trip"}
              </button>
            </div>
          ) : null}

          {canEditTrip && showTripStudio ? (
            <section
              id="trip-studio"
              ref={studioSectionRef}
              className="space-y-5 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_22px_40px_-34px_rgba(10,18,36,0.95)] backdrop-blur-xl sm:p-6"
            >
              <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Trip studio</h2>
                  <p className="text-sm text-slate-600">Owner view with per-stop media and quick access to the full editor.</p>
                </div>
                <Link
                  href={`/trips/${trip.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Open full editor
                </Link>
              </header>

              <div className="space-y-4">
                {trip.stops.map((stop, index) => (
                  <article key={stop.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Stop {index + 1}</p>
                        <h3 className="text-lg font-semibold text-slate-900">{stop.name}</h3>
                        <p className="text-xs text-slate-500">{getCategoryDisplay(stop.category)} {stop.province ? `- ${stop.province}` : ""}</p>
                      </div>
                      <p className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {formatDateLabel(stop.visitedAt)}
                      </p>
                    </div>

                    <StopImagesGrid media={stop.media} stopName={stop.name} />

                    {stop.note ? <p className="mt-3 text-sm text-slate-700">{stop.note}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}


          <section className="space-y-4 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_22px_40px_-34px_rgba(10,18,36,0.95)] backdrop-blur-xl sm:p-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Journey timeline
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Follow this traveler&apos;s route</h2>
              </div>
              <p className="max-w-[260px] text-sm text-slate-600">
                Scroll through each chapter. Tap images to open the photo lightbox.
              </p>
            </header>

            <JourneyTimeline
              groups={journeyGroups}
              activeStopId={activeStopId}
              onActiveStopChange={setActiveStopId}
              onImageClick={openLightboxFromTimeline}
            />
          </section>

          <section className="space-y-4 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_22px_40px_-34px_rgba(10,18,36,0.95)] backdrop-blur-xl sm:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Route map</h2>
                <p className="text-sm text-slate-600">Visualize all stops and the route path in one glance.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenMaps}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
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
                <h2 className="text-2xl font-semibold text-slate-900">Trip gallery</h2>
                <p className="text-sm text-slate-600">A visual recap of this journey&apos;s highlights.</p>
              </div>
            </header>

            {allTripPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {allTripPhotos.slice(0, 16).map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => openLightboxByUrl(media.signedUrl)}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                  >
                    <OptimizedImage
                      src={media.signedUrl}
                      alt={media.caption || "Trip memory"}
                      fill
                      showSkeleton
                      enableRetry
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 45vw, 240px"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No photos yet for this public trip.
              </div>
            )}

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">
              <p className="text-sm text-slate-700">
                Inspired by this route? Start your own hidden-gems story and share it with the community.
              </p>
              <Link
                href="/trips"
                className="mt-3 inline-flex rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d5f5a]"
              >
                Create a trip
              </Link>
            </div>
          </section>

          <section className="space-y-4 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_22px_40px_-34px_rgba(10,18,36,0.95)] backdrop-blur-xl sm:p-6">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Keep exploring</h2>
                <p className="text-sm text-slate-600">Open hotspots from this route and discover nearby gems.</p>
              </div>
            </header>

            {relatedStops.length > 0 ? (
              <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                {relatedStops.map((stop) => {
                  const hasHotspotLink = Boolean(stop.hotspotId && !stop.hotspotId.startsWith("custom"));

                  return (
                    <div
                      key={stop.id}
                      className="min-w-[220px] max-w-[240px] snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="relative h-28">
                        <OptimizedImage
                          src={stop.imageUrl}
                          alt={stop.name}
                          fill
                          showSkeleton
                          enableRetry
                          className="object-cover"
                          sizes="220px"
                        />
                      </div>
                      <div className="space-y-2 p-3">
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{stop.name}</p>
                        <p className="text-xs text-slate-500">{stop.province || "Belgium"}</p>

                        {hasHotspotLink ? (
                          <Link
                            href={`/hotspots/${stop.hotspotId}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f766e]"
                          >
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
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No stops available yet.
              </div>
            )}
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
          disabled={updatingLike || updatingSave}
        />

        {shareFeedback ? (
          <div className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">
            {shareFeedback}
          </div>
        ) : null}
      </div>

      {lightbox && allTripPhotos.length > 0 ? (
        <div
          className="fixed inset-0 z-[100] bg-black/95"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeLightbox();
            }
          }}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/35 bg-black/35 p-2 text-white"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              prevPhoto();
            }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/35 bg-black/35 px-3 py-2 text-2xl text-white"
            aria-label="Previous photo"
          >
            &lt;
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              nextPhoto();
            }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/35 bg-black/35 px-3 py-2 text-2xl text-white"
            aria-label="Next photo"
          >
            &gt;
          </button>

          <div className="relative mx-auto h-full w-full max-w-6xl">
            <Image
              src={allTripPhotos[lightbox.index].signedUrl}
              alt={allTripPhotos[lightbox.index].caption || "Trip memory"}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-sm font-medium text-white">
              {lightbox.index + 1} / {allTripPhotos.length}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
