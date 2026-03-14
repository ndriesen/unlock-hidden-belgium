import { supabase } from "@/lib/Supabase/browser-client";
import { awardXP } from "./gamification";

export async function uploadUserPhoto(userId: string, photoPath: string, context?: {hotspotId?: string, tripId?: string}) {
  const { data, error } = await supabase.from("user_photos").insert({
    user_id: userId,
    storage_path: photoPath,
    ...(context || {}),
  }).select().single();

  if (error) throw error;

  // Trigger XP/badge
  await awardXP(userId, 'xp_uploading_photo', context);

  return data;
}

export async function getUserPhotoCount(userId: string) {
  const { count, error } = await supabase
    .from("user_photos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return error ? 0 : count || 0;
}
