import { supabase } from "@/lib/Supabase/browser-client";
/* No supabase types needed for RPC */
import { awardXP } from "./gamification";
import { trackHotspotVisit } from "./activityTracking";
import { evaluateBadges } from "./badgeEngine";

// type VerificationResult = any;

export interface VerifyVisitInput {
  userId: string;
  hotspotId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface UserHotspotStatus {
  visited: boolean;
  visited_at?: string | null;
  verification_status: 'none' | 'pending' | 'verified' | 'failed';
  verified_at?: string | null;
  visit_xp_awarded: boolean;
  verification_xp_awarded: boolean;
  distance_to_hotspot?: number | null;
}

/**
 * Check if user has visited hotspot (for UI state)
 */
export async function getUserHotspotStatus(
  userId: string, 
  hotspotId: string
): Promise<UserHotspotStatus | null> {
  const { data, error } = await supabase
    .from('user_hotspots')
    .select(`
      visited,
      visited_at,
      verification_status,
      verified_at,
      visit_xp_awarded,
      verification_xp_awarded,
      distance_to_hotspot
    `)
    .eq('user_id', userId)
    .eq('hotspot_id', hotspotId)
    .single();

  if (error && error.code !== 'PGRST116') return null; // Not found is ok
  return data as UserHotspotStatus;
}

/**
 * Mark hotspot as visited (with XP dupe protection)
 */
export async function markAsVisited(
  userId: string, 
  hotspotId: string
): Promise<{ xpGained?: number; alreadyVisited: boolean }> {
  // Check existing status first
  const status = await getUserHotspotStatus(userId, hotspotId);
  const isNewVisit = !status?.visited || !status.visit_xp_awarded;

  if (!isNewVisit) {
    return { alreadyVisited: true };
  }

  // Upsert visit flag
  const { error } = await supabase
    .from('user_hotspots')
    .upsert({
      user_id: userId,
      hotspot_id: hotspotId,
      visited: true,
      visited_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('hotspot_id', hotspotId);

  if (error) throw error;

  // Award XP only for new visits (idempotent)
  if (isNewVisit) {
    const xpResult = await awardXP(userId, 'visit_hotspot_xp', { hotspotId });
    if ('success' in xpResult && !xpResult.success) {
      console.warn('Visit XP skipped:', xpResult.reason);
    } else {
      // Mark XP as awarded
      await supabase
        .from('user_hotspots')
        .update({ visit_xp_awarded: true })
        .eq('user_id', userId)
        .eq('hotspot_id', hotspotId);
      
      await trackHotspotVisit(userId, hotspotId);
      await evaluateBadges(userId);
      
      return { xpGained: (xpResult as any).xpGained, alreadyVisited: false };
    }
  }

  return { alreadyVisited: false };
}

/**
 * GPS Verify visit (core feature)
 * 1. RPC validation (distance/accuracy)
 * 2. Auto-mark visit if needed
 * 3. Award verification XP (once only)
 */
export async function verifyVisit({
  userId,
  hotspotId, 
  latitude,
  longitude,
  accuracy
}: VerifyVisitInput): Promise<{
  success: boolean;
  status: 'verified' | 'failed' | 'error';
  distance_meters: number;
  attempt_id?: string;
  xpGained?: number;
  wasFirstVerification: boolean;
}> {
  try {
    // 1. Database validation + data storage + logging (now handled in RPC v2)
    const rpcResult = await supabase.rpc('verify_visit_data', {
      p_user_id: userId,
      p_hotspot_id: hotspotId,
      p_lat: latitude,
      p_lng: longitude,
      p_accuracy: accuracy
    }) as any;

    if (!rpcResult.success) {
      return {
        success: false,
        status: 'error' as const,
        distance_meters: 0,
        wasFirstVerification: false
      };
    }

    const result = rpcResult;

    // 2. Auto-mark as visited if not already
    const visitStatus = await getUserHotspotStatus(userId, hotspotId);
    if (!visitStatus?.visited) {
      await markAsVisited(userId, hotspotId);
    }

    // 3. Award verification XP (once only)
    if (result.was_first_verification && result.status === 'verified') {
      const statusAfterVisit = await getUserHotspotStatus(userId, hotspotId);
      if (!statusAfterVisit?.verification_xp_awarded) {
        const xpResult = await awardXP(userId, 'verify_hotspot_xp', { hotspotId });
        if (!('success' in xpResult) || xpResult.success) {
          // Mark as awarded
          await supabase
            .from('user_hotspots')
            .update({ verification_xp_awarded: true })
            .eq('user_id', userId)
            .eq('hotspot_id', hotspotId);
          
          await trackHotspotVisit(userId, hotspotId);
          await evaluateBadges(userId);
          
          return {
            success: true,
            status: 'verified',
            distance_meters: result.distance_meters,
            xpGained: (xpResult as any)?.xpGained,
            wasFirstVerification: true
          };
        }
      }
    }

    return {
      success: true,
      status: result.status,
      distance_meters: result.distance_meters,
      attempt_id: result.attempt_id,
      wasFirstVerification: result.was_first_verification || false
    };

  } catch (error) {
    console.error('Verification failed:', error);
    return {
      success: false,
      status: 'error',
      distance_meters: 0,
      wasFirstVerification: false
    };
  }
}

