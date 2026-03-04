import { addXp } from "@/lib/services/xpEngine";
import { evaluateAchievements } from "@/lib/services/achievements";
import { supabase } from "../Supabase/browser-client";

export async function markVisited(userId: string, hotspotId: string) {
  await supabase.from("user_hotspots").upsert({
    user_id: userId,
    hotspot_id: hotspotId,
    status: "visited",
  });

  const xpResult = await addXp(userId, 50);

  const newBadges = await evaluateAchievements(userId);

  return {
    xpResult,
    newBadges,
  };
}