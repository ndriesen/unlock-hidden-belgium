import { supabase } from "@/lib/Supabase/browser-client";
import { evaluateBadges } from "./badgeEngine";
import { addXp } from "./xpEngine";
import { recordActivity } from "./activity";

interface GamificationResult {
  xpGained: number;
  oldXp: number;
  newXp: number;
  leveledUp: boolean;
  newLevel: number;
  badges: any[];
  message: string;
}

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

export type { GamificationResult };

export async function awardXP(
  userId: string, 
  actionKey: string, 
  context: { hotspotId?: string, entityId?: string, photoPath?: string } = {}
): Promise<GamificationResult | { success: false; reason: string; }> {
  // Add new triggers like addReview etc. call awardXP internally
  // 1. Anti-abuse checks
    if (actionKey === 'visit_hotspot_xp' && context.hotspotId) {
    const { data } = await supabase
      .from('user_hotspots')
      .select('visited_at')
      .eq('user_id', userId)
      .eq('hotspot_id', context.hotspotId)
      .gte('visited_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      .single();
    if (data) {
      return { success: false, reason: "already_visited" };
    }
  }

// Daily cap - simplified, full impl in user_activity logs
  const dailyCapRule = await supabase.from('app_rules').select('rule_value').eq('rule_key', 'xp_daily_cap').single();
  const dailyCap = dailyCapRule.data?.rule_value || 100;
  // Note: Full daily sum requires RPC, skip for v1

  // Anti-abuse for verification XP: flag + 1min cooldown
  if (actionKey === 'verify_hotspot_xp' && context.hotspotId) {
    const recentAttempt = await supabase
      .from('verification_attempts')
      .select('created_at')
      .eq('user_id', userId)
      .eq('hotspot_id', context.hotspotId)
      .gte('created_at', new Date(Date.now() - 60*1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const { data: status } = await supabase
      .from('user_hotspots')
      .select('verification_xp_awarded')
      .eq('user_id', userId)
      .eq('hotspot_id', context.hotspotId)
      .single();
    
    if (status?.verification_xp_awarded || recentAttempt.data) {
      return { success: false, reason: status?.verification_xp_awarded ? "already_verified" : "cooldown_active" };
    }
  }

  // 2. Get XP amount
  const { data: rule } = await supabase
    .from('app_rules')
    .select('rule_value')
    .eq('rule_key', actionKey)
    .single();

  const xpAmount = rule?.rule_value || 0;
  if (xpAmount === 0) throw new Error('No XP for this action');

  // 3. Award XP
  const xpResult = await addXp(userId, Number(xpAmount));
  if (!xpResult) throw new Error('XP update failed');

  // 4. Check badges
  const badges = await evaluateBadges(userId);

  // 5. Record activity
  await recordActivity({
    actorId: userId,
    activityType: 'xp_earned',
    entityType: 'xp',
    message: `+${xpAmount} XP for ${actionKey}`,
    metadata: { actionKey, xpGained: Number(xpAmount), badges: badges.map((b: any) => b.id) },
  });

  const newLevel = xpResult.newLevel;

  return {
    xpGained: Number(xpAmount),
    oldXp: xpResult.oldXp || 0,
    newXp: xpResult.newXp || 0,
    leveledUp: xpResult.leveledUp || false,
    newLevel,
    badges,
    message: `+${xpAmount} XP — ${actionKey.replace(/_xp$/, '').replace(/_/, ' ').toUpperCase()}!`
  };
}

import { markAsVisited } from "./visitVerification";
export async function markVisited(userId: string, hotspotId: string) {
  const result = await markAsVisited(userId, hotspotId);
  await evaluateBadges(userId);
  return result;
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

  if (newValue) {
    const result = await awardXP(userId, 'xp_mark_wishlist', { hotspotId });
    if ('success' in result && result.success === false) {
      console.warn('XP award skipped:', result.reason);
    }
  }

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

  if (newValue) {
    const result = await awardXP(userId, 'xp_mark_wishlist', { hotspotId });
    if ('success' in result && result.success === false) {
      console.warn('XP award skipped:', result.reason);
    }
  }

  return newValue;
}
