import { supabase } from "@/lib/Supabase/browser-client";

interface HotspotRow {
  id: string;
  name: string;
  category: string | null;
  province: string | null;
  description: string | null;
  wikipedia_intro: string | null;
  tags?: string[];        // <-- make optional
  tourism_type: string | null;
  heritage: boolean | null;
  images?: string[];      // <-- make optional
  visit_count: number | null;
  likes_count: number | null;
  saves_count: number | null;

  // Enrichment fields
  latitude?: number | null;
  longitude?: number | null;
  website?: string;
  opening_hours?: string[];
  entry_fee?: number | null;
  address?: string;
  municipality?: string;
  difficulty_level?: number | null;
  last_updated?: string;
}

export interface ExploreHotspot {
  id: string;
  name: string;
  category: string;
  province: string;
  description: string;
  wikipedia_intro?: string;
  tags?: string[];
  tourism_type?: string;
  heritage?: boolean;
  imageUrl: string;
  visitCount: number;
  reviewCount: number;
  averageRating: number;
  likesCount: number;
  savesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  visited: boolean;
  wishlist: boolean;
  favorite: boolean;
}

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// ------------------------
// Helper functions
// ------------------------

// Safely parse arrays from Supabase
function parseArray(arr: unknown): string[] | null {
  if (!arr) return null;
  if (Array.isArray(arr)) return arr.filter(i => typeof i === "string");
  if (typeof arr === "string") {
    try { return JSON.parse(arr); } catch { return null; }
  }
  return null;
}

// Fetch Wikipedia intro for a hotspot
async function fetchWikipediaIntro(name: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.extract ?? null;
  } catch {
    return null;
  }
}

