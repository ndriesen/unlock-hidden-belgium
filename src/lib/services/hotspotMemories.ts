import { supabase } from "@/lib/Supabase/browser-client";
import { MediaVisibility, validateImageFile } from "@/lib/services/media";

const HOTSPOT_MEDIA_BUCKET = "spotly-media";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

export interface HotspotPhotoUploadResult {
  fileName: string;
  success: boolean;
  url?: string;
  error?: string;
}

export interface UploadHotspotPhotosParams {
  userId: string;
  hotspotId: string;
  files: File[];
  visibility: MediaVisibility;
  signedUrlExpiresInSeconds?: number;
}

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName
    .toLowerCase()
    .replace(/[\\/]/g, "_")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.jfif$/, ".jpg") 
    .slice(0, 120) || "upload.jpg";

  return cleaned || "upload.jpg";
}

function buildHotspotStoragePath(params: {
  userId: string;
  hotspotId: string;
  fileName: string;
  index: number;
}): string {
  const safeFileName = sanitizeFileName(params.fileName);
  const uniquePrefix = `${Date.now()}-${params.index}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  // Must match RLS path convention: ${userId}/hotspots/${hotspotId}/filename
  return `${params.userId}/hotspots/${params.hotspotId}/${uniquePrefix}-${safeFileName}`;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "Unknown upload error.";
}

export async function uploadHotspotPhotos(
  params: UploadHotspotPhotosParams
): Promise<HotspotPhotoUploadResult[]> {
  if (!params.files.length) {
    return [];
  }

  const expiresIn = params.signedUrlExpiresInSeconds ?? SIGNED_URL_EXPIRY_SECONDS;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }


  return Promise.all(
    params.files.map(async (file, index): Promise<HotspotPhotoUploadResult> => {
      const fileName = file?.name ?? `file-${index + 1}`;
      const validationError = validateImageFile(file);

      if (validationError) {
        return {
          fileName,
          success: false,
          error: validationError,
        };
      }

      const storagePath = buildHotspotStoragePath({
        userId: user.id,
        hotspotId: params.hotspotId,
        fileName,
        index,
      });
       
      console.log("Uploading to:", storagePath);

      try {
        // 1. Upload
        const { data, error: uploadError } = await supabase.storage
          .from(HOTSPOT_MEDIA_BUCKET)
          .upload(storagePath, file, {
            upsert: false,
            cacheControl: "3600",
            contentType: file.type || undefined,
          /**   metadata: {
              owner: params.userId,
            },*/
          });

        if (uploadError || !data?.path) {
          return {
            fileName,
            success: false,
            error: uploadError?.message ?? "Upload failed",
          };
        }

        await new Promise((res) => setTimeout(res, 200));

        let url: string;

        // 2. URL generatie
        if (params.visibility === "public") {
          const { data: publicData } = supabase.storage
            .from(HOTSPOT_MEDIA_BUCKET)
            .getPublicUrl(storagePath);

          if (!publicData?.publicUrl) {
            return {
              fileName,
              success: false,
              error: "Public URL could not be created.",
            };
          }

          url = publicData.publicUrl;
        } else {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from(HOTSPOT_MEDIA_BUCKET)
              .createSignedUrl(storagePath, expiresIn);

          if (signedError || !signedData?.signedUrl) {
            return {
              fileName,
              success: false,
              error:
                signedError?.message ?? "Signed URL could not be created.",
            };
          }

          url = signedData.signedUrl;
        }

        return {
          fileName,
          success: true,
          url,
        };
      } catch (error) {
        console.error("Upload error:", error);

        return {
          fileName,
          success: false,
          error: getErrorMessage(error),
        };
      }
    })
  );
}

// Backward-compatible single-file wrapper
export async function uploadHotspotPhoto({
  userId,
  hotspotId,
  file,
  visibility = "private",
}: {
  userId: string;
  hotspotId: string;
  file: File;
  caption?: string;
  visibility?: MediaVisibility;
}): Promise<{ success: boolean; url?: string; message?: string }> {
  const [result] = await uploadHotspotPhotos({
    userId,
    hotspotId,
    files: [file],
    visibility,
  });

  if (!result) {
    return { success: false, message: "No upload result returned." };
  }

  if (!result.success) {
    return { success: false, message: result.error ?? "Upload failed." };
  }

  return { success: true, url: result.url };
}
