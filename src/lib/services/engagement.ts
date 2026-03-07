import { supabase } from "@/lib/Supabase/browser-client";

interface VisitRow {
  visited_at: string | null;
}

export interface VisitStats {
  streak: number;
  visitedToday: boolean;
  uniqueVisitDays: number;
}

function normalizeDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function uniqueVisitDays(visitDates: string[]): string[] {
  return Array.from(
    new Set(
      visitDates
        .map((iso) => new Date(iso))
        .filter((date) => !Number.isNaN(date.getTime()))
        .map((date) => normalizeDate(date))
    )
  ).sort();
}

export function computeCurrentStreak(dayKeys: string[]): number {
  if (!dayKeys.length) return 0;

  const daySet = new Set(dayKeys);
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = normalizeDate(cursor);
    if (!daySet.has(key)) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function fetchVisitStatsForUser(userId: string): Promise<VisitStats> {
  const { data, error } = await supabase
    .from("user_hotspots")
    .select("visited_at")
    .eq("user_id", userId)
    .eq("visited", true);

  if (error || !data) {
    return {
      streak: 0,
      visitedToday: false,
      uniqueVisitDays: 0,
    };
  }

  const rows = data as VisitRow[];
  const dayKeys = uniqueVisitDays(
    rows
      .map((row) => row.visited_at)
      .filter((value): value is string => Boolean(value))
  );

  const todayKey = normalizeDate(new Date());

  return {
    streak: computeCurrentStreak(dayKeys),
    visitedToday: dayKeys.includes(todayKey),
    uniqueVisitDays: dayKeys.length,
  };
}

export async function markVisitAndLoadStats(userId: string): Promise<VisitStats> {
  return fetchVisitStatsForUser(userId);
}