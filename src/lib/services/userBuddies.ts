import { supabase } from "@/lib/Supabase/browser-client";
import { awardXP } from "./gamification";

export async function addBuddy(userId: string, buddyId: string) {
  const { data, error } = await supabase.from("user_buddies").insert({
    user1_id: userId,
    user2_id: buddyId,
    status: 'accepted',
  }).select().single();

  if (error) throw error;

  await awardXP(userId, 'xp_making_buddy');
  await awardXP(buddyId, 'xp_making_buddy');

  return data;
}

export async function getBuddyCount(userId: string) {
  const { count, error } = await supabase
    .from("user_buddies")
    .select("*", { count: "exact", head: true })
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq("status", "accepted");

  return error ? 0 : count || 0;
}

