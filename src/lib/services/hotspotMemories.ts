import { supabase } from "@/lib/Supabase/browser-client";
import { MediaVisibility } from "@/lib/services/media";

// Upload een foto naar Supabase Storage en retourneer een signed URL
export async function uploadHotspotPhoto({
  userId,
  hotspotId,
  file,
  caption,
  visibility,
}: {
  userId: string;
  hotspotId: string;
  file: File;
  caption?: string;
  visibility?: MediaVisibility;
}) {
  try {
    const bucket = "spotly-media";

    // Zorg voor uniek pad per bestand
    const path = `${userId}/hotspots/${hotspotId}/${Date.now()}_${file.name}`;

    // Upload naar Supabase Storage
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
    if (uploadError) throw uploadError;

    // Genereer een signed URL van 1 uur (3600 sec)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    if (signedError) throw signedError;

    return { success: true, url: signedData.signedUrl };
  } catch (err) {
    console.error(err);
    return { success: false, message: (err as Error).message };
  }
}