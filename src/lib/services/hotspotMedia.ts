import { supabase } from "@/lib/Supabase/browser-client";
import {
  buildMediaStoragePath,
  createSignedMediaUrl,
  MediaVisibility,
  normalizeCaption,
  validateImageFile,
} from "@/lib/services/media";
import { recordActivity } from "@/lib/services/activity";
import { OrganizedHotspotMedia } from "@/types/hotspot";

const MEDIA_BUCKET = "spotly-media";
const PUBLIC_URL_EXPIRY_SECONDS = 24 * 60 * 60;
const RESTRICTED_URL_EXPIRY_SECONDS = 60 * 60;

type Visibility = "public" | "friends" | "private";

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

interface CachedSignedUrl {
  url: string;
  expiresAt: number;
}

interface HotspotAssetPaths {
  basePath: string;
  originalPath: string;
  thumbnailPath: string;
}

interface UploadFileInternalResult extends HotspotPhotoUploadResult {
  metadataId?: string;
}

const hotspotSignedUrlCache = new Map<string, CachedSignedUrl>();

function buildSignedUrlCacheKey(storagePath: string, expiresInSeconds: number, viewerScope: string): string {
  return `${viewerScope}:${expiresInSeconds}:${storagePath}`;
}

function getCachedSignedUrl(cacheKey: string): string | null {
  const cached = hotspotSignedUrlCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt > Date.now()) {
    return cached.url;
  }

  hotspotSignedUrlCache.delete(cacheKey);
  return null;
}

