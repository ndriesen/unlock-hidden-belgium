import { supabase } from "@/lib/Supabase/browser-client";

export type LeagueTier =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond";

export interface LeagueEntry {
  userId: string;
  name: string;
  xp: number;
  rank: number;
  tier: LeagueTier;
}

export interface LeagueBoard {
  entries: LeagueEntry[];
  currentUserEntry: LeagueEntry | null;
}

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  xp_points: number | null;
}

export function getLeagueTierFromXp(xp: number): LeagueTier {
  if (xp < 500) return "Bronze";
  if (xp < 1500) return "Silver";
  if (xp < 4000) return "Gold";
  if (xp < 8000) return "Platinum";
  return "Diamond";
}

function mapEntry(row: UserRow, rank: number): LeagueEntry {
  const name = row.username || row.email?.split("@")[0] || "Explorer";
  const xp = row.xp_points ?? 0;

  return {
    userId: row.id,
    name,
    xp,
    rank,
    tier: getLeagueTierFromXp(xp),
  };
}

export async function fetchLeagueBoard(
  currentUserId: string,
  limit = 15
): Promise<LeagueBoard> {
  const { data: topUsers, error: topError } = await supabase
    .from("users")
    .select("id,username,email,xp_points")
    .order("xp_points", { ascending: false })
    .limit(limit);

  if (topError || !topUsers) {
    return { entries: [], currentUserEntry: null };
  }

  const entries = (topUsers as UserRow[]).map((row, index) =>
    mapEntry(row, index + 1)
  );

  let currentUserEntry = entries.find((entry) => entry.userId === currentUserId) ?? null;

  if (!currentUserEntry) {
    const { data: me } = await supabase
      .from("users")
      .select("id,username,email,xp_points")
      .eq("id", currentUserId)
      .maybeSingle();

    if (me) {
      const myXp = (me as UserRow).xp_points ?? 0;

      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gt("xp_points", myXp);

      const rank = (count ?? 0) + 1;
      currentUserEntry = mapEntry(me as UserRow, rank);
    }
  }

  return {
    entries,
    currentUserEntry,
  };
}