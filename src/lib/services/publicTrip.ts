import { supabase } from "@/lib/Supabase/browser-client";
import { createSignedMediaUrl } from "@/lib/services/media";
import { mapTripMediaByStop } from "@/lib/services/tripBuilder";
import type { Trip, TripCreator, TripMedia, TripStop } from "@/types/trip";

const PUBLIC_TRIP_URL_EXPIRY_SECONDS = 24 * 60 * 60;

export async function fetchPublicTrip(tripId: string): Promise<Trip | null> {
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id || null;

  const { data: tripData, error } = await supabase
    .from("trips")
    .select(`
      *,
      users:created_by(id, username, avatar_url),
      trip_stops!inner(*,hotspots(id, name, province, category, latitude, longitude)),
      trip_media (*)
    `)
    .eq("id", tripId)
    .eq("visibility", "public")
    .single();

  if (error || !tripData) {
    console.error("fetchPublicTrip error:", error);
    return null;
  }

  const tripRow = tripData as any;
  const rawStops = tripRow.trip_stops || [];
  const rawMedia = tripRow.trip_media || [];

  const mediaUrls = await Promise.all(
    rawMedia.map(async (media: any) => {
      if (!media.storage_path) return "";
      return (await createSignedMediaUrl(media.storage_path, PUBLIC_TRIP_URL_EXPIRY_SECONDS)) ?? "";
    })
  );

  const signedMedia: TripMedia[] = rawMedia.map((media: any, index: number) => ({
    id: media.id,
    tripId: media.trip_id,
    tripStopId: media.trip_stop_id,
    hotspotId: media.hotspot_id,
    storagePath: media.storage_path,
    signedUrl: mediaUrls[index] || "",
    caption: media.caption,
    visibility: media.visibility,
    isHighlight: media.is_highlight || false,
    createdAt: media.created_at,
  }));

  const stopRows = rawStops.map((stop: any) => ({
    id: stop.id,
    trip_id: stop.trip_id,
    hotspot_id: stop.hotspot_id,
    stop_order: stop.stop_order,
    name: stop.name || stop.hotspots?.name || "Unnamed Stop",
    province: stop.hotspots?.province || stop.province || "",
    category: stop.hotspots?.category || stop.category || "",
    lat: Number(stop.hotspots?.latitude) || Number(stop.lat) || 50.85,
    lng: Number(stop.hotspots?.longitude) || Number(stop.lng) || 4.37,
    note: stop.note || "",
    added_at: stop.added_at,
    visited_at: stop.visited_at || null,
  }));

  const mediaByStop = mapTripMediaByStop(signedMedia);

  const stops: TripStop[] = stopRows.map((stop: any) => {
    const stopMedia = mediaByStop.get(stop.id) || [];
    return {
      id: stop.id,
      hotspotId: stop.hotspot_id || "",
      name: stop.name,
      province: stop.province,
      category: stop.category,
      lat: stop.lat,
      lng: stop.lng,
      note: stop.note,
      photoUrl: stopMedia[0]?.signedUrl || "",
      addedAt: stop.added_at,
      visitedAt: stop.visited_at || null,
      media: stopMedia,
    };
  });

  const coverImagePath = tripRow.cover_image;
  const coverImageUrl = coverImagePath
    ? (await createSignedMediaUrl(coverImagePath, PUBLIC_TRIP_URL_EXPIRY_SECONDS)) ?? ""
    : "";

  const likedByMe = userId
    ? await supabase
        .from("trip_likes")
        .select("trip_id")
        .eq("trip_id", tripId)
        .eq("user_id", userId)
        .single()
        .then((result) => !!result.data)
    : false;

  const savedByMe = userId
    ? await supabase
        .from("trip_saves")
        .select("trip_id")
        .eq("trip_id", tripId)
        .eq("user_id", userId)
        .single()
        .then((result) => !!result.data)
    : false;

  const creator: TripCreator | undefined = tripRow.users
    ? {
        id: tripRow.users.id,
        display_name: tripRow.users.username || "Anonymous traveler",
        username: tripRow.users.username,
        avatar_url: tripRow.users.avatar_url,
      }
    : undefined;

  return {
    id: tripRow.id,
    title: tripRow.title || "Untitled Trip",
    description: tripRow.description || "",
    startDate: tripRow.start_date || "",
    endDate: tripRow.end_date || "",
    visibility: tripRow.visibility,
    coverImage: coverImageUrl,
    createdAt: tripRow.created_at,
    updatedAt: tripRow.updated_at,
    likesCount: Number(tripRow.likes_count) || 0,
    savesCount: Number(tripRow.saves_count) || 0,
    viewsCount: Number(tripRow.views_count) || 0,
    likedByMe,
    savedByMe,
    creator,
    stops,
  };
}