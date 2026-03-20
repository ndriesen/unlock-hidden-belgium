﻿"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import ReviewsSection from "@/components/ReviewsSection";
import GalleryCarousel from "@/components/GalleryCarousel";
import TripMemoriesGallery from "@/components/TripMemoriesGallery";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/Supabase/browser-client";
import OpeningHoursDisplay from "@/components/ui/OpeningHoursDisplay";
import { fetchHotspotMedia, fetchOrganizedHotspotMedia, uploadHotspotPhoto } from "@/lib/services/hotspotMedia";
import { toggleWishlist, markVisited } from "@/lib/services/gamification";
import { toggleHotspotLike, toggleHotspotSave, recordHotspotView } from "@/lib/services/hotspotSocial";
import { MediaVisibility } from "@/lib/services/media";
import { Hotspot, getSafeDisplay } from "@/types/hotspot";
import FloatingActionMenu from "@/components/ui/FloatingActionMenu"

const MapView = dynamic(() => import("@/components/Map/MapView"), {
  ssr: false,
}) as React.ComponentType<{
  hotspots: Hotspot[];
  loading: boolean;
  viewMode: "markers" | "heatmap";
  mapStyle: "default" | "satellite" | "retro" | "terrain";
  autoLocate?: boolean;
  autoFit?: boolean;
  enableClustering?: boolean;
}>;

interface HotspotRow {
  id: string;
  name: string;
  category: string | null;
  province: string | null;
  description: string | null;
  images: string[] | null;
  opening_hours: string | null;
  combine_with: string[] | null;
  visit_count: number | null;
  likes_count: number | null;
  saves_count: number | null;
  views_count: number | null;
  latitude: number | string | null;
  longitude: number | string | null;
}



/**
 * Safely parse images field from Supabase.
 * Handles cases where Supabase might return a stringified JSON array
 * instead of a proper array.
 */
function parseImages(images: unknown): string[] {
  if (!images) return [];

  // If it's already an array of strings
  if (Array.isArray(images)) {
    const filtered = images.filter((item): item is string => typeof item == "string");
    return filtered;
  }

  // If it's a string (stringified JSON array)
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((item): item is string => typeof item === "string");
        return filtered;
      }
    } catch {
      // Not a valid JSON string, return empty array
      return [];
    }
  }

  return [];
}

