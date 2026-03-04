import { supabase } from "@/lib/supabase/browser-client";

export async function markVisited(userId: string, hotspotId: string) {
  await supabase.from("user_hotspots").upsert({
    user_id: userId,
    hotspot_id: hotspotId,
    status: "visited",
    visited_at: new Date(),
  });

  await supabase.rpc("increment_xp", { p_user_id: userId });
  await supabase.rpc("award_badges", { p_user_id: userId });
}