import { supabase } from "@/lib/Supabase/browser-client";

interface HotspotJoinRow {
  id: string;
  name: string;
  category: string | null;
  province: string | null;
  description: string | null;
  images: string[] | null;
  visit_count: number | null;
  likes_count: number | null;
  saves_count: number | null;
  latitude: number | string | null;
  longitude: number | string | null;
}

interface UserHotspotRow {
  hotspot_id: string;
  visited: boolean | null;
  wishlist: boolean | null;
  favorite: boolean | null;
  visited_at: string | null;
  hotspots: HotspotJoinRow | HotspotJoinRow[] | null;
}

interface ReviewRow {
  hotspot_id: string;
  rating: number;
}

export interface MyHotspotEntry {
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
  latitude: number;
  longitude: number;
  visited: boolean;
  wishlist: boolean;
  favorite: boolean;
  visitedAt: string | null;
}

function normalizeHotspot(joined: UserHotspotRow["hotspots"]): HotspotJoinRow | null {
  if (!joined) return null;
  return Array.isArray(joined) ? joined[0] ?? null : joined;
}

function safeImage(images: string[] | null | undefined): string {
  return images?.[0] ?? "https://images.unsplash.com/photo-1469474968028-56623f02e42e";
}

function buildReviewStats(rows: ReviewRow[]): Map<string, { count: number; avg: number }> {
  const bucket = new Map<string, { sum: number; count: number }>();

  rows.forEach((row) => {
    const current = bucket.get(row.hotspot_id) ?? { sum: 0, count: 0 };
    current.sum += Number(row.rating) || 0;
    current.count += 1;
    bucket.set(row.hotspot_id, current);
  });

  const out = new Map<string, { count: number; avg: number }>();

  bucket.forEach((value, key) => {
    out.set(key, {
      count: value.count,
      avg: value.count ? Math.round((value.sum / value.count) * 10) / 10 : 0,
    });
  });

  return out;
}

export async function fetchMyHotspots(userId: string): Promise<MyHotspotEntry[]> {
  const { data, error } = await supabase
    .from("user_hotspots")
    .select(
      "hotspot_id,visited,wishlist,favorite,visited_at,hotspots(id,name,category,province,description,images,visit_count,likes_count,saves_count,latitude,longitude)"
    )
    .eq("user_id", userId)
    .or("visited.eq.true,wishlist.eq.true,favorite.eq.true");

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as UserHotspotRow[];
  const hotspotIds = rows.map((row) => row.hotspot_id);

  const reviewData = hotspotIds.length
    ? (
        await supabase
          .from("reviews")
          .select("hotspot_id,rating")
          .in("hotspot_id", hotspotIds)
      ).data
    : [];

  const reviewStats = buildReviewStats((reviewData ?? []) as ReviewRow[]);

  return rows
    .map((row) => {
      const hotspot = normalizeHotspot(row.hotspots);
      if (!hotspot) return null;

      const latitude = Number(hotspot.latitude);
      const longitude = Number(hotspot.longitude);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
      }

      const review = reviewStats.get(row.hotspot_id) ?? { count: 0, avg: 0 };

      return {
        id: hotspot.id,
        name: hotspot.name,
        category: hotspot.category ?? "Unknown",
        province: hotspot.province ?? "Unknown",
        description: hotspot.description ?? "No description yet.",
        imageUrl: safeImage(hotspot.images),
        visitCount: hotspot.visit_count ?? 0,
        reviewCount: review.count,
        averageRating: review.avg,
        likesCount: hotspot.likes_count ?? 0,
        savesCount: hotspot.saves_count ?? 0,
        latitude,
        longitude,
        visited: Boolean(row.visited),
        wishlist: Boolean(row.wishlist),
        favorite: Boolean(row.favorite),
        visitedAt: row.visited_at,
      };
    })
    .filter((entry): entry is MyHotspotEntry => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