export default function HotspotDetailPage() {
  const params = useParams<{ id: string }>();
  const hotspotId = params.id;
  const { user } = useAuth();

  const [hotspot, setHotspot] = useState<Hotspot | null>(null);
  const [openingHours, setOpeningHours] = useState("");
  const [combineWith, setCombineWith] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [wishlistedByMe, setWishlistedByMe] = useState(false);
  const [likedByMe, setLikedByMe] = useState(false);
  const [savedByMe, setSavedByMe] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mapStyle, setMapStyle] = useState<"default" | "satellite" | "retro" | "terrain">("default");
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Organized media for Polarsteps-like display
  const [personalPhotos, setPersonalPhotos] = useState<{id: string; signedUrl: string; caption: string; visibility: string; createdAt: string; uploadedBy: string}[]>([]);
  const [communityPhotos, setCommunityPhotos] = useState<{id: string; signedUrl: string; caption: string; visibility: string; createdAt: string; uploadedBy: string}[]>([]);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadVisibility, setUploadVisibility] = useState<MediaVisibility>("public");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [actionMessage, setActionMessage] = useState(""); // For like/save feedback

  const handleOpenMap = useCallback(() => {
      if (!hotspot) return;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${hotspot.latitude},${hotspot.longitude}`;
      window.open(url, "_blank");
    }, [hotspot]);

  useEffect(() => {
    if (!hotspotId) return;

    const viewedKey = `hotspot-viewed-${hotspotId}`;
    const alreadyViewed = sessionStorage.getItem(viewedKey);
    if (alreadyViewed) return;

    const trackView = async () => {
      try {
        await recordHotspotView(
          user?.id ?? null,
          hotspotId,
          hotspot?.name ?? "hotspot"
        );

        sessionStorage.setItem(viewedKey, "true");
      } catch (err) {
        console.error("View tracking failed", err);
      }
    };

    trackView();
  }, [hotspotId, user?.id]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage("");
      setActionMessage(""); 

      const { data, error } = await supabase
        .from("hotspots")
        .select(
          "id,name,category,province,description,images,opening_hours,combine_with,visit_count,likes_count,saves_count,views_count,latitude,longitude"
        )
        .eq("id", hotspotId)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        setErrorMessage("Could not load hotspot details.");
        setLoading(false);
        return;
      }

      const row = data as HotspotRow;
      const latitude = Number(row.latitude);
      const longitude = Number(row.longitude);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        setErrorMessage("This hotspot has invalid coordinates.");
        setLoading(false);
        return;
      }

      const mappedHotspot: Hotspot = {
        id: row.id,
        name: row.name,
        category: row.category ?? "Unknown",
        province: row.province ?? "Unknown",
        description: row.description ?? "No description yet.",
        images: parseImages(row.images),
        opening_hours: row.opening_hours ?? undefined,
        combine_with: row.combine_with ?? undefined,
        visit_count: row.visit_count ?? 0,
        likes_count: row.likes_count ?? 0,
        saves_count: row.saves_count ?? 0,
        views_count: row.views_count ?? 0,
        latitude,
        longitude,
      };

      setHotspot(mappedHotspot);
      setOpeningHours(row.opening_hours ?? "Not provided");
      setCombineWith(row.combine_with ?? []);

      const [media, organizedMedia, reaction, likesResult, savesResult] = await Promise.all([
        fetchHotspotMedia({ hotspotId: row.id, userId: user?.id ?? null, limit: 16 }),
        fetchOrganizedHotspotMedia({ hotspotId: row.id, userId: user?.id ?? null, limit: 50 }),
        user?.id
          ? supabase
              .from("user_hotspots")
              .select("wishlist")
              .eq("user_id", user.id)
              .eq("hotspot_id", row.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        user?.id
          ? supabase
              .from("hotspot_likes")
              .select("hotspot_id")
              .eq("user_id", user.id)
              .eq("hotspot_id", row.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        user?.id
          ? supabase
              .from("hotspot_saves")
              .select("hotspot_id")
              .eq("user_id", user.id)
              .eq("hotspot_id", row.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (!active) return;

      // Build carousel: personal photos first, then community, then inspiration (database images)
      const personalUrls = organizedMedia.personal.map(p => p.signedUrl);
      const communityUrls = organizedMedia.community.map(c => c.signedUrl);
      const baseImages = parseImages(row.images); // Database filler images

      // Priority order: personal -> community -> inspiration
      const priorityUrls = [...personalUrls, ...communityUrls, ...baseImages];
      const dedup = Array.from(new Set([...priorityUrls]));

      setMediaUrls(dedup);

      // Set organized media
      setPersonalPhotos(organizedMedia.personal);
      setCommunityPhotos(organizedMedia.community);

      if (reaction?.error) {
        console.error("Failed to load wishlist/favorite state:", reaction.error);
      }

      setWishlistedByMe(Boolean(reaction?.data?.wishlist));
      setLikedByMe(Boolean(likesResult?.data));
      setSavedByMe(Boolean(savesResult?.data));
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [hotspotId, user?.id]);

  const routeUrl = useMemo(() => {
    if (!hotspot) return "#";
    return `https://www.google.com/maps/dir/?api=1&destination=${hotspot.latitude},${hotspot.longitude}`;
  }, [hotspot]);

  // Fallback image if no images available
  const fallbackImage = hotspot?.images && hotspot.images.length > 0
    ? hotspot.images
    : ["https://images.unsplash.com/photo-1469474968028-56623f02e42e"];

  const handleToggleWishlist = useCallback(async () => {
    if (!user || !hotspot) {
      setActionMessage("Login required.");
      return;
    }

    try {
      const next = await toggleWishlist(user.id, hotspot.id);
      setWishlistedByMe(next);
      setActionMessage(next ? "Added to wishlist" : "Removed from wishlist");
    } catch (error) {
      console.error("Wishlist toggle failed:", error);
      setActionMessage("Could not update wishlist.");
    }
  }, [user, hotspot]);

  const handleToggleLike = useCallback(async () => {
    if (!user || !hotspot) {
      setActionMessage("Login required.");
      return;
    }

    try {
      const next = await toggleHotspotLike({
        userId: user.id,
        hotspotId: hotspot.id,
        hotspotName: hotspot.name,
      });
      setLikedByMe(next);
      setHotspot((prev) =>
        prev
          ? {
              ...prev,
              likes_count: (prev.likes_count ?? 0) + (next ? 1 : -1),
            }
          : prev
      );
      setActionMessage(next ? "Liked" : "Unliked");
    } catch (error) {
      console.error("Like toggle failed:", error);
      setActionMessage("Could not toggle like.");
    }
  }, [user, hotspot]);

  const handleToggleSave = useCallback(async () => {
    if (!user || !hotspot) {
      setActionMessage("Login required.");
      return;
    }

    try {
      const next = await toggleHotspotSave({
        userId: user.id,
        hotspotId: hotspot.id,
        hotspotName: hotspot.name,
      });
      setSavedByMe(next);
      setHotspot((prev) =>
        prev
          ? {
              ...prev,
              saves_count: (prev.saves_count ?? 0) + (next ? 1 : -1),
            }
          : prev
      );
      setActionMessage(next ? "Saved" : "Unsaved");
    } catch (error) {
      console.error("Save toggle failed:", error);
      setActionMessage("Could not toggle save.");
    }
  }, [user, hotspot]);

  const handleMarkVisited = useCallback(async () => {
    if (!user || !hotspot) {
      setActionMessage("Login required.");
      return;
    }

    try {
      const result = await markVisited(user.id, hotspot.id);

      if (result && 'success' in result && result.reason === "already_visited") {
        setActionMessage("You already visited this place today 👀");
        return;
      }

      setHotspot((prev) =>
        prev
          ? {
              ...prev,
              visit_count: (prev.visit_count ?? 0) + 1,
            }
          : prev
      );
      setActionMessage("Marked as visited + XP earned!");
    } catch (error) {
      console.error("Visit mark failed:", error);
      setActionMessage("Could not mark visited.");
    }
  }, [user, hotspot]);

  const handleUpload = async () => {
    if (!user || !hotspot) {
      setUploadMessage("Login required.");
      return;
    }

    if (!uploadFile) {
      setUploadMessage("Select an image first.");
      return;
    }

    setUploading(true);
    setUploadMessage(""); 

    const result = await uploadHotspotPhoto({
      userId: user.id,
      hotspotId: hotspot.id,
      hotspotName: hotspot.name,
      file: uploadFile,
      caption: uploadCaption,
      visibility: uploadVisibility,
    });

    setUploading(false);
    setUploadMessage(result.message);

    if (!result.success) {
      return;
    }

    setUploadFile(null);
    setUploadCaption(""); 

    const media = await fetchHotspotMedia({
      hotspotId: hotspot.id,
      userId: user.id,
      limit: 16,
    });

    const uploaded = media.map((item) => item.signedUrl);
    const baseImages = hotspot.images ?? [];
    setMediaUrls(Array.from(new Set([...uploaded, ...baseImages])));
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading hotspot details...</p>;
  }

  if (errorMessage || !hotspot) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage || "Hotspot not found."}
        </p>
        <Link href="/hotspots" className="text-sm font-medium text-emerald-700">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Hero Carousel - shows personal photos first, then fallback to inspiration */}
        <div className="relative">
          <GalleryCarousel
            images={mediaUrls.length > 0 ? mediaUrls : fallbackImage}
            alt={hotspot.name}
            aspectRatio="16/9"
            showCounter={true}
            showArrows={true}
            onLike={handleToggleLike}
            isLiked={likedByMe}
          />

          {/* Text overlay on top of carousel */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">{hotspot.name}</h1>
            <p className="text-sm text-white/90 drop-shadow">
              {getSafeDisplay(hotspot.category)} - {hotspot.province}
            </p>
          </div>
                  <div className="absolute top-25 left-5 mt-3 flex justify-end z-[94]">
          <FloatingActionMenu
            actions={[
              {
                icon: likedByMe ? "❤️" : "🤍",
                label: likedByMe ? "Liked" : "Like",
                onClick: handleToggleLike,
                className: likedByMe
                  ? "bg-transparent text-slate-800"
                  : "bg-transparent text-slate-800",
              },
              {
                icon: savedByMe ? "⛊" : "⛉",
                label: savedByMe ? "Saved" : "Save",
                onClick: handleToggleSave,
                className: savedByMe
                  ? "bg-transparent text-slate-800"
                  : "bg-transparent text-slate-800",
              },
              {
                icon: wishlistedByMe ? "🍀" : "☘︎",
                label: wishlistedByMe ? "Wishlisted" : "Wishlist",
                onClick: handleToggleWishlist,
                className: wishlistedByMe
                  ? "bg-transparent text-slate-800"
                  : "bg-transparent text-slate-800",
              },
              {
                icon:"🌍",
                label: "Map",
                onClick: () => handleOpenMap,
                className: "bg-transparent text-slate-800",
              },
            ]}
          />
        </div>
        </div>

        <div className="absolute bottom-5 right-5 flex justify-end z-[94]">
          <FloatingActionMenu
            actions={[
              {
                icon: likedByMe ? "❤️" : "🤍",
                label: likedByMe ? "Liked" : "Like",
                onClick: handleToggleLike,
                className: likedByMe
                  ? "bg-transparent text-slate-800"
                  : "bg-transparent text-slate-800",
              },
              {
                icon: savedByMe ? "⛊" : "⛉",
                label: savedByMe ? "Saved" : "Save",
                onClick: handleToggleSave,
                className: savedByMe
                  ? "bg-transparent text-slate-800"
                  : "bg-transparent text-slate-800",
              },
              {
                icon: wishlistedByMe ? "🍀" : "☘︎",
                label: wishlistedByMe ? "Wishlisted" : "Wishlist",
                onClick: handleToggleWishlist,
                className: wishlistedByMe
                  ? "bg-transparent text-slate-800"
                  : "bg-transparent text-slate-800",
              },
              {
                icon:"🌍",
                label: "Map",
                onClick: () => handleOpenMap,
                className: "bg-transparent text-slate-800",
              },
            ]}
          />
        </div>

        <section className="bg-white rounded-2xl p-6 border border-slate-100">

        
        {/* Stats */}
        <div className="flex justify-center items-center gap-6 text-sm text-slate-500 mb-6">
          <span>📍 {hotspot.province}</span>
          <span className="w-px h-5 bg-slate-300" />
          <span>❤️ {hotspot.likes_count ?? 0}</span>
          <span className="w-px h-5 bg-slate-300" />
          <span>👁 {hotspot.views_count ?? 0}</span>
        </div>

        {/* Description */}
        <div className="mb-6 leading-relaxed">
          <p className={`prose prose-slate max-w-prose line-clamp-3 md:line-clamp-none ${showFullDesc ? 'max-h-none' : ''}`}>
            {hotspot.description}
          </p>
          {hotspot.description && hotspot.description.length > 200 && (
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="mt-4 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors text-sm flex items-center gap-1"
            >
              {showFullDesc ? 'Read less' : 'Read more'} 
              <span className={`w-4 h-4 transition-transform ${showFullDesc ? 'rotate-180' : ''}`}>▼</span>
            </button>
          )}
        </div>
      </section>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-700">{hotspot.description}</p>

          <div className="grid gap-2 grid-cols-2 md:grid-cols-5 text-sm">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Visits</p>
              <p className="font-semibold text-slate-900">{hotspot.visit_count ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Likes</p>
              <p className="font-semibold text-slate-900">{hotspot.likes_count ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Saves</p>
              <p className="font-semibold text-slate-900">{hotspot.saves_count ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Views</p>
              <p className="font-semibold text-slate-900">{hotspot.views_count ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Coordinates</p>
              <p className="font-semibold text-slate-900">
                {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
              </p>
            </div>
          </div>

          {combineWith.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">Combine this with</p>
              <p className="mt-1 text-sm text-slate-700">{combineWith.join(" - ")}</p>
            </div>
          )}



          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleToggleSave}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                savedByMe ? "bg-amber-100 text-amber-700" : "bg-slate-900 text-white"
              }`}
            >
              💾 {savedByMe ? "Saved" : "Save"}
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                wishlistedByMe ? "bg-amber-100 text-amber-700" : "bg-slate-900 text-white"
              }`}
            >
              <span aria-hidden="true" className="text-[16px] leading-none">⟟</span> {wishlistedByMe ? "Wishlisted" : "Wishlist"}
            </button>
          </div>

          <button
            onClick={handleMarkVisited}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold ${
              wishlistedByMe 
                ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
            }`}
          >
            ✓ Mark as visited (+XP)
          </button>

          <div id="upload-section" className="rounded-2xl border border-slate-200 p-3 space-y-2">
            <p className="text-sm font-semibold text-slate-900">Add your photo</p>
            <div className="grid gap-2 md:grid-cols-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={uploadCaption}
                onChange={(event) => setUploadCaption(event.target.value)}
                placeholder="Caption"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={uploadVisibility}
                onChange={(event) => setUploadVisibility(event.target.value as MediaVisibility)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="private">Private</option>
                <option value="friends">Friends</option>
                <option value="public">Public</option>
              </select>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {uploadMessage && <p className="text-xs text-slate-600">{uploadMessage}</p>}
          </div>
        </div>
      </section>

      {/* Polarsteps-style Photo Gallery - Personal photos only with toggle */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Trip Memories</h2>
        <TripMemoriesGallery
          personal={personalPhotos}
          community={communityPhotos}
          inspiration={hotspot.images ?? []}
          currentUserId={user?.id}
          hotspotName={hotspot.name}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Map</h2>
          <select
            value={mapStyle}
            onChange={(event) =>
              setMapStyle(event.target.value as "default" | "satellite" | "retro" | "terrain")
            }
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
          >
            <option value="default">Default</option>
            <option value="satellite">Satellite</option>
            <option value="retro">Retro</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>
        <div className="h-[44vh] min-h-[18rem] overflow-hidden rounded-2xl border border-slate-200">
          <MapView
            hotspots={[hotspot]}
            loading={false}
            viewMode="markers"
            mapStyle={mapStyle}
            autoLocate={false}
            autoFit
            enableClustering={false}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Reviews</h2>
        <ReviewsSection hotspotId={hotspot.id} />
      </section>

      {actionMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm mx-4">
          <p className="bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm animate-fade-in">
            {actionMessage}
          </p>
        </div>
      )}
    </div>
  );
}
