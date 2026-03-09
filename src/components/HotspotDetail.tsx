"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hotspot } from "@/types/hotspot";
import ReviewsSection from "./ReviewsSection";
import { useAuth } from "@/context/AuthContext";
import { fetchHotspotMedia } from "@/lib/services/hotspotMedia";
import {
  fetchHotspotReactionState,
  toggleHotspotLike,
  toggleHotspotSave,
} from "@/lib/services/hotspotSocial";
import GalleryCarousel from "./GalleryCarousel";

interface Props {
  hotspot: Hotspot | null;
  onVisit?: (id: string) => void;
  onWishlist?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onAddToTrip?: (hotspot: Hotspot) => void;
  onClose?: () => void;
  isVisited?: boolean;
  isWishlist?: boolean;
  isFavorite?: boolean;
}

type DetailTab = "overview" | "plan" | "reviews";

export default function HotspotDetail({
  hotspot,
  onVisit,
  onWishlist,
  onFavorite,
  onAddToTrip,
  onClose,
  isVisited,
  isWishlist,
  isFavorite,
}: Props) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [likedByMe, setLikedByMe] = useState(false);
  const [savedByMe, setSavedByMe] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [actionMessage, setActionMessage] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!hotspot) return;

    let active = true;

    const loadMediaAndReactions = async () => {
      const [media, reactions] = await Promise.all([
        fetchHotspotMedia({ hotspotId: hotspot.id, userId: user?.id ?? null, limit: 8 }),
        user?.id
          ? fetchHotspotReactionState(user.id, hotspot.id)
          : Promise.resolve({ liked: false, saved: false }),
      ]);

      if (!active) return;

      const uploaded = media.map((item) => item.signedUrl);
      const merged = Array.from(new Set([...(uploaded ?? []), ...(hotspot.images ?? [])]));
      setGalleryImages(merged);
      setLikedByMe(reactions.liked);
      setSavedByMe(reactions.saved);
      setLikesCount(hotspot.likes_count ?? 0);
      setSavesCount(hotspot.saves_count ?? 0);
      setActionMessage("");
    };

    void loadMediaAndReactions();

    return () => {
      active = false;
    };
  }, [hotspot, user?.id]);

  if (!hotspot) return null;

  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${hotspot.latitude},${hotspot.longitude}`;

  // Fallback image if no images available
  const fallbackImage = hotspot?.images && hotspot.images.length > 0 
    ? hotspot.images 
    : ["https://images.unsplash.com/photo-1469474968028-56623f02e42e"];

  const shareHotspot = async () => {
    const text = `${hotspot.name} - ${hotspot.category} in ${hotspot.province}`;
    const url = routeUrl;

    if (navigator.share) {
      await navigator.share({ title: hotspot.name, text, url });
      return;
    }

    await navigator.clipboard.writeText(`${text}\n${url}`);
  };

  const handleLike = async () => {
    if (!user) {
      setActionMessage("Login required.");
      return;
    }

    const next = await toggleHotspotLike({
      userId: user.id,
      hotspotId: hotspot.id,
      hotspotName: hotspot.name,
    });

    setLikedByMe(next);
    setLikesCount((prev) => Math.max(prev + (next ? 1 : -1), 0));
  };

  const handleSave = async () => {
    if (!user) {
      setActionMessage("Login required.");
      return;
    }

    const next = await toggleHotspotSave({
      userId: user.id,
      hotspotId: hotspot.id,
      hotspotName: hotspot.name,
    });

    setSavedByMe(next);
    setSavesCount((prev) => Math.max(prev + (next ? 1 : -1), 0));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Hero Carousel */}
      <div className="relative w-full">
        <GalleryCarousel
          images={galleryImages.length > 0 ? galleryImages : fallbackImage}
          alt={hotspot.name}
          aspectRatio="16/9"
          showCounter={true}
          showArrows={true}
          className="rounded-t-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        <div className="absolute top-3 right-3">
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close detail panel"
              className="rounded-full bg-black/50 text-white px-3 py-1.5 text-sm"
            >
              Close
            </button>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-bold text-white leading-tight">{hotspot.name}</h2>
          <p className="text-sm text-white/85 mt-1">
            {hotspot.category} - {hotspot.province}
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onVisit?.(hotspot.id)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              isVisited ? "bg-emerald-100 text-emerald-800" : "bg-emerald-600 text-white"
            }`}
          >
            {isVisited ? "Visited" : "Mark visited"}
          </button>

          <button
            onClick={() => onAddToTrip?.(hotspot)}
            className="rounded-xl px-3 py-2 text-sm font-semibold border border-slate-200 bg-slate-50 text-slate-800"
          >
            Add to trip
          </button>

          <button
            onClick={handleLike}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              likedByMe ? "bg-rose-100 text-rose-800" : "bg-slate-900 text-white"
            }`}
          >
            {likedByMe ? "Liked" : "Like"} ({likesCount})
          </button>

          <button
            onClick={handleSave}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              savedByMe ? "bg-amber-100 text-amber-800" : "bg-amber-400 text-slate-900"
            }`}
          >
            {savedByMe ? "Saved" : "Save"} ({savesCount})
          </button>

          <button
            onClick={() => onWishlist?.(hotspot.id)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              isWishlist ? "bg-amber-100 text-amber-800" : "bg-amber-400 text-slate-900"
            }`}
          >
            {isWishlist ? "In wishlist" : "Wishlist"}
          </button>

          <button
            onClick={() => onFavorite?.(hotspot.id)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              isFavorite ? "bg-fuchsia-100 text-fuchsia-800" : "bg-fuchsia-600 text-white"
            }`}
          >
            {isFavorite ? "Favorited" : "Favorite"}
          </button>
        </div>

        {actionMessage && <p className="text-xs text-slate-600">{actionMessage}</p>}

        <div className="mt-1 grid grid-cols-3 gap-2">
          <button
            onClick={() => window.open(routeUrl, "_blank", "noopener,noreferrer")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            Open route
          </button>
          <button
            onClick={shareHotspot}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            Share
          </button>
          <button
            onClick={() => router.push(`/hotspots/${hotspot.id}`)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            More info
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {[
            { id: "overview", label: "Overview" },
            { id: "plan", label: "Plan" },
            { id: "reviews", label: "Reviews" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DetailTab)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-700">
              {hotspot.description || "No description yet. Visit and add your own story."}
            </p>

            <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700 space-y-1">
              <p>
                <span className="font-semibold">Category:</span> {hotspot.category}
              </p>
              <p>
                <span className="font-semibold">Province:</span> {hotspot.province}
              </p>
              <p>
                <span className="font-semibold">Coordinates:</span> {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        )}

        {activeTab === "plan" && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="font-semibold text-slate-900">Visit planning</p>
              <p>
                Best for: {hotspot.category} lovers exploring {hotspot.province}.
              </p>
              <p>
                Opening hours: {hotspot.opening_hours || "Not provided"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="font-semibold text-slate-900">Combine this with</p>
              {hotspot.combine_with?.length ? (
                <ul className="list-disc pl-5 space-y-1">
                  {hotspot.combine_with.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No suggested combos yet.</p>
              )}
            </div>

            <button
              onClick={() => onAddToTrip?.(hotspot)}
              className="w-full rounded-xl bg-emerald-600 text-white py-2.5 font-semibold"
            >
              Add this stop to a trip
            </button>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Help others discover better spots by adding real feedback.
            </p>
            <ReviewsSection hotspotId={hotspot.id} />
          </div>
        )}
      </div>
    </div>
  );
}

