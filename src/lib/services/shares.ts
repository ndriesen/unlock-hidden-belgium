import { supabase } from "@/lib/Supabase/browser-client";
import { awardXP } from "./gamification";

export async function createShare(userId: string, hotspotId: string, platform: string) {
  const { data, error } = await supabase.from("shares").insert({
    user_id: userId,
    hotspot_id: hotspotId,
    platform,
  }).select().single();

  if (error) throw error;

  await awardXP(userId, 'xp_sharing_content', { hotspotId });

  return data;
}

export async function getUserShareCount(userId: string) {
  const { count, error } = await supabase
    .from("shares")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return error ? 0 : count || 0;
}

