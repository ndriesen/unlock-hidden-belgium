import { supabase } from "@/lib/Supabase/browser-client";
import { ACTIVITY_TYPES } from "@/lib/constants/ranking";

/**
 * Types of activities that can be tracked
 */
export type ActivityType = 
  | typeof ACTIVITY_TYPES.VIEW_HOTSPOT
  | typeof ACTIVITY_TYPES.OPEN_HOTSPOT
  | typeof ACTIVITY_TYPES.SAVE_HOTSPOT
  | typeof ACTIVITY_TYPES.UNSAVE_HOTSPOT
  | typeof ACTIVITY_TYPES.ADD_HOTSPOT_TO_TRIP
  | typeof ACTIVITY_TYPES.VISIT_HOTSPOT
  | typeof ACTIVITY_TYPES.CREATE_HOTSPOT;

/**
 * Entity types that can be tracked
 */
export type EntityType = 'hotspot' | 'list' | 'user' | 'collection' | 'trip';

/**
 * Activity record to insert
 */
export interface ActivityRecord {
  userId: string;
  actionType: ActivityType;
  entityType: EntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track a user activity
 * This will:
 * 1. Insert a row into user_activity table
 * 2. Update hotspot counters via triggers
 */
export async function trackActivity(activity: ActivityRecord): Promise<void> {
  const { error } = await supabase
    .from('user_activity')
    .insert({
      user_id: activity.userId,
      action_type: activity.actionType,
      entity_type: activity.entityType,
      entity_id: activity.entityId,
      metadata: activity.metadata || {},
    });

  if (error) {
    console.error('Error tracking activity:', error);
    // Don't throw - activity tracking should not break the main flow
  }
}

/**
 * Track a hotspot view
 */
export async function trackHotspotView(userId: string, hotspotId: string): Promise<void> {
  await trackActivity({
    userId,
    actionType: ACTIVITY_TYPES.VIEW_HOTSPOT,
    entityType: 'hotspot',
    entityId: hotspotId,
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Track a hotspot open/detail view
 */
export async function trackHotspotOpen(userId: string, hotspotId: string): Promise<void> {
  await trackActivity({
    userId,
    actionType: ACTIVITY_TYPES.OPEN_HOTSPOT,
    entityType: 'hotspot',
    entityId: hotspotId,
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Track a hotspot save
 */
export async function trackHotspotSave(userId: string, hotspotId: string): Promise<void> {
  await trackActivity({
    userId,
    actionType: ACTIVITY_TYPES.SAVE_HOTSPOT,
    entityType: 'hotspot',
    entityId: hotspotId,
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Track a hotspot unsave
 */
export async function trackHotspotUnsave(userId: string, hotspotId: string): Promise<void> {
  await trackActivity({
    userId,
    actionType: ACTIVITY_TYPES.UNSAVE_HOTSPOT,
    entityType: 'hotspot',
    entityId: hotspotId,
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Track adding a hotspot to a trip
 */
export async function trackAddHotspotToTrip(
  userId: string, 
  hotspotId: string, 
  tripId: string
): Promise<void> {
  await trackActivity({
    userId,
    actionType: ACTIVITY_TYPES.ADD_HOTSPOT_TO_TRIP,
    entityType: 'hotspot',
    entityId: hotspotId,
    metadata: { 
      timestamp: new Date().toISOString(),
      trip_id: tripId,
    },
  });
}

/**
 * Track a hotspot visit
 */
export async function trackHotspotVisit(userId: string, hotspotId: string): Promise<void> {
  await trackActivity({
    userId,
    actionType: ACTIVITY_TYPES.VISIT_HOTSPOT,
    entityType: 'hotspot',
    entityId: hotspotId,
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Track hotspot creation
 */
export async function trackHotspotCreated(userId: string, hotspotId: string): Promise<void> {
  await trackActivity({
    userId,
    actionType: ACTIVITY_TYPES.CREATE_HOTSPOT,
    entityType: 'hotspot',
    entityId: hotspotId,
    metadata: { timestamp: new Date().toISOString() },
  });
}

/**
 * Get recent activities for a user
 */
export async function getUserActivities(
  userId: string, 
  limit: number = 50
): Promise<{
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}[]> {
  const { data, error } = await supabase
    .from('user_activity')
    .select('id, action_type, entity_type, entity_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get activity counts for a user
 */
export async function getUserActivityCounts(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('user_activity')
    .select('action_type')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching activity counts:', error);
    throw error;
  }

  const counts: Record<string, number> = {};
  data?.forEach(row => {
    counts[row.action_type] = (counts[row.action_type] || 0) + 1;
  });

  return counts;
}

