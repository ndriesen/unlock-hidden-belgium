import { Hotspot } from "@/types/hotspot";
import { supabase } from "@/lib/Supabase/browser-client";
import {
  createSignedMediaUrl,
  MediaVisibility,
  normalizeCaption,
  uploadImageToMediaBucket,
} from "@/lib/services/media";
import { recordActivity } from "@/lib/services/activity";

interface TripRow {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  visibility: "private" | "friends" | "public";
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number | null;
  saves_count: number | null;
  views_count: number | null;
}

interface TripStopRow {
  id: string;
  trip_id: string;
  hotspot_id: string | null;
  stop_order: number;
  name: string;
  province: string;
  category: string;
  lat: number;
  lng: number;
  note: string;
  added_at: string;
  visited_at: string | null;
}

interface TripMediaRow {
  id: string;
  trip_id: string;
  trip_stop_id: string | null;
  hotspot_id: string | null;
  storage_path: string;
  caption: string;
  visibility: MediaVisibility;
  is_highlight: boolean;
  created_at: string;
}

interface TripReactionRow {
  trip_id: string;
}

export interface TripMedia {
  id: string;
  tripId: string;
  tripStopId: string | null;
  hotspotId: string | null;
  storagePath: string;
  signedUrl: string;
  caption: string;
  visibility: MediaVisibility;
  isHighlight: boolean;
  createdAt: string;
}

export interface TripStop {
  id: string;
  hotspotId: string;
  name: string;
  province: string;
  category: string;
  lat: number;
  lng: number;
  note: string;
  photoUrl: string;
  addedAt: string;
  visitedAt: string | null;
  media: TripMedia[];
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: "private" | "friends" | "public";
  coverImage: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  savesCount: number;
  viewsCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  stops: TripStop[];
}

export function buildTripShareText(trip: Trip): string {
  const header = `${trip.title} (${trip.stops.length} stops)`;
  const lines = trip.stops.map(
    (stop, index) => `${index + 1}. ${stop.name} - ${stop.province} (${stop.category})`
  );

  return [header, ...lines].join("\n");
}

