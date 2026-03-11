import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fetch from "node-fetch"; // nodig voor fallback

const COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php";
const COMMONS_USER_AGENT = "SpotlyHotspotImageEnrichment/1.0";
const MAX_IMAGES_PER_HOTSPOT = 3;
const MIN_LANDSCAPE_WIDTH = 1200;
const PAGE_SIZE = 200;
const REQUEST_DELAY_MS = 250;

interface HotspotRow {
  id: string;
  name: string;
  municipality?: string;
  images: string[] | null;
}

interface WikimediaImageInfo {
  url?: string;
  width?: number;
  height?: number;
  mime?: string;
}

interface WikimediaPage {
  imageinfo?: WikimediaImageInfo[];
}

interface WikimediaResponse {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
}

interface HotspotAddress {
  display_name?: string;
  lat?: string;
  lon?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSupabaseCredentials(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or anon key");

  return { url, key };
}

function createAdminClient(): SupabaseClient {
  const { url, key } = getSupabaseCredentials();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Fetch all hotspots (images IS NULL or niet)
async function fetchAllHotspots(supabase: SupabaseClient): Promise<HotspotRow[]> {
  const results: HotspotRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("hotspots")
      .select("id,name,municipality,images")
      .order("name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as HotspotRow[];
    results.push(...page);

    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return results;
}

// TypeScript helper: landscape & large enough
function isLandscapeAndLarge(info: WikimediaImageInfo): info is Required<WikimediaImageInfo> {
  const width = Number(info.width ?? 0);
  const height = Number(info.height ?? 0);
  const url = info.url ?? "";
  const mime = (info.mime ?? "").toLowerCase();
  return !!url && (mime === "image/jpeg" || mime === "image/png" || mime === "image/webp") && width > height && width > MIN_LANDSCAPE_WIDTH;
}

// Wikimedia fetch
async function fetchWikimediaImagesForHotspot(searchTerm: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: searchTerm,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|size|mime",
  });

  const response = await fetch(`${COMMONS_API_URL}?${params.toString()}`, {
    headers: { "User-Agent": COMMONS_USER_AGENT, Accept: "application/json" },
  });

  if (!response.ok) return [];
  const payload = (await response.json()) as WikimediaResponse;
  const pages = Object.values(payload.query?.pages ?? {});

  const candidates = pages
    .flatMap((page) => page.imageinfo ?? [])
    .filter(isLandscapeAndLarge)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));

  const uniqueUrls: string[] = [];
  const seen = new Set<string>();
  for (const item of candidates) {
    const imageUrl = item.url;
    if (seen.has(imageUrl)) continue;
    seen.add(imageUrl);
    uniqueUrls.push(imageUrl);
    if (uniqueUrls.length >= MAX_IMAGES_PER_HOTSPOT) break;
  }

  return uniqueUrls;
}

// Fallback (Unsplash)
async function fetchFromFallbackSource(query: string): Promise<string[]> {
  const apiKey = process.env.UNSPLASH_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&count=3&client_id=${apiKey}`);
    if (!res.ok) return [];

    const data = (await res.json()) as Array<{ urls: { regular?: string } }>;
    return data.map(item => item.urls.regular).filter((url): url is string => !!url);
  } catch (err) {
    console.error("Fallback source error:", err);
    return [];
  }
}

// Fetch address via OpenStreetMap Nominatim
async function fetchHotspotAddress(searchTerm: string): Promise<HotspotAddress | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "SpotlyHotspotEnrichment/1.0" } });
    if (!res.ok) return null;

    const data = (await res.json()) as HotspotAddress[];
    return data.length ? data[0] : null;
  } catch (err) {
    console.error(`Error fetching address for ${searchTerm}:`, err);
    return null;
  }
}

// Update images + address
async function updateHotspotWithImagesAndAddress(
  supabase: SupabaseClient,
  hotspotId: string,
  imageUrls: string[],
  address?: string,
  lat?: string,
  lon?: string
): Promise<void> {
  const { error } = await supabase
    .from("hotspots")
    .update({ images: imageUrls, address, latitude: lat, longitude: lon })
    .eq("id", hotspotId);
  if (error) throw error;
}

// Main enrichment
export async function enrichHotspotsWithImages(): Promise<void> {
  const supabase = createAdminClient();
  const hotspots = await fetchAllHotspots(supabase);

  if (!hotspots.length) {
    console.log("No hotspots found.");
    return;
  }

  console.log(`Found ${hotspots.length} hotspots.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const hotspot of hotspots) {
    try {
      const searchTerm = hotspot.municipality ? `${hotspot.name} ${hotspot.municipality}` : hotspot.name;

      // Only fetch images if empty
      let images: string[] = hotspot.images ?? [];
      if (!images.length) {
        images = await fetchWikimediaImagesForHotspot(searchTerm);
        if (!images.length) {
          images = await fetchFromFallbackSource(searchTerm);
          if (!images.length) {
            skipped += 1;
            console.log(`[SKIP] ${searchTerm}: no images found.`);
          } else {
            console.log(`[FALLBACK] ${searchTerm}: used fallback source.`);
          }
        }
      }

      // Fetch address always
      const addressData = await fetchHotspotAddress(searchTerm);

      await updateHotspotWithImagesAndAddress(
        supabase,
        hotspot.id,
        images,
        addressData?.display_name,
        addressData?.lat,
        addressData?.lon
      );

      updated += 1;
      console.log(`[OK] ${searchTerm}: stored ${images.length} image(s) and address.`);
    } catch (error) {
      failed += 1;
      console.error(`[FAIL] ${hotspot.name}:`, error);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`Enrichment complete. Updated=${updated}, Skipped=${skipped}, Failed=${failed}`);
}