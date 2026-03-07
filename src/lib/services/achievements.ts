import { supabase } from "@/lib/Supabase/browser-client";

interface AchievementHotspotRow {
  visited: boolean;
  hotspots: { province: string } | { province: string }[] | null;
}

interface AchievementBadge {
  id: string;
  condition_type: string;
  condition_value: number;
}

function normalizeProvince(
  joined: AchievementHotspotRow["hotspots"]
): string | null {
  if (!joined) return null;
  const hotspot = Array.isArray(joined) ? joined[0] : joined;
  return hotspot?.province ?? null;
}

export async function evaluateAchievements(userId: string) {
  const { data: userHotspots, error: hotspotError } = await supabase
    .from("user_hotspots")
    .select("visited, hotspots(province)")
    .eq("user_id", userId);

  if (hotspotError || !userHotspots) {
    if (hotspotError) {
      console.error("Achievement hotspot load error:", hotspotError);
    }
    return [];
  }

  const rows = userHotspots as AchievementHotspotRow[];
  const visited = rows.filter((row) => row.visited);

  const visitedCount = visited.length;

  const provincesVisited = new Set(
    visited
      .map((row) => normalizeProvince(row.hotspots))
      .filter((province): province is string => Boolean(province))
  );

  const unlockedBadges: AchievementBadge[] = [];

  const { data: badges, error: badgeError } = await supabase
    .from("badges")
    .select("id, condition_type, condition_value");

  if (badgeError || !badges) {
    if (badgeError) {
      console.error("Achievement badge load error:", badgeError);
    }
    return [];
  }

  for (const badge of badges as AchievementBadge[]) {
    let conditionMet = false;

    if (badge.condition_type === "visits") {
      conditionMet = visitedCount >= badge.condition_value;
    }

    if (badge.condition_type === "provinces") {
      conditionMet = provincesVisited.size >= badge.condition_value;
    }

    if (!conditionMet) continue;

    const { data: existing, error: existingError } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .maybeSingle();

    if (existingError) {
      console.error("Achievement badge check error:", existingError);
      continue;
    }

    if (!existing) {
      const { error: insertError } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });

      if (insertError) {
        console.error("Achievement badge insert error:", insertError);
        continue;
      }

      unlockedBadges.push(badge);
    }
  }

  return unlockedBadges;
}