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

    // Record activity
    try {
      // Activity for FOLLOWED user
      await recordActivity({
        actorId: followerId,
        activityType: "new_follower",
        entityType: "user",
        entityId: followedId,
        message: "started following you",
        visibility: "private",
        notifyUserIds: [followedId],
      });

      // Activity for FOLLOWER
      const { data: followedUser } = await supabase
        .from("users")
        .select("username")
        .eq("id", followedId)
        .maybeSingle();

      const username = followedUser?.username ?? "Explorer";

      await recordActivity({
        actorId: followerId,
        activityType: "new_following",
        entityType: "user",
        entityId: followedId,
        message: `You started following ${username}`,
        visibility: "private",
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

export interface Follower {
  id: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
}

export async function getFollowers(userId: string): Promise<Follower[]> {
  const { data, error } = await supabase
    .from("user_follows")
    .select(`
      follower_id,
      users!follower_id (id, username, avatar_url, city)
    `)
    .eq("followed_id", userId)
    .eq("status", "accepted");

  if (error) {
    console.error('getFollowers error:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.follower_id,
    name: row.users?.username || row.users?.email?.split('@')[0] || 'Explorer',
    avatarUrl: row.users?.avatar_url || null,
    city: row.users?.city || null,
  }));
}

export async function getFollowing(userId: string): Promise<Follower[]> {
  const { data, error } = await supabase
    .from("user_follows")
    .select(`
      followed_id,
      users!followed_id (id, username, avatar_url, city)
    `)
    .eq("follower_id", userId)
    .eq("status", "accepted");

  if (error) {
    console.error('getFollowing error:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.followed_id,
    name: row.users?.username || row.users?.email?.split('@')[0] || 'Explorer',
    avatarUrl: row.users?.avatar_url || null,
    city: row.users?.city || null,
  }));
}
