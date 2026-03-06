import { supabase } from "@/lib/Supabase/browser-client";
import { evaluateBadges } from "./badgeEngine";
import { addXp } from "./xpEngine";

export async function markVisited(
  userId: string,
  hotspotId: string
) {
  // 1️⃣ Mark as visited with timestamp
  const { error } = await supabase
    .from("user_hotspots")
    .upsert(
      {
        user_id: userId,
        hotspot_id: hotspotId,
        visited: true,
        visited_at: new Date().toISOString(),
      },
      { onConflict: "user_id,hotspot_id" }
    );

  if (error) throw error;

  // 2️⃣ Add XP
  await addXp(userId, 50);

  // 3️⃣ Evaluate badges
  const unlockedBadges =
    await evaluateBadges(userId);

  return unlockedBadges;
}

export async function toggleFavorite(userId: string, hotspotId: string) {
  const { data } = await supabase
    .from("user_hotspots")
    .select("favorite")
    .eq("user_id", userId)
    .eq("hotspot_id", hotspotId)
    .single();

  const newValue = !data?.favorite;

  await supabase.from("user_hotspots").upsert(
    {
      user_id: userId,
      hotspot_id: hotspotId,
      favorite: newValue,
    },
    { onConflict: "user_id,hotspot_id" }
  );

  return newValue;
}

export async function toggleWishlist(userId: string, hotspotId: string) {
  const { data } = await supabase
    .from("user_hotspots")
    .select("wishlist")
    .eq("user_id", userId)
    .eq("hotspot_id", hotspotId)
    .single();

  const newValue = !data?.wishlist;

  await supabase.from("user_hotspots").upsert(
    {
      user_id: userId,
      hotspot_id: hotspotId,
      wishlist: newValue,
    },
    { onConflict: "user_id,hotspot_id" }
  );

  return newValue;
}