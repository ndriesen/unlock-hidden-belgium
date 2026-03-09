"use client";

import Image from "next/image";

interface TripHeroProps {
  trip: {
    title: string;
    startDate: string;
    endDate: string;
    visibility: string;
    stops: { media: { signedUrl: string }[] }[];
  };
  coverImage?: string;
}

export default function TripHero({ trip, coverImage }: TripHeroProps) {
  // Get cover image priority: cover_photo → first memory photo → fallback
  const getHeroImage = () => {
    if (coverImage) return coverImage;
    // Check first stop's media
    for (const stop of trip.stops) {
      if (stop.media.length > 0) {
        return stop.media[0].signedUrl;
      }
    }
    return "https://images.unsplash.com/photo-1469474968028-56623f02e42e";
  };

  const heroImage = getHeroImage();

  // Calculate progress
  const totalMemories = trip.stops.reduce((acc, stop) => acc + stop.media.length, 0);
  const progress = trip.stops.length > 0 ? (totalMemories / Math.max(trip.stops.length, 1)) * 100 : 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const dateRange = trip.startDate && trip.endDate 
    ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
    : trip.startDate 
      ? formatDate(trip.startDate)
      : "No dates set";

  return (
    <div className="relative h-[220px] w-full overflow-hidden rounded-2xl">
      <Image
        src={heroImage}
        alt={trip.title}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
      
      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">{trip.title}</h1>
            <p className="text-white/80">
              {dateRange}
              <span className="mx-2">•</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white/20 text-white capitalize">
                {trip.visibility}
              </span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/70 mb-1">
            <span>Trip progress</span>
            <span>{trip.stops.length} stops • {totalMemories} memories</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

