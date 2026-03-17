import { supabase } from "@/lib/Supabase/browser-client";
import { recordActivity } from "@/lib/services/activity";

export interface HotspotReactionState {
  liked: boolean;
  saved: boolean;
}

// Generic toggle function for likes / saves
async function toggleGeneric(params: {
  table: "hotspot_likes" | "hotspot_saves";
  userId: string;
  hotspotId: string;
}): Promise<boolean> {
  const { data, error: checkError } = await supabase
    .from(params.table)
    .select("hotspot_id")
    .eq("user_id", params.userId)
    .eq("hotspot_id", params.hotspotId)
    .maybeSingle();

  if (checkError) {
    console.error("Check failed:", checkError);
    return false;
  }

  if (data && data.hotspot_id) {
    await supabase
      .from(params.table)
      .delete()
      .eq("user_id", params.userId)
      .eq("hotspot_id", params.hotspotId);

    return false;
  }

  await supabase.from(params.table).insert({
    user_id: params.userId,
    hotspot_id: params.hotspotId,
  });

  return true;
}

// Toggle like
export async function toggleHotspotLike(params: {
  userId: string;
  hotspotId: string;
  hotspotName: string;
}): Promise<boolean> {
  const liked = await toggleGeneric({
    table: "hotspot_likes",
    userId: params.userId,
    hotspotId: params.hotspotId,
  });

  if (liked) {
    await recordActivity({
      actorId: params.userId,
      activityType: "hotspot_liked",
      entityType: "hotspot",
      entityId: params.hotspotId,
      message: `liked ${params.hotspotName}`,
      visibility: "friends",
      metadata: { hotspotName: params.hotspotName },
    });
  }

  return liked;
}

// Toggle save
export async function toggleHotspotSave(params: {
  userId: string;
  hotspotId: string;
  hotspotName: string;
}): Promise<boolean> {
  const saved = await toggleGeneric({
    table: "hotspot_saves",
    userId: params.userId,
    hotspotId: params.hotspotId,
  });

  if (saved) {
    await recordActivity({
      actorId: params.userId,
      activityType: "hotspot_saved",
      entityType: "hotspot",
      entityId: params.hotspotId,
      message: `saved ${params.hotspotName}`,
      visibility: "friends",
      metadata: { hotspotName: params.hotspotName },
    });
  }

  return saved;
}

// Fetch initial state of likes & saves for a user
export async function fetchHotspotReactionState(
  userId: string,
  hotspotId: string
): Promise<HotspotReactionState> {
  const [{ data: likeData }, { data: saveData }] = await Promise.all([
    supabase
      .from("hotspot_likes")
      .select("hotspot_id")
      .eq("user_id", userId)
      .eq("hotspot_id", hotspotId)
      .maybeSingle(),
    supabase
      .from("hotspot_saves")
      .select("hotspot_id")
      .eq("user_id", userId)
      .eq("hotspot_id", hotspotId)
      .maybeSingle(),
  ]);

  return {
    liked: Boolean(likeData),
    saved: Boolean(saveData),
  };
}

// Record hotspot view with 24h throttling/deduplication
export async function recordHotspotView(
  userId: string | null,
  hotspotId: string,
  hotspotName: string,
  ipHash?: string
): Promise<boolean> {
  if (!userId && !ipHash) return false; // Cannot dedup anonymous without IP

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("hotspot_views")
    .select("id")
    .eq("hotspot_id", hotspotId)
    .gte("created_at", cutoff);

  if (userId) {
    query = query.eq("viewer_id", userId);
  } else if (ipHash) {
    query = query.eq("ip_hash", ipHash);
  }

  const { data: recentView } = await query.maybeSingle();

  if (recentView) return false; // Throttled

  const { error } = await supabase.from("hotspot_views").insert({
    hotspot_id: hotspotId,
    viewer_id: userId || null,
    ip_hash: ipHash || null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("View insert failed:", error);
    return false;
  }

  // Optional activity for logged-in users
  if (userId) {
    await recordActivity({
      actorId: userId,
      activityType: "hotspot_viewed",
      entityType: "hotspot",
      entityId: hotspotId,
      message: `viewed ${hotspotName}`,
      visibility: "private",
      metadata: { hotspotName },
    }).catch(console.error);
  }

  return true;
}

