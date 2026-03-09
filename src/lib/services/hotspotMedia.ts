import { supabase } from "@/lib/Supabase/browser-client";
import {
  createSignedMediaUrl,
  MediaVisibility,
  normalizeCaption,
  uploadImageToMediaBucket,
} from "@/lib/services/media";
import { recordActivity } from "@/lib/services/activity";
import { OrganizedHotspotMedia } from "@/types/hotspot";

interface HotspotMediaRow {
  id: string;
  hotspot_id: string;
  trip_id: string | null;
  trip_stop_id: string | null;
  uploaded_by: string;
  storage_path: string;
  caption: string;
  visibility: MediaVisibility;
  is_primary: boolean;
  created_at: string;
}

export interface HotspotMediaItem {
  id: string;
  hotspotId: string;
  tripId: string | null;
  tripStopId: string | null;
  uploadedBy: string;
  signedUrl: string;
  caption: string;
  visibility: MediaVisibility;
  isPrimary: boolean;
  createdAt: string;
}

export async function fetchHotspotMedia(params: {
  hotspotId: string;
  userId?: string | null;
  limit?: number;
}): Promise<HotspotMediaItem[]> {
  const { data, error } = await supabase
    .from("hotspot_media")
    .select("id,hotspot_id,trip_id,trip_stop_id,uploaded_by,storage_path,caption,visibility,is_primary,created_at")
    .eq("hotspot_id", params.hotspotId)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 24);

  if (error || !data) {
    return [];
  }

  const rows = data as HotspotMediaRow[];

  const signedUrls = await Promise.all(
    rows.map((row) => createSignedMediaUrl(row.storage_path))
  );

  const mapped = rows
    .map((row, index) => {
      const signedUrl = signedUrls[index];
      if (!signedUrl) return null;

      return {
        id: row.id,
        hotspotId: row.hotspot_id,
        tripId: row.trip_id,
        tripStopId: row.trip_stop_id,
        uploadedBy: row.uploaded_by,
        signedUrl,
        caption: row.caption,
        visibility: row.visibility,
        isPrimary: row.is_primary,
        createdAt: row.created_at,
      };
    })
    .filter((item): item is HotspotMediaItem => item !== null);

  const currentUserId = params.userId ?? "";

  return mapped.sort((a, b) => {
    const aMine = a.uploadedBy === currentUserId ? 1 : 0;
    const bMine = b.uploadedBy === currentUserId ? 1 : 0;

    if (aMine !== bMine) return bMine - aMine;
    if (a.isPrimary !== b.isPrimary) return Number(b.isPrimary) - Number(a.isPrimary);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function uploadHotspotPhoto(params: {
  userId: string;
  hotspotId: string;
  hotspotName: string;
  file: File;
  caption: string;
  visibility: MediaVisibility;
}): Promise<{ success: boolean; message: string }> {
  const upload = await uploadImageToMediaBucket({
    userId: params.userId,
    scope: "hotspots",
    refId: params.hotspotId,
    file: params.file,
  });

  if (upload.error || !upload.storagePath) {
    return { success: false, message: upload.error ?? "Upload failed." };
  }

  const { count } = await supabase
    .from("hotspot_media")
    .select("id", { count: "exact", head: true })
    .eq("hotspot_id", params.hotspotId)
    .eq("uploaded_by", params.userId);

  const cleanCaption = normalizeCaption(params.caption);

  const { error } = await supabase.from("hotspot_media").insert({
    hotspot_id: params.hotspotId,
    uploaded_by: params.userId,
    storage_path: upload.storagePath,
    caption: cleanCaption,
    visibility: params.visibility,
    is_primary: (count ?? 0) === 0,
  });

  if (error) {
    return { success: false, message: "Photo metadata could not be saved." };
  }

  await recordActivity({
    actorId: params.userId,
    activityType: "hotspot_photo_added",
    entityType: "hotspot",
    entityId: params.hotspotId,
    message: `added a photo to ${params.hotspotName}`,
    metadata: { hotspotName: params.hotspotName },
    visibility: params.visibility === "private" ? "private" : "friends",
  });

  return { success: true, message: "Photo uploaded." };
}

/**
 * Fetch hotspot media organized by priority for Polarsteps-like display
 * Priority: Personal → Community → Inspiration (database filler images)
 */
export async function fetchOrganizedHotspotMedia(params: {
  hotspotId: string;
  userId?: string | null;
  limit?: number;
}): Promise<OrganizedHotspotMedia> {
  const currentUserId = params.userId ?? "";

  // Fetch user-uploaded media from hotspot_media table
  const { data: mediaData, error } = await supabase
    .from("hotspot_media")
    .select("id,hotspot_id,uploaded_by,storage_path,caption,visibility,created_at")
    .eq("hotspot_id", params.hotspotId)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 50);

  if (error || !mediaData) {
    // Return empty organized structure on error
    return { personal: [], community: [], inspiration: [] };
  }

  // Get signed URLs for all media
  const signedUrls = await Promise.all(
    mediaData.map((row) => createSignedMediaUrl(row.storage_path))
  );

  // Map to media items
  const allMedia = mediaData
    .map((row, index) => {
      const signedUrl = signedUrls[index];
      if (!signedUrl) return null;

      return {
        id: row.id,
        signedUrl,
        caption: row.caption,
        visibility: row.visibility,
        createdAt: row.created_at,
        uploadedBy: row.uploaded_by,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Separate into personal (current user's) and community (others' public)
  const personal: OrganizedHotspotMedia["personal"] = [];
  const community: OrganizedHotspotMedia["community"] = [];

  for (const item of allMedia) {
    if (item.uploadedBy === currentUserId) {
      // User's own photos (regardless of visibility)
      personal.push(item);
    } else if (item.visibility === "public") {
      // Other users' public photos
      community.push(item);
    }
    // Private photos from others are not included
  }

  // Sort personal by newest first
  personal.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Sort community by newest first
  community.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Inspiration (filler images) will be handled by the hotspot.images field
  // which contains database URLs (Wikimedia, etc.)
  // These will be passed separately from the hotspot data

  return { personal, community, inspiration: [] };
}

