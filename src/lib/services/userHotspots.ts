import { supabase } from "@/lib/Supabase/browser-client";

export type UserHotspotCollection =
  | "all"
  | "visited"
  | "wishlist"
  | "favorite";

export interface HotspotSummary {
  id: string;
  name: string;
  category: string | null;
  province: string | null;
}

export interface UserHotspotEntry {
  hotspot: HotspotSummary;
  visited: boolean;
  wishlist: boolean;
  favorite: boolean;
  visitedAt: string | null;
}

interface UserHotspotRow {
  visited: boolean | null;
  wishlist: boolean | null;
  favorite: boolean | null;
  visited_at: string | null;
  hotspots: HotspotSummary | HotspotSummary[] | null;
}

const ACTIVE_COLLECTION_FILTER =
  "visited.eq.true,wishlist.eq.true,favorite.eq.true";

function normalizeHotspot(
  joinedHotspot: UserHotspotRow["hotspots"]
): HotspotSummary | null {
  if (!joinedHotspot) return null;
  if (Array.isArray(joinedHotspot)) {
    return joinedHotspot[0] ?? null;
  }
  return joinedHotspot;
}

export async function fetchUserHotspotCollection(
  userId: string,
  collection: UserHotspotCollection
): Promise<UserHotspotEntry[]> {
  let query = supabase
    .from("user_hotspots")
    .select(`
      visited,
      wishlist,
      favorite,
      visited_at,
      hotspots(id, name, category, province)
    `)
    .eq("user_id", userId);

  if (collection === "all") {
    query = query.or(ACTIVE_COLLECTION_FILTER);
  } else {
    query = query.eq(collection, true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as UserHotspotRow[];

  return rows
    .map((row) => {
      const hotspot = normalizeHotspot(row.hotspots);
      if (!hotspot) return null;

      return {
        hotspot,
        visited: Boolean(row.visited),
        wishlist: Boolean(row.wishlist),
        favorite: Boolean(row.favorite),
        visitedAt: row.visited_at,
      };
    })
    .filter((entry): entry is UserHotspotEntry => entry !== null);
}