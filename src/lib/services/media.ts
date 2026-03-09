import { supabase } from "@/lib/Supabase/browser-client";

export type MediaVisibility = "private" | "friends" | "public";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeSegment(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function normalizeCaption(value: string): string {
  return value.replace(/[<>]/g, "").trim().slice(0, 300);
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Only JPG, PNG and WEBP images are allowed.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "Image is too large. Max size is 10MB.";
  }

  return null;
}

export function buildMediaStoragePath(params: {
  userId: string;
  scope: "hotspots" | "trips";
  refId: string;
  fileName: string;
}): string {
  const extension = params.fileName.includes(".")
    ? params.fileName.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";

  const safeRef = sanitizeSegment(params.refId) || "item";
  const safeName = sanitizeSegment(params.fileName.replace(/\.[^.]+$/, "")) || "upload";

  return `${params.userId}/${params.scope}/${safeRef}/${Date.now()}_${safeName}.${extension}`;
}

export async function uploadImageToMediaBucket(params: {
  userId: string;
  scope: "hotspots" | "trips";
  refId: string;
  file: File;
}): Promise<{ storagePath: string; error: string | null }> {
  const validationError = validateImageFile(params.file);
  if (validationError) {
    return { storagePath: "", error: validationError };
  }

  const storagePath = buildMediaStoragePath({
    userId: params.userId,
    scope: params.scope,
    refId: params.refId,
    fileName: params.file.name,
  });

  const { error } = await supabase.storage
    .from("spotly-media")
    .upload(storagePath, params.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: params.file.type,
    });

  if (error) {
    return { storagePath: "", error: "Upload failed. Please try again." };
  }

  return { storagePath, error: null };
}

export async function createSignedMediaUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("spotly-media")
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

