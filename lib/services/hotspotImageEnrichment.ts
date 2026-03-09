import { createClient, SupabaseClient } from "@supabase/supabase-js";

const COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php";
const COMMONS_USER_AGENT = "SpotlyHotspotImageEnrichment/1.0";
const MAX_IMAGES_PER_HOTSPOT = 3;
const MIN_LANDSCAPE_WIDTH = 1200;
const PAGE_SIZE = 200;
const REQUEST_DELAY_MS = 250;

interface HotspotRow {
  id: string;
  name: string;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getSupabaseCredentials(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn(
      "Using anon key for enrichment. Use SUPABASE_SERVICE_ROLE_KEY for reliable updates."
    );
  }

  return { url, key };
}

function createAdminClient(): SupabaseClient {
  const { url, key } = getSupabaseCredentials();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchHotspotsMissingImages(
  supabase: SupabaseClient
): Promise<HotspotRow[]> {
  const results: HotspotRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("hotspots")
      .select("id,name,images")
      .is("images", null)
      .order("name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = (data ?? []) as HotspotRow[];
    results.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return results;
}

function isLandscapeAndLarge(info: WikimediaImageInfo): info is Required<WikimediaImageInfo> {
  const width = Number(info.width ?? 0);
  const height = Number(info.height ?? 0);
  const url = info.url ?? "";
  const mime = (info.mime ?? "").toLowerCase();

  if (!url) return false;
  if (!(mime === "image/jpeg" || mime === "image/png" || mime === "image/webp")) {
    return false;
  }

  return width > height && width > MIN_LANDSCAPE_WIDTH;
}

async function fetchWikimediaImagesForHotspot(hotspotName: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: hotspotName,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|size|mime",
  });

  const response = await fetch(`${COMMONS_API_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": COMMONS_USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

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

    if (uniqueUrls.length >= MAX_IMAGES_PER_HOTSPOT) {
      break;
    }
  }

  return uniqueUrls;
}

async function updateHotspotImages(
  supabase: SupabaseClient,
  hotspotId: string,
  imageUrls: string[]
): Promise<void> {
  const { error } = await supabase
    .from("hotspots")
    .update({ images: imageUrls })
    .eq("id", hotspotId);

  if (error) {
    throw error;
  }
}

export async function enrichHotspotsWithImages(): Promise<void> {
  const supabase = createAdminClient();
  const hotspots = await fetchHotspotsMissingImages(supabase);

  if (!hotspots.length) {
    console.log("No hotspots found with images IS NULL.");
    return;
  }

  console.log(`Found ${hotspots.length} hotspots with images IS NULL.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const hotspot of hotspots) {
    try {
      const images = await fetchWikimediaImagesForHotspot(hotspot.name);

      if (!images.length) {
        skipped += 1;
        console.log(`[SKIP] ${hotspot.name}: no matching Wikimedia images.`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      await updateHotspotImages(supabase, hotspot.id, images);
      updated += 1;
      console.log(`[OK] ${hotspot.name}: stored ${images.length} image(s).`);
    } catch (error) {
      failed += 1;
      console.error(`[FAIL] ${hotspot.name}:`, error);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`Enrichment complete. Updated=${updated}, Skipped=${skipped}, Failed=${failed}`);
}
