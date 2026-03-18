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

import { recordActivity } from "./activity";

export async function sendBuddyRequest(fromUserId: string, toUserId: string) {
  // Normalize ordering: smaller id first
  const user1Id = fromUserId < toUserId ? fromUserId : toUserId;
  const user2Id = fromUserId < toUserId ? toUserId : fromUserId;
  const requesterId = fromUserId;

  // Check if already exists (symmetric)
  const { data: existing } = await supabase
    .from("user_buddies")
    .select("id, status")
    .eq("user1_id", user1Id)
    .eq("user2_id", user2Id)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error("Already buddies");
    }
    if (existing.status === 'pending') {
      throw new Error("Request already sent");
    }
  }

  const { data, error } = await supabase
    .from("user_buddies")
    .insert({
      user1_id: user1Id,
      user2_id: user2Id,
      status: 'pending',
      requester_id: requesterId
    })
    .select("id")
    .single();

  if (error) throw error;

  await recordActivity({
    actorId: fromUserId,
    activityType: "buddy_request_sent",
    entityType: "user",
    entityId: toUserId,
    message: "sent you a buddy request",
    notifyUserIds: [toUserId]
  });

  return data.id;
}

export async function acceptBuddyRequest(buddyPairId: string, acceptorId: string) {
  const { data: request } = await supabase
    .from("user_buddies")
    .select("user1_id, user2_id, requester_id")
    .eq("id", buddyPairId)
    .eq("status", "pending")
    .single();

  if (!request) {
    throw new Error("Request not found or already processed");
  }

  // Verify authorization
  if (acceptorId !== request.requester_id && acceptorId !== request.user1_id && acceptorId !== request.user2_id) {
    throw new Error("Not authorized");
  }

  const { error: updateError } = await supabase
    .from("user_buddies")
    .update({ status: 'accepted' })
    .eq("id", buddyPairId);

  if (updateError) throw updateError;

  const otherUserId = request.user1_id === acceptorId ? request.user2_id : request.user1_id;

  await recordActivity({
    actorId: acceptorId,
    activityType: "buddy_request_accepted",
    entityType: "user",
    entityId: otherUserId,
    message: "accepted your buddy request",
    notifyUserIds: [otherUserId]
  });

  // XP
  await awardXP(acceptorId, 'xp_making_buddy');
  await awardXP(otherUserId, 'xp_making_buddy');

  return true;
}

