"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ReviewsSection from "@/components/ReviewsSection";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/Supabase/browser-client";
import { fetchHotspotMedia, uploadHotspotPhoto } from "@/lib/services/hotspotMedia";
import {
  fetchHotspotReactionState,
  toggleHotspotLike,
  toggleHotspotSave,
} from "@/lib/services/hotspotSocial";
import { MediaVisibility } from "@/lib/services/media";
import { Hotspot } from "@/types/hotspot";

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
  latitude: number | string | null;
  longitude: number | string | null;
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
  const [likedByMe, setLikedByMe] = useState(false);
  const [savedByMe, setSavedByMe] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mapStyle, setMapStyle] = useState<"default" | "satellite" | "retro" | "terrain">("default");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadVisibility, setUploadVisibility] = useState<MediaVisibility>("public");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("hotspots")
        .select(
          "id,name,category,province,description,images,opening_hours,combine_with,visit_count,likes_count,saves_count,latitude,longitude"
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
        images: row.images ?? [],
        opening_hours: row.opening_hours ?? undefined,
        combine_with: row.combine_with ?? undefined,
        visit_count: row.visit_count ?? 0,
        likes_count: row.likes_count ?? 0,
        saves_count: row.saves_count ?? 0,
        latitude,
        longitude,
      };

      setHotspot(mappedHotspot);
      setOpeningHours(row.opening_hours ?? "Not provided");
      setCombineWith(row.combine_with ?? []);

      const [media, reaction] = await Promise.all([
        fetchHotspotMedia({ hotspotId: row.id, userId: user?.id ?? null, limit: 16 }),
        user?.id ? fetchHotspotReactionState(user.id, row.id) : Promise.resolve({ liked: false, saved: false }),
      ]);

      if (!active) return;

      const uploaded = media.map((item) => item.signedUrl);
      const baseImages = row.images ?? [];
      const dedup = Array.from(new Set([...uploaded, ...baseImages]));
      setMediaUrls(dedup);
      setLikedByMe(reaction.liked);
      setSavedByMe(reaction.saved);
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

  const imageUrl =
    mediaUrls[0] ??
    hotspot?.images?.[0] ??
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e";

  const handleToggleLike = async () => {
    if (!user || !hotspot) {
      setUploadMessage("Login required.");
      return;
    }

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
            likes_count: Math.max((prev.likes_count ?? 0) + (next ? 1 : -1), 0),
          }
        : prev
    );
  };

  const handleToggleSave = async () => {
    if (!user || !hotspot) {
      setUploadMessage("Login required.");
      return;
    }

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
            saves_count: Math.max((prev.saves_count ?? 0) + (next ? 1 : -1), 0),
          }
        : prev
    );
  };

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
        <div className="relative h-72 w-full">
          <Image
            src={imageUrl}
            alt={hotspot.name}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl font-bold">{hotspot.name}</h1>
            <p className="text-sm text-white/85">
              {hotspot.category} - {hotspot.province}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-700">{hotspot.description}</p>

          <div className="grid gap-2 sm:grid-cols-5 text-sm">
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
              <p className="text-xs text-slate-500">Opening hours</p>
              <p className="font-semibold text-slate-900">{openingHours}</p>
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

          {mediaUrls.length > 1 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {mediaUrls.slice(0, 10).map((url, index) => (
                <div key={`${url}_${index}`} className="relative h-20 overflow-hidden rounded-lg">
                  <Image
                    src={url}
                    alt={`${hotspot.name} image ${index + 1}`}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleToggleLike}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                likedByMe ? "bg-rose-100 text-rose-700" : "bg-slate-900 text-white"
              }`}
            >
              {likedByMe ? "Liked" : "Like"}
            </button>
            <button
              onClick={handleToggleSave}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                savedByMe ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-900"
              }`}
            >
              {savedByMe ? "Saved" : "Save"}
            </button>
            <a
              href={routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Open route
            </a>
            <Link
              href="/hotspots"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800"
            >
              Back to Explore
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
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
    </div>
  );
}