// Fetch Google Place data for enrichment
async function fetchGooglePlace(name: string, municipality: string) {
  const query = encodeURIComponent(`${name} ${municipality}`);
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,name,geometry,types,formatted_address,photos,opening_hours,website,price_level,rating&key=${GOOGLE_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.candidates?.length > 0) {
      const place = data.candidates[0];
      return {
        description: place.description,
        latitude: place.geometry?.location?.lat ?? null,
        longitude: place.geometry?.location?.lng ?? null,
        category: place.types?.[0] ?? null,
        address: place.formatted_address ?? null,
        website: place.website ?? null,
        opening_hours: place.opening_hours?.weekday_text ?? null,
        entry_fee: place.price_level ?? null,
        images: place.photos?.map(
          (p: any) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${GOOGLE_API_KEY}`
        ) ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely parse images field from Supabase.
 * Handles cases where Supabase might return a stringified JSON array
 * instead of a proper array.
 */
function parseImages(images: unknown): string[] | null {
  if (!images) return null;
  
  // If it's already an array of strings
  if (Array.isArray(images)) {
    const filtered = images.filter((item): item is string => typeof item === "string");
    return filtered.length > 0 ? filtered : null;
  }
  
  // If it's a string (stringified JSON array)
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((item): item is string => typeof item === "string");
        return filtered.length > 0 ? filtered : null;
      }
    } catch {
      // Not a valid JSON string, return null
      return null;
    }
  }
  
  return null;
}

function parseTags(tags: unknown): string[] | null {
  if (!tags) return null;
  
  if (Array.isArray(tags)) {
    const filtered = tags.filter((item): item is string => typeof item === "string");
    return filtered.length > 0 ? filtered : null;
  }
  
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((item): item is string => typeof item === "string");
        return filtered.length > 0 ? filtered : null;
      }
    } catch {
      return null;
    }
  }
  
  return null;
}

interface ReviewRow {
  hotspot_id: string;
  rating: number;
}

interface UserFlagRow {
  hotspot_id: string;
  visited: boolean | null;
  wishlist: boolean | null;
  favorite: boolean | null;
}

interface HotspotReactionRow {
  hotspot_id: string;
}

interface TripRow {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  likes_count: number | null;
  saves_count: number | null;
  views_count: number | null;
  created_by: string;
  visibility: string;
}

interface TripStopRow {
  trip_id: string;
}

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
}

interface TripReactionRow {
  trip_id: string;
}

export interface ExploreHotspot {
  id: string;
  name: string;
  category: string;
  province: string;
  description: string;
  wikipedia_intro?: string;
  tags?: string[];
  tourism_type?: string;
  heritage?: boolean;
  imageUrl: string;
  visitCount: number;
  reviewCount: number;
  averageRating: number;
  likesCount: number;
  savesCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  visited: boolean;
  wishlist: boolean;
  favorite: boolean;
  latitude?: number | null;
  longitude?: number | null;
  website?: string;
  opening_hours?: string[];  // Google returns weekday_text array
  entry_fee?: number | null;
  address?: string;
  municipality?: string;
  difficulty_level?: number | null;
  last_updated?: string;
}

export interface PopularTrip {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  likesCount: number;
  savesCount: number;
  viewsCount: number;
  stopCount: number;
  score: number;
  authorName: string;
  likedByMe: boolean;
  savedByMe: boolean;
}

function safeImage(images: string[] | null | undefined): string {
  return images?.[0] ?? "https://images.unsplash.com/photo-1469474968028-56623f02e42e";
}

function tableMissing(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message ?? "";

  return (
    code === "42P01" ||
    message.toLowerCase().includes("does not exist") ||
    message.toLowerCase().includes("column")
  );
}

function buildReviewStats(rows: ReviewRow[]): Map<string, { count: number; avg: number }> {
  const bucket = new Map<string, { sum: number; count: number }>();

  rows.forEach((row) => {
    const current = bucket.get(row.hotspot_id) ?? { sum: 0, count: 0 };
    current.sum += Number(row.rating) || 0;
    current.count += 1;
    bucket.set(row.hotspot_id, current);
  });

  const stats = new Map<string, { count: number; avg: number }>();

  bucket.forEach((value, key) => {
    stats.set(key, {
      count: value.count,
      avg: value.count > 0 ? Math.round((value.sum / value.count) * 10) / 10 : 0,
    });
  });

  return stats;
}

export async function fetchExploreHotspots(userId?: string | null): Promise<ExploreHotspot[]> {
  // 1️⃣ Load approved hotspots
  const { data: hotspotData, error: hotspotError } = await supabase
    .from("hotspots")
    .select("*")
    .eq("status", "approved");

  if (hotspotError || !hotspotData) throw hotspotError ?? new Error("Could not load hotspots");

  const rows = (hotspotData as HotspotRow[]).map(row => ({
    ...row,
    images: parseImages(row.images),
    tags: parseTags(row.tags),
  }));

  const hotspotIds = rows.map((r) => r.id);
  if (!hotspotIds.length) return [];

  // 2️⃣ Fetch review stats
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("hotspot_id,rating")
    .in("hotspot_id", hotspotIds);
  const reviewStats = buildReviewStats((reviewData ?? []) as ReviewRow[]);

  // 3️⃣ Fetch user flags, likes & saves
  const flagMap = new Map<string, { visited: boolean; wishlist: boolean; favorite: boolean }>();
  const likedByMe = new Set<string>();
  const savedByMe = new Set<string>();

  if (userId && hotspotIds.length > 0) {
    const [{ data: userFlags }, likesResult, savesResult] = await Promise.all([
      supabase
        .from("user_hotspots")
        .select("hotspot_id,visited,wishlist,favorite")
        .eq("user_id", userId)
        .in("hotspot_id", hotspotIds)
        .or("visited.eq.true,wishlist.eq.true,favorite.eq.true"),
      supabase
        .from("hotspot_likes")
        .select("hotspot_id")
        .eq("user_id", userId)
        .in("hotspot_id", hotspotIds),
      supabase
        .from("hotspot_saves")
        .select("hotspot_id")
        .eq("user_id", userId)
        .in("hotspot_id", hotspotIds),
    ]);

    (userFlags ?? []).forEach((row: UserFlagRow) =>
      flagMap.set(row.hotspot_id, {
        visited: !!row.visited,
        wishlist: !!row.wishlist,
        favorite: !!row.favorite,
      })
    );
    if (!likesResult.error) (likesResult.data ?? []).forEach((r: HotspotReactionRow) => likedByMe.add(r.hotspot_id));
    if (!savesResult.error) (savesResult.data ?? []).forEach((r: HotspotReactionRow) => savedByMe.add(r.hotspot_id));
  }

  function normalizeArray(arr: string[] | null | undefined): string[] | undefined {
      if (!arr || arr.length === 0) return undefined; // null or empty → undefined
      return arr;
    }

  // 4️⃣ Enrich with external sources (Google Places + Wikipedia)
  async function enrichHotspot(row: HotspotRow): Promise<HotspotRow> {
    const googleData = await fetchGooglePlace(row.name, row.province ?? "");
    const wikiIntro = await fetchWikipediaIntro(row.name);

      const normalizedRows = (hotspotData as HotspotRow[]).map(row => ({
        ...row,
        images: parseImages(row.images) ?? undefined, // normalize null → undefined
        tags: parseTags(row.tags) ?? undefined,      // normalize null → undefined
      }));

    return {
        ...row,
      description: googleData?.description ?? row.description,
      latitude: googleData?.latitude ?? row.latitude,
      longitude: googleData?.longitude ?? row.longitude,
      category: googleData?.category ?? row.category,
      difficulty_level: row.difficulty_level ?? 1,
      website: googleData?.website ?? row.website,
      opening_hours: googleData?.opening_hours ?? row.opening_hours,
      entry_fee: googleData?.entry_fee ?? row.entry_fee,
      address: googleData?.address ?? row.address,
      municipality: googleData?.address ? googleData.address.split(",")[1]?.trim() : row.municipality,
      images: googleData?.images ? [...(row.images ?? []), ...googleData.images] : row.images,
      wikipedia_intro: wikiIntro ?? row.wikipedia_intro,
      last_updated: new Date().toISOString(),
    };
  }


  const normalizedRows = (hotspotData as HotspotRow[]).map(row => ({
    ...row,
    images: parseImages(row.images) ?? undefined, // normalize null → undefined
    tags: parseTags(row.tags) ?? undefined,      // normalize null → undefined
  }));

  const enrichedRows = await Promise.all(normalizedRows.map(enrichHotspot));

  // 5️⃣ Map to ExploreHotspot for frontend
  return enrichedRows
    .map((row) => {
      const review = reviewStats.get(row.id) ?? { count: 0, avg: 0 };
      const flags = flagMap.get(row.id) ?? { visited: false, wishlist: false, favorite: false };

      return {
        id: row.id,
        name: row.name,
        category: row.category ?? "Unknown",
        province: row.province ?? "Unknown",
        description: row.description ?? "No description yet.",
        wikipedia_intro: row.wikipedia_intro ?? undefined,
        tags: row.tags,
        tourism_type: row.tourism_type ?? undefined,
        heritage: row.heritage ?? undefined,
        imageUrl: safeImage(row.images),
        visitCount: row.visit_count ?? 0,
        reviewCount: review.count,
        averageRating: review.avg,
        likesCount: row.likes_count ?? 0,
        savesCount: row.saves_count ?? 0,
        likedByMe: likedByMe.has(row.id),
        savedByMe: savedByMe.has(row.id),
        visited: flags.visited,
        wishlist: flags.wishlist,
        favorite: flags.favorite,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        website: row.website ?? undefined,
        opening_hours: row.opening_hours ?? undefined,
        entry_fee: row.entry_fee ?? undefined,
        address: row.address ?? undefined,
        municipality: row.municipality ?? undefined,
        difficulty_level: row.difficulty_level ?? undefined,
        last_updated: row.last_updated ?? undefined,
      };
    })
    .sort(
      (a, b) =>
        b.visitCount + b.likesCount * 1.8 + b.savesCount * 1.5 -
        (a.visitCount + a.likesCount * 1.8 + a.savesCount * 1.5)
    );
}

export async function fetchPopularTrips(
  limit = 6,
  userId?: string | null
): Promise<{ trips: PopularTrip[]; warning: string }> {
  const { data: tripData, error: tripError } = await supabase
    .from("trips")
    .select("id,title,description,cover_image,likes_count,saves_count,views_count,created_by,visibility")
    .eq("visibility", "public")
    .order("likes_count", { ascending: false })
    .limit(Math.max(limit * 3, limit));

  if (tripError) {
    if (tableMissing(tripError)) {
      return {
        trips: [],
        warning: "Public trips are not enabled yet. Run the database migration first.",
      };
    }

    return {
      trips: [],
      warning: "Could not load public trips right now.",
    };
  }

  const trips = (tripData ?? []) as TripRow[];
  if (!trips.length) {
    return { trips: [], warning: "" };
  }

  const tripIds = trips.map((trip) => trip.id);
  const creatorIds = Array.from(new Set(trips.map((trip) => trip.created_by)));

  const [stopResult, userResult, likesResult, savesResult] = await Promise.all([
    supabase.from("trip_stops").select("trip_id").in("trip_id", tripIds),
    supabase.from("users").select("id,username,email").in("id", creatorIds),
    userId
      ? supabase
          .from("trip_likes")
          .select("trip_id")
          .eq("user_id", userId)
          .in("trip_id", tripIds)
      : Promise.resolve({ data: [], error: null } as {
          data: unknown[];
          error: unknown;
        }),
    userId
      ? supabase
          .from("trip_saves")
          .select("trip_id")
          .eq("user_id", userId)
          .in("trip_id", tripIds)
      : Promise.resolve({ data: [], error: null } as {
          data: unknown[];
          error: unknown;
        }),
  ]);

  const stopCountMap = new Map<string, number>();

  (stopResult.data ?? []).forEach((row) => {
    const item = row as TripStopRow;
    stopCountMap.set(item.trip_id, (stopCountMap.get(item.trip_id) ?? 0) + 1);
  });

  const userMap = new Map<string, string>();

  (userResult.data ?? []).forEach((row) => {
    const user = row as UserRow;
    userMap.set(user.id, user.username ?? user.email?.split("@")[0] ?? "Explorer");
  });

  const likedTripIds = new Set(
    ((likesResult.data ?? []) as TripReactionRow[]).map((row) => row.trip_id)
  );

  const savedTripIds = new Set(
    ((savesResult.data ?? []) as TripReactionRow[]).map((row) => row.trip_id)
  );

  const ranked = trips
    .map((trip) => {
      const likesCount = trip.likes_count ?? 0;
      const savesCount = trip.saves_count ?? 0;
      const viewsCount = trip.views_count ?? 0;
      const stopCount = stopCountMap.get(trip.id) ?? 0;
      const score = likesCount * 5 + savesCount * 3 + viewsCount * 0.25 + stopCount * 2;

      return {
        id: trip.id,
        title: trip.title,
        description: trip.description ?? "",
        coverImage:
          trip.cover_image || "https://images.unsplash.com/photo-1527631746610-bca00a040d60",
        likesCount,
        savesCount,
        viewsCount,
        stopCount,
        score: Math.round(score * 10) / 10,
        authorName: userMap.get(trip.created_by) ?? "Explorer",
        likedByMe: likedTripIds.has(trip.id),
        savedByMe: savedTripIds.has(trip.id),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { trips: ranked, warning: "" };
}

