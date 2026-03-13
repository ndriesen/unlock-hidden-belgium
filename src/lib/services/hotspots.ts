import { supabase } from "@/lib/Supabase/browser-client";

/**
 * Safely parse images field from Supabase.
 * Handles cases where Supabase might return a stringified JSON array
 * instead of a proper array.
 */
function parseImages(images: unknown): string[] | undefined {
  if (!images) return undefined;
  
  // If it's already an array of strings
  if (Array.isArray(images)) {
    return images.filter((item): item is string => typeof item === "string");
  }
  
  // If it's a string (stringified JSON array)
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      // Not a valid JSON string, return undefined
      return undefined;
    }
  }
  
  return undefined;
}

function parseTags(tags: unknown): string[] | undefined {
  if (!tags) return undefined;
  
  if (Array.isArray(tags)) {
    return tags.filter((item): item is string => typeof item === "string");
  }
  
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return undefined;
    }
  }
  
  return undefined;
}

export async function fetchHotspots() {
  const { data, error } = await supabase
    .from("hotspots")
  .select(`
      *,
      wikipedia_intro,
      tags,
      tourism_type
    `)
    .eq("status", "approved");
  if (error) throw error;
  
  // Process arrays to ensure they're proper arrays
  if (data) {
    return data.map(hotspot => ({
      ...hotspot,
      images: parseImages(hotspot.images),
      tags: parseTags(hotspot.tags)
    }));
  }
  
  return data;
}
