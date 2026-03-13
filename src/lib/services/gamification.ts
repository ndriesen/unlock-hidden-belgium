import { supabase } from "@/lib/Supabase/browser-client";
import { evaluateBadges } from "./badgeEngine";
import { addXp } from "./xpEngine";
import { recordActivity } from "./activity";

async function upsertBooleanFlag(
  userId: string,
  hotspotId: string,
  field: "favorite" | "wishlist",
  value: boolean
) {
  const { error } = await supabase.from("user_hotspots").upsert(
    {
      user_id: userId,
      hotspot_id: hotspotId,
      [field]: value,
    },
    { onConflict: "user_id,hotspot_id" }
  );

  if (error) {
    throw error;
  }
}

export async function markVisited(userId: string, hotspotId: string) {
  const { error } = await supabase.from("user_hotspots").upsert(
    {
      user_id: userId,
      hotspot_id: hotspotId,
      visited: true,
      visited_at: new Date().toISOString(),
    },
    { onConflict: "user_id,hotspot_id" }
  );

  if (error) {
    throw error;
  }

  await addXp(userId, 50);

  const unlockedBadges = await evaluateBadges(userId);

  if (unlockedBadges.length) {
    await Promise.all(
      unlockedBadges.map((badge) =>
        recordActivity({
          actorId: userId,
          activityType: "badge_earned",
          entityType: "badge",
          entityId: badge.id,
          message: `earned the badge ${badge.name}`,
          metadata: { badgeId: badge.id, badgeName: badge.name },
          visibility: "private",
          notifyUserIds: [userId],
          notifyActor: true,
        })
      )
    );
  }

  return unlockedBadges;
}

export async function toggleFavorite(userId: string, hotspotId: string) {
  const { data, error } = await supabase
    .from("user_hotspots")
    .select("favorite")
    .eq("user_id", userId)
    .eq("hotspot_id", hotspotId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const newValue = !Boolean(data?.favorite);
  await upsertBooleanFlag(userId, hotspotId, "favorite", newValue);

  return newValue;
}

export async function toggleWishlist(userId: string, hotspotId: string) {
  const { data, error } = await supabase
    .from("user_hotspots")
    .select("wishlist")
    .eq("user_id", userId)
    .eq("hotspot_id", hotspotId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const newValue = !Boolean(data?.wishlist);
  await upsertBooleanFlag(userId, hotspotId, "wishlist", newValue);

  return newValue;
}
