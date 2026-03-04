"use client";

import ReviewsSection from "./ReviewsSection";

interface Props {
  hotspot: any;
  onVisit?: (id: string) => void;
  onWishlist?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onClose?: () => void;
  isVisited?: boolean;
  isWishlist?: boolean;
  isFavorite?: boolean;
}

export default function HotspotDetail({
  hotspot,
  onVisit,
  onWishlist,
  onFavorite,
  onClose,
  isVisited,
  isWishlist,
  isFavorite
}: Props) {
  if (!hotspot) return null;

  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${hotspot.latitude},${hotspot.longitude}`;

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between">
        <div>
          <h2 className="text-2xl font-bold">{hotspot.name}</h2>
          <p className="text-sm text-zinc-500">
            {hotspot.category} • {hotspot.province}
          </p>
        </div>

        {onClose && (
          <button onClick={onClose}>✕</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* IMAGE CAROUSEL */}
        {hotspot.images?.length ? (
          <div className="flex gap-3 overflow-x-auto">
            {hotspot.images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                className="h-48 rounded-2xl object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        )}

        {/* DESCRIPTION */}
        {hotspot.description && (
          <p className="text-zinc-600 dark:text-zinc-300">
            {hotspot.description}
          </p>
        )}

        {/* EXTRA INFO */}
        <div className="space-y-2 text-sm text-zinc-500">
          {hotspot.opening_hours && (
            <p>🕒 {hotspot.opening_hours}</p>
          )}

          {hotspot.combine_with?.length > 0 && (
            <p>✨ Nice to combine with: {hotspot.combine_with.join(", ")}</p>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-3">

          <button
            onClick={() => onVisit?.(hotspot.id)}
            className={`w-full py-3 rounded-xl ${
              isVisited
                ? "bg-zinc-300 text-zinc-700"
                : "bg-emerald-600 text-white"
            }`}
          >
            {isVisited ? "Visited ✓" : "Mark as Visited"}
          </button>

          <button
            onClick={() => onWishlist?.(hotspot.id)}
            className="w-full py-3 rounded-xl bg-yellow-400"
          >
            {isWishlist ? "In Wishlist ✓" : "Add to Wishlist"}
          </button>

          <button
            onClick={() => onFavorite?.(hotspot.id)}
            className="w-full py-3 rounded-xl bg-purple-600 text-white"
          >
            {isFavorite ? "Favorited ✓" : "Add to Favorites"}
          </button>

          <button
            onClick={() => window.open(routeUrl, "_blank")}
            className="w-full py-3 rounded-xl bg-blue-600 text-white"
          >
            🚗 Route Calculator
          </button>
        </div>

        {/* REVIEWS */}
        <div>
          <h3 className="font-semibold mb-2">Reviews</h3>
          <ReviewsSection hotspotId={hotspot.id} />

          <button className="mt-4 w-full py-2 border rounded-xl">
            Leave a Review
          </button>
        </div>
      </div>
    </div>
  );
}