import { supabase } from "@/lib/Supabase/browser-client";

interface HotspotRow {
  id: string;
  name: string;
  category: string | null;
  province: string | null;
  description: string | null;
  images: string[] | null;
  visit_count: number | null;
  likes_count: number | null;
  saves_count: number | null;
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
  const { data: hotspotData, error: hotspotError } = await supabase
    .from("hotspots")
    .select("id,name,category,province,description,images,visit_count,likes_count,saves_count");

  if (hotspotError || !hotspotData) {
    throw hotspotError ?? new Error("Could not load hotspots");
  }

  const rows = hotspotData as HotspotRow[];
  const hotspotIds = rows.map((row) => row.id);

  if (!hotspotIds.length) {
    return [];
  }

  const { data: reviewData } = await supabase
    .from("reviews")
    .select("hotspot_id,rating")
    .in("hotspot_id", hotspotIds);

  const reviewStats = buildReviewStats((reviewData ?? []) as ReviewRow[]);

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

    (userFlags ?? []).forEach((entry) => {
      const row = entry as UserFlagRow;
      flagMap.set(row.hotspot_id, {
        visited: Boolean(row.visited),
        wishlist: Boolean(row.wishlist),
        favorite: Boolean(row.favorite),
      });
    });

    if (!likesResult.error) {
      (likesResult.data ?? []).forEach((row) => {
        likedByMe.add((row as HotspotReactionRow).hotspot_id);
      });
    }

    if (!savesResult.error) {
      (savesResult.data ?? []).forEach((row) => {
        savedByMe.add((row as HotspotReactionRow).hotspot_id);
      });
    }
  }

  return rows
    .map((row) => {
      const review = reviewStats.get(row.id) ?? { count: 0, avg: 0 };
      const flags = flagMap.get(row.id) ?? {
        visited: false,
        wishlist: false,
        favorite: false,
      };

      return {
        id: row.id,
        name: row.name,
        category: row.category ?? "Unknown",
        province: row.province ?? "Unknown",
        description: row.description ?? "No description yet.",
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

