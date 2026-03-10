import { supabase } from "@/lib/Supabase/browser-client";
import Fuse from "fuse.js";

interface AddHotspotInput {
  userId: string;
  name: string;
  category: string;
  province?: string;
  description?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  visibility?: "private" | "shared";
}

interface AddHotspotResult {
  id: string;
  name: string;
  category: string;
  province: string;
  latitude: number;
  longitude: number;
  description?: string;
  images?: string[];
  status: "private" | "pending" | "approved";
  approved: boolean;
}

// Belgium bounding box
const BELGIUM_BOUNDS = {
  latMin: 49.5,
  latMax: 51.5,
  lngMin: 2.5,
  lngMax: 6.5,
};

function isValidBelgiumCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= BELGIUM_BOUNDS.latMin &&
    lat <= BELGIUM_BOUNDS.latMax &&
    lng >= BELGIUM_BOUNDS.lngMin &&
    lng <= BELGIUM_BOUNDS.lngMax
  );
}

async function checkImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function geocodeWithOSM(
  name: string,
  province: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${name} ${province} Belgium`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
      {
        headers: {
          "User-Agent": "SpotlyApp/1.0",
        },
      }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("OSM geocoding error:", error);
  }
  return null;
}

export async function addHotspot(input: AddHotspotInput): Promise<AddHotspotResult> {
  const {
    userId,
    name,
    province = "",
    description,
    imageUrl,
    latitude,
    longitude,
    category,
  } = input;

  let score = 0;

  // 1) Fuzzy duplicate check
  const { data: existingHotspots, error: fetchError } = await supabase
    .from("hotspots")
    .select("id, name, province, latitude, longitude");

  if (!fetchError && existingHotspots && existingHotspots.length > 0) {
    const fuse = new Fuse(existingHotspots, {
      keys: ["name", "province"],
      threshold: 0.3,
    });

    const searchTerm = `${name} ${province}`.toLowerCase().replace(/[^a-z0-9]/g, " ");
    const matches = fuse.search(searchTerm);
    
    if (matches.length > 0) {
      score -= 2; // duplicate penalty
    }
  }

  // 2) Description length check
  if (description && description.length >= 30) {
    score += 1;
  }

  // 3) Image validation
  let imageValid = false;
  if (imageUrl) {
    imageValid = await checkImageUrl(imageUrl);
    if (imageValid) {
      score += 1;
    }
  }

  // 4) Coordinates validation or geocoding
  let finalLat = latitude;
  let finalLng = longitude;
  let osmMatched = false;

  if (latitude && longitude && isValidBelgiumCoordinates(latitude, longitude)) {
    score += 1;
  } else {
    // Try OSM geocoding as fallback
    const osmResult = await geocodeWithOSM(name, province);
    if (osmResult) {
      finalLat = osmResult.lat;
      finalLng = osmResult.lng;
      score += 1;
      osmMatched = true;
    }
  }

  // 5) Auto approval based on score
  const status: "private" | "pending" | "approved" = score >= 4 ? "approved" : "pending";

  // 6) Insert hotspot in central table
  const { data: hotspot, error: hotspotError } = await supabase
    .from("hotspots")
    .insert([
      {
        name,
        category,
        province: province || null,
        description: description || null,
        latitude: finalLat || 0,
        longitude: finalLng || 0,
        images: imageUrl ? [imageUrl] : [],
        created_by: userId,
        status,
        likes_count: 0,
        saves_count: 0,
      },
    ])
    .select()
    .single();

  if (hotspotError || !hotspot) {
    console.error("Hotspot insert error:", hotspotError);
    throw new Error(hotspotError?.message || "Error adding hotspot");
  }

  // 7) Link user to hotspot in user_hotspots table
  const { error: userLinkError } = await supabase
    .from("user_hotspots")
    .insert([
      {
        user_id: userId,
        hotspot_id: hotspot.id,
        visited: false,
        wishlist: false,
        favorite: false,
      },
    ]);

  if (userLinkError) {
    console.error("User hotspot link error:", userLinkError);
    // Don't throw here - the hotspot was created successfully
  }

  return {
    id: hotspot.id,
    name: hotspot.name,
    category: hotspot.category,
    province: hotspot.province || "Unknown",
    latitude: hotspot.latitude || 0,
    longitude: hotspot.longitude || 0,
    description: hotspot.description,
    images: hotspot.images,
    status: hotspot.status,
    approved: hotspot.status === "approved",
  };
}
