import { supabase } from "@/lib/Supabase/browser-client";
import { awardXP } from "./gamification";

export async function sendInvite(userId: string, inviteCode: string) {
  const { data, error } = await supabase.from("user_invites").insert({
    sent_by: userId,
    code: inviteCode,
  }).select().single();

  if (error) throw error;

  await awardXP(userId, 'xp_inviting a friend');

  return data;
}

export async function getSentInviteCount(userId: string, acceptedOnly = false) {
  let query = supabase.from("user_invites").select("id", { count: "exact", head: true }).eq("sent_by", userId);
  if (acceptedOnly) query = query.eq("accepted", true);
  const { count, error } = await query;
  return error ? 0 : count || 0;
}
