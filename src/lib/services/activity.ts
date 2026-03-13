import { supabase } from "@/lib/Supabase/browser-client";

interface ActivityRow {
  id: string;
  actor_id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string | null;
  message: string;
  metadata: Record<string, unknown>;
  visibility: "private" | "friends" | "public";
  created_at: string;
}

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface NotificationRow {
  id: string;
  user_id: string;
  activity_id: string;
  created_at: string;
  read_at: string | null;
  activities: ActivityRow | ActivityRow[] | null;
}

export interface ActivityItem {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string;
  type: string;
  entityType: string;
  entityId: string | null;
  message: string;
  metadata: Record<string, unknown>;
  visibility: "private" | "friends" | "public";
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  activityId: string;
  readAt: string | null;
  createdAt: string;
  activity: ActivityItem;
}

function normalizeUserDisplay(user: UserRow | undefined): { name: string; avatarUrl: string } {
  return {
    name: user?.username ?? user?.email?.split("@")[0] ?? "Explorer",
    avatarUrl: user?.avatar_url ?? "",
  };
}

function normalizeActivity(
  activity: ActivityRow,
  usersMap: Map<string, UserRow>
): ActivityItem {
  const actor = normalizeUserDisplay(usersMap.get(activity.actor_id));

  return {
    id: activity.id,
    actorId: activity.actor_id,
    actorName: actor.name,
    actorAvatarUrl: actor.avatarUrl,
    type: activity.activity_type,
    entityType: activity.entity_type,
    entityId: activity.entity_id,
    message: activity.message,
    metadata: activity.metadata ?? {},
    visibility: activity.visibility,
    createdAt: activity.created_at,
  };
}

function normalizeJoinedActivity(
  joined: NotificationRow["activities"]
): ActivityRow | null {
  if (!joined) return null;
  return Array.isArray(joined) ? joined[0] ?? null : joined;
}

export async function recordActivity(params: {
  actorId: string;
  activityType: string;
  entityType: string;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
  visibility?: "private" | "friends" | "public";
  notifyUserIds?: string[];
  notifyActor?: boolean;
}): Promise<void> {
  const { data: inserted, error } = await supabase
    .from("activities")
    .insert({
      actor_id: params.actorId,
      activity_type: params.activityType,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      message: params.message.slice(0, 240),
      metadata: params.metadata ?? {},
      visibility: params.visibility ?? "friends",
    })
    .select("id")
    .maybeSingle();

  if (error || !inserted) {
    return;
  }

  const { data: followers } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("followed_id", params.actorId)
    .eq("status", "accepted");

  const followerIds = (followers ?? [])
    .map((row) => (row as { follower_id: string }).follower_id)
    .filter((id) => id !== params.actorId);

  const explicitIds = params.notifyUserIds ?? [];
  const includeActor = params.notifyActor ?? false;

  const targetIds = Array.from(new Set([...followerIds, ...explicitIds])).filter(
    (id) => (includeActor ? true : id !== params.actorId)
  );

  if (!targetIds.length) {
    return;
  }

  await supabase.from("notifications").insert(
    targetIds.map((userId) => ({
      user_id: userId,
      activity_id: inserted.id,
    }))
  );
}

async function fetchUsersMap(userIds: string[]): Promise<Map<string, UserRow>> {
  if (!userIds.length) return new Map();

  const { data } = await supabase
    .from("users")
    .select("id,username,email,avatar_url")
    .in("id", userIds);

  const map = new Map<string, UserRow>();

  (data ?? []).forEach((row) => {
    const user = row as UserRow;
    map.set(user.id, user);
  });

  return map;
}

export async function fetchActivityFeed(limit = 30): Promise<ActivityItem[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("id,actor_id,activity_type,entity_type,entity_id,message,metadata,visibility,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const rows = data as ActivityRow[];
  const actorIds = Array.from(new Set(rows.map((row) => row.actor_id)));
  const usersMap = await fetchUsersMap(actorIds);

  return rows.map((row) => normalizeActivity(row, usersMap));
}

export async function fetchNotifications(userId: string, limit = 40): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,user_id,activity_id,created_at,read_at,activities(id,actor_id,activity_type,entity_type,entity_id,message,metadata,visibility,created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const rows = data as NotificationRow[];
  const activityRows = rows
    .map((row) => normalizeJoinedActivity(row.activities))
    .filter((row): row is ActivityRow => row !== null);

  const actorIds = Array.from(new Set(activityRows.map((activity) => activity.actor_id)));
  const usersMap = await fetchUsersMap(actorIds);

  return rows
    .map((row) => {
      const activity = normalizeJoinedActivity(row.activities);
      if (!activity) return null;

      return {
        id: row.id,
        activityId: row.activity_id,
        readAt: row.read_at,
        createdAt: row.created_at,
        activity: normalizeActivity(activity, usersMap),
      };
    })
    .filter((item): item is NotificationItem => item !== null);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}
