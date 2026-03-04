import { supabase } from "@/lib/Supabase/browser-client";
import {
  getLevelFromXp,
} from "@/lib/services/gamificationLevels";

export async function addXp(userId: string, amount: number) {
  const { data: userData } = await supabase
    .from("users")
    .select("xp_points")
    .eq("id", userId)
    .single();

  if (!userData) return null;

  const oldXp = userData.xp_points ?? 0;
  const newXp = oldXp + amount;

  const oldLevel = getLevelFromXp(oldXp);
  const newLevel = getLevelFromXp(newXp);

  await supabase
    .from("users")
    .update({ xp_points: newXp })
    .eq("id", userId);

  return {
    oldXp,
    newXp,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
  };
}