import { supabase } from "@/lib/Supabase/browser-client";
import { awardXP } from "./gamification";

export interface Review {
  id: string;
  hotspot_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export async function addReview(userId: string, hotspotId: string, rating: number, comment?: string) {
  const { data, error } = await supabase.from("reviews").insert({
    user_id: userId,
    hotspot_id: hotspotId,
    rating,
    comment: comment || null,
  }).select().single();

  if (error) throw error;

  // Trigger XP/badge
  await awardXP(userId, 'xp_writing_review', { hotspotId });

  return data as Review;
}

export async function fetchHotspotReviews(hotspotId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, users(username, avatar_url)")
    .eq("hotspot_id", hotspotId)
    .order("created_at", { ascending: false });

  if (error) return [];

  return data as Review[];
}

export async function getUserReviewCount(userId: string) {
  const { count, error } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return error ? 0 : count || 0;
}