function mapTripMediaByStop(media: TripMedia[]): Map<string, TripMedia[]> {
  const map = new Map<string, TripMedia[]>();

  media.forEach((item) => {
    if (!item.tripStopId) return;

    const current = map.get(item.tripStopId) ?? [];
    current.push(item);
    map.set(item.tripStopId, current);
  });

  map.forEach((items, key) => {
    map.set(
      key,
      [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  });

  return map;
}

function mapTripRows(
  trips: TripRow[],
  stopRows: TripStopRow[],
  media: TripMedia[],
  likedByMe: Set<string>,
  savedByMe: Set<string>
): Trip[] {
  const stopsByTrip = new Map<string, TripStopRow[]>();

  stopRows.forEach((stop) => {
    const current = stopsByTrip.get(stop.trip_id) ?? [];
    current.push(stop);
    stopsByTrip.set(stop.trip_id, current);
  });

  stopsByTrip.forEach((items, key) => {
    stopsByTrip.set(
      key,
      [...items].sort((a, b) => a.stop_order - b.stop_order)
    );
  });

  const mediaByStop = mapTripMediaByStop(media);

  return trips.map((trip) => {
    const stopItems = (stopsByTrip.get(trip.id) ?? []).map((stop) => {
      const stopMedia = mediaByStop.get(stop.id) ?? [];

      return {
        id: stop.id,
        hotspotId: stop.hotspot_id ?? "",
        name: stop.name,
        province: stop.province,
        category: stop.category,
        lat: Number(stop.lat),
        lng: Number(stop.lng),
        note: stop.note ?? "",
        photoUrl: stopMedia[0]?.signedUrl ?? "",
        addedAt: stop.added_at,
        visitedAt: stop.visited_at ?? null,
        media: stopMedia,
      };
    });

    return {
      id: trip.id,
      title: trip.title,
      description: trip.description ?? "",
      startDate: trip.start_date ?? "",
      endDate: trip.end_date ?? "",
      visibility: trip.visibility,
      coverImage: trip.cover_image ?? "",
      createdAt: trip.created_at,
      updatedAt: trip.updated_at,
      likesCount: trip.likes_count ?? 0,
      savesCount: trip.saves_count ?? 0,
      viewsCount: trip.views_count ?? 0,
      likedByMe: likedByMe.has(trip.id),
      savedByMe: savedByMe.has(trip.id),
      stops: stopItems,
    };
  });
}

async function fetchTripMedia(tripIds: string[]): Promise<TripMedia[]> {
  if (!tripIds.length) return [];

  // First try to fetch with is_highlight column (if migration was run)
  const { data, error } = await supabase
    .from("trip_media")
    .select("id,trip_id,trip_stop_id,hotspot_id,storage_path,caption,visibility,is_highlight,created_at")
    .in("trip_id", tripIds)
    .order("created_at", { ascending: false });

  if (error || !data) {
    // Fallback: try without is_highlight if the column doesn't exist
    console.log("fetchTripMedia: trying without is_highlight", error);
    const fallbackResult = await supabase
      .from("trip_media")
      .select("id,trip_id,trip_stop_id,hotspot_id,storage_path,caption,visibility,created_at")
      .in("trip_id", tripIds)
      .order("created_at", { ascending: false });
    
    if (fallbackResult.error || !fallbackResult.data) {
      return [];
    }
    
    const rows = fallbackResult.data;
    const signedUrls = await Promise.all(
      rows.map((row) => createSignedMediaUrl(row.storage_path))
    );

    return rows
      .map((row, index) => {
        const signedUrl = signedUrls[index];
        if (!signedUrl) return null;

        return {
          id: row.id,
          tripId: row.trip_id,
          tripStopId: row.trip_stop_id,
          hotspotId: row.hotspot_id,
          storagePath: row.storage_path,
          signedUrl,
          caption: row.caption,
          visibility: row.visibility,
          isHighlight: false,
          createdAt: row.created_at,
        };
      })
      .filter((item): item is TripMedia => item !== null);
  }

  const rows = data;

  const signedUrls = await Promise.all(
    rows.map((row) => createSignedMediaUrl(row.storage_path))
  );

  return rows
    .map((row, index) => {
      const signedUrl = signedUrls[index];
      if (!signedUrl) return null;

      return {
        id: row.id,
        tripId: row.trip_id,
        tripStopId: row.trip_stop_id,
        hotspotId: row.hotspot_id,
        storagePath: row.storage_path,
        signedUrl,
        caption: row.caption,
        visibility: row.visibility,
        isHighlight: (row as any).is_highlight ?? false,
        createdAt: row.created_at,
      };
    })
    .filter((item): item is TripMedia => item !== null);
}

export async function fetchTrips(userId: string): Promise<Trip[]> {
  // First, get trips created by this user
  console.log("fetchTrips called with userId:", userId);
  
  const { data: tripData, error: tripsError } = await supabase
    .from("trips")
    .select("id,title,description,start_date,end_date,visibility,cover_image,created_at,updated_at,likes_count,saves_count,views_count")
    .eq("created_by", userId)
    .order("updated_at", { ascending: false });

  if (tripsError) {
    console.error("Error fetching trips:", JSON.stringify(tripsError, null, 2));
    return [];
  }

  if (!tripData) {
    console.log("No trip data returned for userId:", userId);
    return [];
  }

  console.log("Trips fetched successfully:", tripData.length, "trips");

  const trips = tripData as TripRow[];
  const tripIds = trips.map((trip) => trip.id);

  if (!tripIds.length) {
    console.log("No trip IDs found for userId:", userId);
    return [];
  }

  console.log("Fetching stops for trip IDs:", tripIds);

  const [stopResult, media, likesResult, savesResult] = await Promise.all([
    // Fetch stops with explicit trip_id filter for ownership
    supabase
      .from("trip_stops")
      .select("id,trip_id,hotspot_id,stop_order,name,province,category,lat,lng,note,added_at,visited_at")
      .in("trip_id", tripIds)
      .order("stop_order", { ascending: true }),
    fetchTripMedia(tripIds),
    supabase
      .from("trip_likes")
      .select("trip_id")
      .eq("user_id", userId)
      .in("trip_id", tripIds),
    supabase
      .from("trip_saves")
      .select("trip_id")
      .eq("user_id", userId)
      .in("trip_id", tripIds),
  ]);

  if (stopResult.error) {
    console.error("Error fetching trip stops:", JSON.stringify(stopResult.error, null, 2));
    console.log("Stop result data:", stopResult.data);
  }

  // Log debug info for RLS troubleshooting
  // Note: Even with RLS errors, data might be null or empty
  if ((stopResult.error || !stopResult.data) && tripIds.length > 0) {
    console.warn("No stops found for trips. This might be an RLS issue. Trip IDs:", tripIds);
  }

  const stopRows = (stopResult.data ?? []) as TripStopRow[];
  const likedByMe = new Set(
    ((likesResult.data ?? []) as TripReactionRow[]).map((row) => row.trip_id)
  );
  const savedByMe = new Set(
    ((savesResult.data ?? []) as TripReactionRow[]).map((row) => row.trip_id)
  );

  return mapTripRows(trips, stopRows, media, likedByMe, savedByMe);
}

export async function createTrip(params: {
  userId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  visibility?: "private" | "friends" | "public";
}): Promise<Trip | null> {
  const cleanTitle = params.title.trim();
  if (!cleanTitle) return null;

  const { data, error } = await supabase
    .from("trips")
    .insert({
      created_by: params.userId,
      title: cleanTitle,
      description: (params.description ?? "").trim().slice(0, 600),
      start_date: params.startDate || null,
      end_date: params.endDate || null,
      visibility: params.visibility ?? "private",
    })
    .select("id,title,description,start_date,end_date,visibility,cover_image,created_at,updated_at,likes_count,saves_count,views_count")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  await recordActivity({
    actorId: params.userId,
    activityType: "trip_created",
    entityType: "trip",
    entityId: data.id,
    message: `created trip ${cleanTitle}`,
    metadata: { title: cleanTitle },
    visibility: "friends",
  });

  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "",
    startDate: data.start_date ?? "",
    endDate: data.end_date ?? "",
    visibility: data.visibility,
    coverImage: data.cover_image ?? "",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    likesCount: data.likes_count ?? 0,
    savesCount: data.saves_count ?? 0,
    viewsCount: data.views_count ?? 0,
    likedByMe: false,
    savedByMe: false,
    stops: [],
  };
}

export async function updateTripMeta(params: {
  tripId: string;
  userId: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  visibility?: "private" | "friends" | "public";
  coverImage?: string;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof params.title === "string") payload.title = params.title.trim().slice(0, 120);
  if (typeof params.description === "string") payload.description = params.description.trim().slice(0, 600);
  if (typeof params.startDate === "string") payload.start_date = params.startDate || null;
  if (typeof params.endDate === "string") payload.end_date = params.endDate || null;
  if (typeof params.visibility === "string") payload.visibility = params.visibility;
  if (typeof params.coverImage === "string") payload.cover_image = params.coverImage;

  await supabase
    .from("trips")
    .update(payload)
    .eq("id", params.tripId)
    .eq("created_by", params.userId);
}

export async function removeTrip(tripId: string, userId: string): Promise<void> {
  await supabase.from("trips").delete().eq("id", tripId).eq("created_by", userId);
}

async function nextStopOrder(tripId: string): Promise<number> {
  const { data } = await supabase
    .from("trip_stops")
    .select("stop_order")
    .eq("trip_id", tripId)
    .order("stop_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data as { stop_order?: number } | null)?.stop_order ?? 0) + 1;
}

export async function addHotspotToTrip(params: {
  tripId: string;
  hotspot: Hotspot;
}): Promise<void> {
  const hotspotId = params.hotspot.id;

  const { data: existing } = await supabase
    .from("trip_stops")
    .select("id")
    .eq("trip_id", params.tripId)
    .eq("hotspot_id", hotspotId)
    .maybeSingle();

  if (existing) {
    return;
  }

  const order = await nextStopOrder(params.tripId);

  // Use latitude/longitude or fallback to lat/lng
  const lat = params.hotspot.latitude ?? params.hotspot.lat ?? 0;
  const lng = params.hotspot.longitude ?? params.hotspot.lng ?? 0;

  await supabase.from("trip_stops").insert({
    trip_id: params.tripId,
    hotspot_id: hotspotId,
    stop_order: order,
    name: params.hotspot.name,
    province: params.hotspot.province,
    category: params.hotspot.category,
    lat: lat,
    lng: lng,
    note: "",
  });
}

export async function removeStopFromTrip(tripId: string, stopId: string): Promise<void> {
  await supabase
    .from("trip_stops")
    .delete()
    .eq("id", stopId)
    .eq("trip_id", tripId);
}

export async function updateStopNote(tripId: string, stopId: string, note: string): Promise<void> {
  await supabase
    .from("trip_stops")
    .update({ note: note.trim().slice(0, 500) })
    .eq("id", stopId)
    .eq("trip_id", tripId);
}

export async function updateStopVisitedAt(tripId: string, stopId: string, visitedAt: string | null): Promise<void> {
  await supabase
    .from("trip_stops")
    .update({ visited_at: visitedAt })
    .eq("id", stopId)
    .eq("trip_id", tripId);
}

async function ensureQuickTrip(userId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("trips")
    .select("id")
    .eq("created_by", userId)
    .eq("title", "Quick Ideas")
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const created = await createTrip({
    userId,
    title: "Quick Ideas",
    description: "Fast list of hotspots to explore next.",
    visibility: "private",
  });

  return created?.id ?? null;
}

export async function addHotspotToQuickTrip(userId: string, hotspot: Hotspot): Promise<void> {
  const quickTripId = await ensureQuickTrip(userId);
  if (!quickTripId) return;

  await addHotspotToTrip({
    tripId: quickTripId,
    hotspot,
  });
}

async function toggleTripReaction(params: {
  table: "trip_likes" | "trip_saves";
  tripId: string;
  userId: string;
}): Promise<boolean> {
  const { data: existing } = await supabase
    .from(params.table)
    .select("trip_id")
    .eq("trip_id", params.tripId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from(params.table)
      .delete()
      .eq("trip_id", params.tripId)
      .eq("user_id", params.userId);

    return false;
  }

  await supabase.from(params.table).insert({
    trip_id: params.tripId,
    user_id: params.userId,
  });

  return true;
}

export async function toggleTripLike(params: {
  tripId: string;
  userId: string;
  tripTitle: string;
}): Promise<boolean> {
  const liked = await toggleTripReaction({
    table: "trip_likes",
    tripId: params.tripId,
    userId: params.userId,
  });

  if (liked) {
    await recordActivity({
      actorId: params.userId,
      activityType: "trip_liked",
      entityType: "trip",
      entityId: params.tripId,
      message: `liked trip ${params.tripTitle}`,
      metadata: { tripTitle: params.tripTitle },
      visibility: "friends",
    });
  }

  return liked;
}

export async function toggleTripSave(params: {
  tripId: string;
  userId: string;
  tripTitle: string;
}): Promise<boolean> {
  const saved = await toggleTripReaction({
    table: "trip_saves",
    tripId: params.tripId,
    userId: params.userId,
  });

  if (saved) {
    await recordActivity({
      actorId: params.userId,
      activityType: "trip_saved",
      entityType: "trip",
      entityId: params.tripId,
      message: `saved trip ${params.tripTitle}`,
      metadata: { tripTitle: params.tripTitle },
      visibility: "friends",
    });
  }

  return saved;
}

export async function uploadTripStopPhoto(params: {
  userId: string;
  tripId: string;
  stopId: string;
  hotspotId: string;
  file: File;
  caption: string;
  visibility: MediaVisibility;
}): Promise<{ success: boolean; message: string }> {
  const upload = await uploadImageToMediaBucket({
    userId: params.userId,
    scope: "trips",
    refId: `${params.tripId}_${params.stopId}`,
    file: params.file,
  });

  if (upload.error || !upload.storagePath) {
    return { success: false, message: upload.error ?? "Upload failed." };
  }

  const cleanCaption = normalizeCaption(params.caption);

  const { error } = await supabase.from("trip_media").insert({
    trip_id: params.tripId,
    trip_stop_id: params.stopId,
    hotspot_id: params.hotspotId || null,
    uploaded_by: params.userId,
    storage_path: upload.storagePath,
    caption: cleanCaption,
    visibility: params.visibility,
  });

  if (error) {
    return { success: false, message: "Photo metadata could not be saved." };
  }

  if (params.hotspotId) {
    const { count } = await supabase
      .from("hotspot_media")
      .select("id", { count: "exact", head: true })
      .eq("hotspot_id", params.hotspotId)
      .eq("uploaded_by", params.userId);

    await supabase.from("hotspot_media").insert({
      hotspot_id: params.hotspotId,
      trip_id: params.tripId,
      trip_stop_id: params.stopId,
      uploaded_by: params.userId,
      storage_path: upload.storagePath,
      caption: cleanCaption,
      visibility: params.visibility,
      is_primary: (count ?? 0) === 0,
    });
  }

  await recordActivity({
    actorId: params.userId,
    activityType: "trip_photo_added",
    entityType: "trip",
    entityId: params.tripId,
    message: "added a new trip photo",
    metadata: {
      tripId: params.tripId,
      stopId: params.stopId,
      hotspotId: params.hotspotId,
    },
    visibility: params.visibility === "private" ? "private" : "friends",
  });

  return { success: true, message: "Photo uploaded." };
}

export async function setTripCoverImage(params: {
  tripId: string;
  userId: string;
  storagePath: string;
}): Promise<{ success: boolean; message: string }> {
  // First, get a signed URL for the cover image
  const signedUrl = await createSignedMediaUrl(params.storagePath);
  if (!signedUrl) {
    return { success: false, message: "Could not create cover image URL." };
  }

  const { error } = await supabase
    .from("trips")
    .update({ cover_image: params.storagePath })
    .eq("id", params.tripId)
    .eq("created_by", params.userId);

  if (error) {
    return { success: false, message: "Could not set cover image." };
  }

  return { success: true, message: "Cover image updated." };
}

export async function toggleTripMediaHighlight(params: {
  mediaId: string;
  userId: string;
  isHighlight: boolean;
}): Promise<{ success: boolean; message: string }> {
  // First verify the user owns this media
  const { data: media, error: fetchError } = await supabase
    .from("trip_media")
    .select("uploaded_by")
    .eq("id", params.mediaId)
    .maybeSingle();

  if (fetchError || !media) {
    return { success: false, message: "Media not found." };
  }

  if (media.uploaded_by !== params.userId) {
    return { success: false, message: "Not authorized to modify this photo." };
  }

  const { error } = await supabase
    .from("trip_media")
    .update({ is_highlight: params.isHighlight })
    .eq("id", params.mediaId);

  if (error) {
    return { success: false, message: "Could not update highlight status." };
  }

  return { success: true, message: params.isHighlight ? "Added to highlights." : "Removed from highlights." };
}

