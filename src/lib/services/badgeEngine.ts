import { supabase } from "@/lib/Supabase/browser-client";

interface Hotspot {
  id: string;
  province: string;
  category?: string;
  country?: string;
  is_hidden?: boolean;
}

interface RawVisitRow {
  hotspot_id: string;
  visited_at: string;
  hotspots: Hotspot | Hotspot[] | null;
}

interface UserHotspot {
  hotspot_id: string;
  visited_at: string;
  hotspot?: Hotspot;
}

export interface Badge {
  id: string;
  name: string;
  condition_type: string;
  condition_value: number;
  condition_meta?: {
    category?: string;
    country?: string;
  };
  xp_reward?: number;
}

interface UserStats {
  totalVisits: number;
  visitDates: Date[];
  provinces: Set<string>;
  categories: Map<string, number>;
  countryRegions: Map<string, Set<string>>;
  hiddenVisits: number;
}

function normalizeHotspot(joinedHotspot: RawVisitRow["hotspots"]): Hotspot | undefined {
  if (!joinedHotspot) return undefined;
  return Array.isArray(joinedHotspot) ? joinedHotspot[0] : joinedHotspot;
}

export async function evaluateBadges(userId: string): Promise<Badge[]> {
  const { data: badges, error: badgeError } = await supabase
    .from("badges")
    .select("*");

  if (badgeError || !badges) {
    if (badgeError) {
      console.error("Badge load error", badgeError);
    }
    return [];
  }

  const { data: owned, error: ownedError } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  if (ownedError) {
    console.error("Owned badge load error", ownedError);
    return [];
  }

  const ownedIds = new Set(
    (owned ?? []).map((entry: { badge_id: string }) => entry.badge_id)
  );

  const { data: visits, error: visitError } = await supabase
    .from("user_hotspots")
    .select(
      `
        hotspot_id,
        visited_at,
        hotspots (
          id,
          province,
          category,
          country,
          is_hidden
        )
      `
    )
    .eq("user_id", userId)
    .eq("visited", true);

  if (visitError || !visits) {
    if (visitError) {
      console.error("Visit load error", visitError);
    }
    return [];
  }

  const normalized: UserHotspot[] = (visits as RawVisitRow[])
    .map((visit) => ({
      hotspot_id: visit.hotspot_id,
      visited_at: visit.visited_at,
      hotspot: normalizeHotspot(visit.hotspots),
    }))
    .filter((visit) => Boolean(visit.visited_at));

  const stats = computeUserStats(normalized);
  const unlocked: Badge[] = [];

  for (const badge of badges as Badge[]) {
    if (ownedIds.has(badge.id)) continue;

    const shouldUnlock = evaluateCondition(badge, stats);
    if (!shouldUnlock) continue;

    const { error: saveError } = await supabase.from("user_badges").upsert(
      {
        user_id: userId,
        badge_id: badge.id,
      },
      {
        onConflict: "user_id,badge_id",
      }
    );

    if (saveError) {
      console.error("User badge save error", saveError);
      continue;
    }

    if (badge.xp_reward) {
      const { error: xpError } = await supabase.rpc("increment_xp", {
        p_user_id: userId,
        p_amount: badge.xp_reward,
      });

      if (xpError) {
        console.error("Badge XP reward error", xpError);
      }
    }

    unlocked.push(badge);
  }

  return unlocked;
}

function computeUserStats(visits: UserHotspot[]): UserStats {
  const provinces = new Set<string>();
  const categories = new Map<string, number>();
  const countryRegions = new Map<string, Set<string>>();
  const visitDates: Date[] = [];

  let hiddenVisits = 0;

  visits.forEach((visit) => {
    const date = new Date(visit.visited_at);
    if (!Number.isNaN(date.getTime())) {
      visitDates.push(date);
    }

    const hotspot = visit.hotspot;
    if (!hotspot) return;

    provinces.add(hotspot.province);

    if (hotspot.category) {
      categories.set(hotspot.category, (categories.get(hotspot.category) ?? 0) + 1);
    }

    if (hotspot.country) {
      if (!countryRegions.has(hotspot.country)) {
        countryRegions.set(hotspot.country, new Set());
      }

      countryRegions.get(hotspot.country)?.add(hotspot.province);
    }

    if (hotspot.is_hidden) {
      hiddenVisits += 1;
    }
  });

  return {
    totalVisits: visitDates.length,
    visitDates,
    provinces,
    categories,
    countryRegions,
    hiddenVisits,
  };
}

function evaluateCondition(badge: Badge, stats: UserStats): boolean {
  switch (badge.condition_type) {
    case "visit_count":
      return stats.totalVisits >= badge.condition_value;

    case "category_count": {
      const category = badge.condition_meta?.category;
      if (!category) return false;
      const count = stats.categories.get(category) ?? 0;
      return count >= badge.condition_value;
    }

    case "region_count": {
      const country = badge.condition_meta?.country;
      if (!country) return false;
      const regions = stats.countryRegions.get(country);
      return (regions?.size ?? 0) >= badge.condition_value;
    }

    case "visit_streak":
      return calculateStreak(stats.visitDates) >= badge.condition_value;

    case "hidden_gems":
      return stats.hiddenVisits >= badge.condition_value;

    case "early_visit":
      return stats.visitDates.some((date) => date.getHours() < 7);

    case "late_visit":
      return stats.visitDates.some((date) => date.getHours() >= 22);

    default:
      return false;
  }
}

function calculateStreak(dates: Date[]): number {
  if (!dates.length) return 0;

  const dayKeys = Array.from(
    new Set(
      dates
        .map((date) => {
          const normalized = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );
          return normalized.getTime();
        })
        .sort((a, b) => a - b)
    )
  );

  if (!dayKeys.length) return 0;

  let streak = 1;
  let maxStreak = 1;

  for (let i = 1; i < dayKeys.length; i += 1) {
    const diffDays = (dayKeys[i] - dayKeys[i - 1]) / 86400000;

    if (diffDays === 1) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  return maxStreak;
}