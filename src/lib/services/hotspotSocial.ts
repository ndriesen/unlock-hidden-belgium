import { supabase } from "@/lib/Supabase/browser-client";
import { recordActivity } from "@/lib/services/activity";

export interface HotspotReactionState {
  liked: boolean;
  saved: boolean;
}

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

async function toggleGeneric(params: {
  table: "hotspot_likes" | "hotspot_saves";
  userId: string;
  hotspotId: string;
}): Promise<boolean> {
  const { data: existing } = await supabase
    .from(params.table)
    .select("hotspot_id")
    .eq("user_id", params.userId)
    .eq("hotspot_id", params.hotspotId)
    .maybeSingle();

  if (existing) {
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

