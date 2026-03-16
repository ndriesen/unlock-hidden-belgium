import { supabase } from "@/lib/Supabase/browser-client";
import type { Trip, TripMedia, TripStop, TripCreator } from "@/types/trip";
import { mapTripMediaByStop } from "@/lib/services/tripBuilder";

export async function fetchPublicTrip(tripId: string): Promise<Trip | null> {
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id || null;

  const { data: tripData, error } = await supabase    .from("trips")    .select(`      *,      users:created_by(id, username, avatar_url),      trip_stops!inner(*,hotspots(id, name, province, category, latitude, longitude)),      trip_media (*)    `)    .eq("id", tripId)    .eq("visibility", "public")    .single();

  if (error || !tripData) {
    console.error('fetchPublicTrip error:', error);
    return null;
  }

  const tripRow = tripData as any;
  const rawStops = tripRow.trip_stops || [];
  const rawMedia = tripRow.trip_media || [];

  // Construct public URLs using Supabase SDK
  const publicUrls = rawMedia.map((m: any) => {
    const { data } = supabase.storage.from('spotly-media').getPublicUrl(m.storage_path);
    return data.publicUrl;
  });

  // Construct media objects with public URLs
  const signedMedia: TripMedia[] = rawMedia.map((m: any, index: number) => ({
    id: m.id,
    tripId: m.trip_id,
    tripStopId: m.trip_stop_id,
    hotspotId: m.hotspot_id,
    storagePath: m.storage_path,
    signedUrl: publicUrls[index] || '',
    caption: m.caption,
    visibility: m.visibility,
    isHighlight: m.is_highlight || false,
    createdAt: m.created_at,
  }));

  const stopRows = rawStops.map((s: any) => ({
    id: s.id,
    trip_id: s.trip_id,
    hotspot_id: s.hotspot_id,
    stop_order: s.stop_order,
    name: s.name || s.hotspots?.name || 'Unnamed Stop',
    province: s.hotspots?.province || s.province || '',
    category: s.hotspots?.category || s.category || '',
    lat: Number(s.hotspots?.latitude) || Number(s.lat) || 50.85,
    lng: Number(s.hotspots?.longitude) || Number(s.lng) || 4.37,
    note: s.note || "",
    added_at: s.added_at,
    visited_at: s.visited_at || null,
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
  let coverImageUrl = '';
  if (coverImagePath) {
    const { data } = supabase.storage.from('spotly-media').getPublicUrl(coverImagePath);
    coverImageUrl = data.publicUrl;
  }

  const likedByMe = userId ? await supabase.from('trip_likes').select('trip_id').eq('trip_id', tripId).eq('user_id', userId).single().then(r => !!r.data) : false;
  const savedByMe = userId ? await supabase.from('trip_saves').select('trip_id').eq('trip_id', tripId).eq('user_id', userId).single().then(r => !!r.data) : false;

  const creator: TripCreator | undefined = tripRow.users ? {
    id: tripRow.users.id,
display_name: tripRow.users.username || 'Anonymous traveler',
    username: tripRow.users.username,
    avatar_url: tripRow.users.avatar_url,
  } : undefined;

  return {
    id: tripRow.id,
    title: tripRow.title || 'Untitled Trip',
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

