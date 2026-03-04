import { supabase } from "@/lib/Supabase/browser-client";

export async function evaluateBadges(userId: string) {
  const { data: badges } = await supabase.from("badges").select("*");

  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const owned = new Set(userBadges?.map(b => b.badge_id));

  const { data: userHotspots } = await supabase
    .from("user_hotspots")
    .select("status, created_at, hotspots(province, category)")
    .eq("user_id", userId);

  const visited = userHotspots?.filter(h => h.status === "visited") || [];

  for (const badge of badges || []) {
    if (owned.has(badge.id)) continue;

    let unlocked = false;

    switch (badge.condition_type) {
      case "visit_count":
        unlocked = visited.length >= badge.condition_value;
        break;

      case "region_count":
        const regions = new Set(
          visited.map(v => v.hotspots?.province)
        );
        unlocked = regions.size >= badge.condition_value;
        break;

      case "category_count":
        const category = badge.condition_meta?.category;
        const count = visited.filter(
          v => v.hotspots?.category === category
        ).length;
        unlocked = count >= badge.condition_value;
        break;
    }

    if (unlocked) {
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });

      await supabase.rpc("increment_xp", {
        user_id_input: userId,
        xp_amount: badge.xp_reward,
      });
    }
  }
}