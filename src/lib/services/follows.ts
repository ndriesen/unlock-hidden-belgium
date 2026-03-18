import { supabase } from "@/lib/Supabase/browser-client";
import { recordActivity } from "./activity";

export async function toggleFollow(followerId: string, followedId: string): Promise<boolean> {
  console.log('toggleFollow called:', {followerId: followerId.slice(-4), followedId: followedId.slice(-4)}); // Truncated for log
  
  // Check current status
  const { data: current, error: checkError } = await supabase
    .from("user_follows")
    .select("status")
    .eq("follower_id", followerId)
    .eq("followed_id", followedId)
    .maybeSingle();

  if (checkError) {
    console.error('Check follow status error:', checkError);
    throw checkError;
  }

  const isFollowing = current?.status === 'accepted';
  console.log('Current follow status:', isFollowing);

  if (isFollowing) {
    // Unfollow
    const { error: deleteError } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("followed_id", followedId);

    if (deleteError) {
      console.error('Unfollow error:', deleteError);
      throw deleteError;
    }
    console.log('Unfollowed successfully');
    return false;
  } else {
    
    // Follow
    const { data, error: insertError } = await supabase
      .from("user_follows")
      .insert({
        follower_id: followerId,
        followed_id: followedId,
        status: 'accepted',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Follow insert error:', insertError);
      throw insertError;
    }

    console.log('Followed successfully:', data);

    // Record activity (ignore if recordActivity not available)
    // When someone follows another user
    try {
      
 // 1️⃣ Activity for FOLLOWED user
  await recordActivity({
    actorId: followerId,
    activityType: "new_follower",
    entityType: "user",
    entityId: followedId,
    message: "started following you",
    visibility: "private",              // 🔥 KEY CHANGE
    notifyUserIds: [followedId],
  });

      // 2️⃣ Activity for the actor (follower) to show "You started following {username}"
      const { data: followedUser } = await supabase
        .from("users")
        .select("username")
        .eq("id", followedId)
        .maybeSingle();

      const username = followedUser?.username ?? "Explorer";

      // 2️⃣ Activity for FOLLOWER (actor)
      await recordActivity({
        actorId: followerId,
        activityType: "new_following",
        entityType: "user",
        entityId: followedId,
        message: `You started following ${username}`,
        visibility: "private",              // 🔥 KEY CHANGE
        notifyUserIds: [followerId],
        notifyActor: false,
      });

     
    } catch (activityError) {
      console.warn("Activity record skipped:", activityError);
    }

    return true;
  }
}

export async function isFollowing(
  followerId: string,
  followedId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("followed_id", followedId);

  if (error) {
    console.error("isFollowing error:", error);
    return false;
  }

  return data.length > 0;
}

export async function getFollowersCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("followed_id", userId)
    .eq("status", "accepted");

  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId)
    .eq("status", "accepted");

  return count ?? 0;
}