function setCachedSignedUrl(cacheKey: string, url: string, expiresInSeconds: number): void {
  hotspotSignedUrlCache.set(cacheKey, {
    url,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
}

function getFileExtension(fileName: string): string {
  const rawExt = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";

  return rawExt.replace(/[^a-z0-9]+/g, "") || "jpg";
}

function buildHotspotAssetPaths(params: {
  userId: string;
  hotspotId: string;
  fileName: string;
}): HotspotAssetPaths {
  const seedPath = buildMediaStoragePath({
    userId: params.userId,
    scope: "hotspots",
    refId: params.hotspotId,
    fileName: params.fileName,
  });

  const extension = getFileExtension(params.fileName);
  const basePath = seedPath.replace(/\.[^.]+$/, "");

  return {
    basePath,
    originalPath: `${basePath}/original.${extension}`,
    thumbnailPath: `${basePath}/thumb.${extension}`,
  };
}

async function isFine(currentUserId: string, ownerUserId: string): Promise<boolean> {
  if (!currentUserId || !ownerUserId) return false;
  if (currentUserId === ownerUserId) return true;

  const [viewerFollowsOwner, ownerFollowsViewer] = await Promise.all([
    supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", currentUserId)
      .eq("followed_id", ownerUserId)
      .eq("status", "accepted")
      .maybeSingle(),
    supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", ownerUserId)
      .eq("followed_id", currentUserId)
      .eq("status", "accepted")
      .maybeSingle(),
  ]);

  if (viewerFollowsOwner.error || ownerFollowsViewer.error) {
    return false;
  }

  return Boolean(viewerFollowsOwner.data && ownerFollowsViewer.data);
}

export interface HotspotPhotoRecord {
  id: string;
  user_id: string;
  hotspot_id: string;
  storage_path: string;
  visibility: Visibility;
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

export interface HotspotPhotoUploadResult {
  fileName: string;
  success: boolean;
  url?: string;
  error?: string;
  storagePath?: string;
  thumbnailPath?: string;
}

export async function getHotspotPhotoUrl(
  photo: HotspotPhotoRecord,
  currentUserId?: string | null
): Promise<string | null> {
  const viewerId = currentUserId ?? null;
  const ownerId = photo.user_id;

  let allowed = false;
  let expiresInSeconds = RESTRICTED_URL_EXPIRY_SECONDS;
  let viewerScope = "anon";

  if (photo.visibility === "public") {
    allowed = true;
    expiresInSeconds = PUBLIC_URL_EXPIRY_SECONDS;
    viewerScope = "public";
  } else if (photo.visibility === "friends") {
    if (!viewerId) return null;
    allowed = await isFine(viewerId, ownerId);
    viewerScope = `friends:${viewerId}`;
  } else {
    if (!viewerId) return null;
    allowed = viewerId === ownerId;
    viewerScope = `private:${viewerId}`;
  }

  if (!allowed) {
    return null;
  }

  const cacheKey = buildSignedUrlCacheKey(photo.storage_path, expiresInSeconds, viewerScope);
  const cachedUrl = getCachedSignedUrl(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  const signedUrl = await createSignedMediaUrl(photo.storage_path, expiresInSeconds);
  if (!signedUrl) {
    return null;
  }

  setCachedSignedUrl(cacheKey, signedUrl, expiresInSeconds);
  return signedUrl;
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

  const mapped = (
    await Promise.all(
      rows.map(async (row) => {
        const signedUrl = await getHotspotPhotoUrl(
          {
            id: row.id,
            user_id: row.uploaded_by,
            hotspot_id: row.hotspot_id,
            storage_path: row.storage_path,
            visibility: row.visibility,
            created_at: row.created_at,
          },
          params.userId
        );

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
    )
  ).filter((item): item is HotspotMediaItem => item !== null);

  const currentUserId = params.userId ?? "";

  return mapped.sort((a, b) => {
    const aMine = a.uploadedBy === currentUserId ? 1 : 0;
    const bMine = b.uploadedBy === currentUserId ? 1 : 0;

    if (aMine !== bMine) return bMine - aMine;
    if (a.isPrimary !== b.isPrimary) return Number(b.isPrimary) - Number(a.isPrimary);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function uploadHotspotPhotos(params: {
  userId: string;
  hotspotId: string;
  hotspotName: string;
  files: File[];
  caption: string;
  visibility: MediaVisibility;
  signedUrlExpiresInSeconds?: number;
}): Promise<HotspotPhotoUploadResult[]> {
  if (!params.files.length) {
    return [];
  }

  const cleanCaption = normalizeCaption(params.caption);
  const visibilityExpirySeconds =
    params.visibility === "public"
      ? PUBLIC_URL_EXPIRY_SECONDS
      : params.signedUrlExpiresInSeconds ?? RESTRICTED_URL_EXPIRY_SECONDS;

  const { count } = await supabase
    .from("hotspot_media")
    .select("id", { count: "exact", head: true })
    .eq("hotspot_id", params.hotspotId)
    .eq("uploaded_by", params.userId);

  const userAlreadyHasPrimary = (count ?? 0) > 0;

  const perFileResults = await Promise.all(
    params.files.map(async (file): Promise<UploadFileInternalResult> => {
      const validationError = validateImageFile(file);
      if (validationError) {
        return {
          fileName: file.name,
          success: false,
          error: validationError,
        };
      }

      const assetPaths = buildHotspotAssetPaths({
        userId: params.userId,
        hotspotId: params.hotspotId,
        fileName: file.name,
      });

      console.log("Uploading to:", assetPaths.originalPath);

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(assetPaths.originalPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
          metadata: {
            owner: params.userId,
            thumbnail_path: assetPaths.thumbnailPath,
          },
        });

      if (uploadError) {
        return {
          fileName: file.name,
          success: false,
          error: uploadError.message,
          storagePath: assetPaths.originalPath,
          thumbnailPath: assetPaths.thumbnailPath,
        };
      }

      const { data: insertData, error: metadataError } = await supabase
        .from("hotspot_media")
        .insert({
          hotspot_id: params.hotspotId,
          uploaded_by: params.userId,
          storage_path: assetPaths.originalPath,
          caption: cleanCaption,
          visibility: params.visibility,
          is_primary: false,
        })
        .select("id")
        .single();

      if (metadataError || !insertData?.id) {
        await supabase.storage.from(MEDIA_BUCKET).remove([assetPaths.originalPath]);
        return {
          fileName: file.name,
          success: false,
          error: "Photo metadata could not be saved.",
          storagePath: assetPaths.originalPath,
          thumbnailPath: assetPaths.thumbnailPath,
        };
      }

      const signedUrl = await createSignedMediaUrl(assetPaths.originalPath, visibilityExpirySeconds);
      if (!signedUrl) {
        return {
          fileName: file.name,
          success: false,
          error: "Signed URL could not be created.",
          storagePath: assetPaths.originalPath,
          thumbnailPath: assetPaths.thumbnailPath,
          metadataId: insertData.id,
        };
      }

      return {
        fileName: file.name,
        success: true,
        url: signedUrl,
        storagePath: assetPaths.originalPath,
        thumbnailPath: assetPaths.thumbnailPath,
        metadataId: insertData.id,
      };
    })
  );

  if (!userAlreadyHasPrimary) {
    const firstSuccessful = perFileResults.find((result) => result.success && result.metadataId);
    if (firstSuccessful?.metadataId) {
      await supabase
        .from("hotspot_media")
        .update({ is_primary: true })
        .eq("id", firstSuccessful.metadataId);
    }
  }

  const successCount = perFileResults.filter((result) => result.success).length;

  if (successCount > 0) {
    await recordActivity({
      actorId: params.userId,
      activityType: "hotspot_photo_added",
      entityType: "hotspot",
      entityId: params.hotspotId,
      message: `added ${successCount} photo${successCount === 1 ? "" : "s"} to ${params.hotspotName}`,
      metadata: { hotspotName: params.hotspotName, count: successCount },
      visibility: params.visibility === "private" ? "private" : "friends",
    });
  }

  return perFileResults.map((result) => {
    const { metadataId, ...publicResult } = result;
    void metadataId;
    return publicResult;
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
  const [result] = await uploadHotspotPhotos({
    userId: params.userId,
    hotspotId: params.hotspotId,
    hotspotName: params.hotspotName,
    files: [params.file],
    caption: params.caption,
    visibility: params.visibility,
  });

  if (!result?.success) {
    return { success: false, message: result?.error ?? "Upload failed." };
  }

  return { success: true, message: "Photo uploaded." };
}

/**
 * Fetch hotspot media organized by priority for Polarsteps-like display
 * Priority: Personal -> Community -> Inspiration (database filler images)
 */
export async function fetchOrganizedHotspotMedia(params: {
  hotspotId: string;
  userId?: string | null;
  limit?: number;
}): Promise<OrganizedHotspotMedia> {
  const currentUserId = params.userId ?? "";

  const { data: mediaData, error } = await supabase
    .from("hotspot_media")
    .select("id,hotspot_id,uploaded_by,storage_path,caption,visibility,created_at")
    .eq("hotspot_id", params.hotspotId)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 50);

  if (error || !mediaData) {
    return { personal: [], community: [], inspiration: [] };
  }

  const allMedia = (
    await Promise.all(
      mediaData.map(async (row) => {
        const signedUrl = await getHotspotPhotoUrl(
          {
            id: row.id,
            user_id: row.uploaded_by,
            hotspot_id: row.hotspot_id,
            storage_path: row.storage_path,
            visibility: row.visibility,
            created_at: row.created_at,
          },
          currentUserId
        );

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
    )
  ).filter((item): item is NonNullable<typeof item> => item !== null);

  const personal: OrganizedHotspotMedia["personal"] = [];
  const community: OrganizedHotspotMedia["community"] = [];

  for (const item of allMedia) {
    if (item.uploadedBy === currentUserId) {
      personal.push(item);
    } else {
      community.push(item);
    }
  }

  personal.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  community.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { personal, community, inspiration: [] };
}