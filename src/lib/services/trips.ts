import { supabase } from "@/lib/Supabase/browser-client";
import { awardXP } from "./gamification";

export async function createTripWithBuddy(userId: string, tripData: {name: string, buddy_ids: string[]}) {
  const { data, error } = await supabase.from("user_trips").insert({
    user_id: userId,
    name: tripData.name,
    buddy_ids: tripData.buddy_ids,
  }).select().single();

  if (error) throw error;

  if (tripData.buddy_ids.length > 0) {
    await awardXP(userId, 'xp_making_trip_together');
  } else {
    await awardXP(userId, 'xp_making_trips');
  }

  return data;
}

export async function getTripWithBuddyCount(userId: string) {
  const { count, error } = await supabase
    .from("user_trips")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("buddy_ids", JSON.stringify([]));

  return error ? 0 : count || 0;
}

