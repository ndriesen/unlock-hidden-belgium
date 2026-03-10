"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchTrips, Trip } from "@/lib/services/tripBuilder";
import { createSignedMediaUrl } from "@/lib/services/media";

interface TripsOverviewProps {
  onCreateTrip: () => void;
  refreshKey?: number;
}

export default function TripsOverview({ onCreateTrip, refreshKey }: TripsOverviewProps) {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripCoverUrls, setTripCoverUrls] = useState<Record<string, string>>({});

  const loadTrips = useCallback(async () => {
    if (!user?.id) {
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const loaded = await fetchTrips(user.id);
    setTrips(loaded);
    
    // Fetch signed URLs for any cover images that are storage paths
    const coverUrls: Record<string, string> = {};
    for (const trip of loaded) {
      if (trip.coverImage && !trip.coverImage.startsWith('http')) {
        const signedUrl = await createSignedMediaUrl(trip.coverImage);
        if (signedUrl) {
          coverUrls[trip.id] = signedUrl;
        }
      }
    }
    setTripCoverUrls(coverUrls);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips, refreshKey]);

  const getTripCover = (trip: Trip): string => {
    // Default fallback image
    const defaultImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e";

    // 1. Check for explicit cover image set by user (优先使用用户设置的封面)
    if (trip.coverImage) {
      // If it's already a full URL, use it directly
      if (trip.coverImage.startsWith('http')) {
        return trip.coverImage;
      }
      // If we have a cached signed URL, use it
      if (tripCoverUrls[trip.id]) {
        return tripCoverUrls[trip.id];
      }
      // Storage path but no signed URL yet - fall through to other options
    }

    // 2. Check for highlight photos (在用户设置的封面之后，检查高亮照片)
    for (const stop of trip.stops) {
      const highlightMedia = stop.media.find(m => m.isHighlight);
      if (highlightMedia) {
        return highlightMedia.signedUrl;
      }
    }

    // 3. Fall back to first media from first stop
    for (const stop of trip.stops) {
      if (stop.media.length > 0) {
        return stop.media[0].signedUrl;
      }
    }

    // 4. Fall back to first stop's photoUrl
    if (trip.stops[0]?.photoUrl) {
      return trip.stops[0].photoUrl;
    }

    // 5. Return default image
    return defaultImage;
  };

  const getTripSummary = (trip: Trip): string => {
    if (trip.stops.length === 0) return "No stops yet";

    const names = trip.stops.slice(0, 3).map((s) => s.name);

    if (trip.stops.length > 3) {
      return names.join(" → ") + " → ...";
    }

    return names.join(" → ");
  };

  const getDateRange = (trip: Trip): string => {
    if (!trip.startDate && !trip.endDate) return "";

    if (!trip.endDate) {
      return new Date(trip.startDate!).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }

    const start = new Date(trip.startDate!);
    const end = new Date(trip.endDate);

    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${start.toLocaleDateString("en-US", {
        month: "short",
      })} ${start.getFullYear()}`;
    }

    return `${start.toLocaleDateString("en-US", {
      month: "short",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })}`;
  };

  const getCurrentDay = (trip: Trip): number => {
    if (!trip.startDate) return 1;

    const start = new Date(trip.startDate);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const diffDays =
      Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
      1;

    return Math.max(1, diffDays);
  };

  const isTripOngoing = (trip: Trip): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = trip.startDate ? new Date(trip.startDate) : null;
    const end = trip.endDate ? new Date(trip.endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    if (start && end) return today >= start && today <= end;
    if (start && !end) return today >= start;
    if (!start && end) return today <= end;

    return false;
  };

  const isTripUpcoming = (trip: Trip): boolean => {
    if (!trip.startDate) return false;

    const today = new Date();
    const start = new Date(trip.startDate);

    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    return start > today && !isTripOngoing(trip);
  };

  const isTripPast = (trip: Trip): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (trip.endDate) {
      const end = new Date(trip.endDate);
      end.setHours(0, 0, 0, 0);
      return end < today;
    }

    if (trip.startDate) {
      const start = new Date(trip.startDate);
      start.setHours(0, 0, 0, 0);
      return start < today && !isTripOngoing(trip);
    }

    return false;
  };

  const ongoingTrips = trips.filter(isTripOngoing);
  const upcomingTrips = trips.filter(isTripUpcoming);
  const pastTrips = trips.filter(isTripPast);

  const sortedPastTrips = [...pastTrips].sort((a, b) => {
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;

    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
  });

  const sortedUpcomingTrips = [...upcomingTrips].sort((a, b) => {
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;

    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const currentTrip = ongoingTrips.length > 0 ? ongoingTrips[0] : null;

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-200" />
          <div className="w-32 h-4 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div>
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold">Sign in to see your trips</h2>
          <p className="text-slate-600">
            Track your adventures and relive your journeys.
          </p>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div>
          <div className="text-6xl mb-4">🌍</div>
          <h2 className="text-2xl font-bold mb-2">Your adventures start here</h2>
          <p className="text-slate-600 mb-6">
            Track your trips and relive your journeys.
          </p>

          <button
            onClick={onCreateTrip}
            className="px-6 py-3 bg-[#2A7FFF] text-white font-semibold rounded-full hover:bg-[#1a6ee8]"
          >
            Create your first trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {currentTrip && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3">
            Current Trip
          </h2>

          <Link href={`/trips/${currentTrip.id}`}>
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={getTripCover(currentTrip)}
                alt={currentTrip.title}
                fill
                priority
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute bottom-0 p-6 text-white">
                <h3 className="text-3xl font-bold">{currentTrip.title}</h3>
                <p className="text-white/80">{getTripSummary(currentTrip)}</p>
                {currentTrip.startDate && (
                  <p className="mt-2 text-sm">
                    Day {getCurrentDay(currentTrip)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      {sortedUpcomingTrips.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Upcoming Trips</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedUpcomingTrips.map((trip, index) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="group block">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md mb-2">
                  <Image
                    src={getTripCover(trip)}
                    alt={trip.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority={index < 4}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold text-slate-900 truncate">{trip.title}</h3>
                <p className="text-sm text-slate-500">{getDateRange(trip) || "No dates"}</p>
                <p className="text-xs text-slate-400">
                  {trip.stops.length} stops • {trip.stops.reduce((acc, s) => acc + s.media.length, 0)} photos
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sortedPastTrips.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Past Trips</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedPastTrips.map((trip, index) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="group block">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md mb-2">
                  <Image
                    src={getTripCover(trip)}
                    alt={trip.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority={index < 4}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold text-slate-900 truncate">{trip.title}</h3>
                <p className="text-sm text-slate-500">{getDateRange(trip) || "No dates"}</p>
                <p className="text-xs text-slate-400">
                  {trip.stops.length} stops • {trip.stops.reduce((acc, s) => acc + s.media.length, 0)} photos
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
