import { supabase } from "@/lib/Supabase/browser-client";

export async function evaluateAchievements(userId: string) {
  const { data: userHotspots } = await supabase
    .from("user_hotspots")
    .select("status, hotspots(province)")
    .eq("user_id", userId);

  if (!userHotspots) return [];

  const visited = userHotspots.filter(
    (h: any) => h.status === "visited"
  );

  const visitedCount = visited.length;
  const provincesVisited = new Set(
    visited.map((v: any) => v.hotspots.province)
  );

  const unlockedBadges: any[] = [];

  const { data: badges } = await supabase
    .from("badges")
    .select("*");

  if (!badges) return [];

  for (const badge of badges) {
    let conditionMet = false;

    if (badge.condition_type === "visits") {
      conditionMet = visitedCount >= badge.condition_value;
    }

    if (badge.condition_type === "provinces") {
      conditionMet =
        provincesVisited.size >= badge.condition_value;
    }

    if (!conditionMet) continue;

    const { data: existing } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .single();

    if (!existing) {
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });

      unlockedBadges.push(badge);
    }
  }

  return unlockedBadges;
}