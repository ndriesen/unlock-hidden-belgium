import { supabase } from "@/lib/Supabase/browser-client";

/* ========================================================= */
/* ======================= TYPES ============================ */
/* ========================================================= */

interface Hotspot {
  id: string;
  province: string;
  category?: string;
  country?: string;
  is_hidden?: boolean;
}

interface UserHotspot {
  hotspot_id: string;
  visited_at: string;
  hotspot?: Hotspot;
}

export interface Badge {
  id: string;
  name: string;
  condition_type: string;
  condition_value: number;
  condition_meta?: any;
  xp_reward?: number;
}

interface UserStats {
  totalVisits: number;
  visitDates: Date[];
  provinces: Set<string>;
  categories: Map<string, number>;
  countryRegions: Map<string, Set<string>>;
  hiddenVisits: number;
}

/* ========================================================= */
/* ================= BADGE ENGINE =========================== */
/* ========================================================= */

export async function evaluateBadges(
  userId: string
): Promise<Badge[]> {

  /* ---------- LOAD BADGES ---------- */

  const { data: badges, error: badgeError } =
    await supabase.from("badges").select("*");

  if (badgeError) {
    console.error("Badge load error", badgeError);
    return [];
  }

  if (!badges) return [];


  /* ---------- LOAD OWNED BADGES ---------- */

  const { data: owned } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const ownedIds = new Set(
    owned?.map((b: any) => b.badge_id)
  );


  /* ---------- LOAD VISITS ---------- */

  const { data: visits, error: visitError } =
    await supabase
      .from("user_hotspots")
      .select(`
        hotspot_id,
        visited_at,
        hotspots (
          id,
          province,
          category,
          country,
          is_hidden
        )
      `)
      .eq("user_id", userId)
      .eq("visited", true);   // ✅ FIXED


  if (visitError) {
    console.error("Visit load error", visitError);
    return [];
  }
  console.log("VISITS RESULT", visits);
  if (!visits) return [];


  /* ---------- NORMALIZE ---------- */

  const normalized: UserHotspot[] =
    visits.map((v: any) => ({
      hotspot_id: v.hotspot_id,
      visited_at: v.visited_at,
      hotspot: v.hotspots
    }));


  /* ---------- COMPUTE STATS ---------- */

  const stats = computeUserStats(normalized);

  console.log("User stats", stats);


  /* ---------- CHECK BADGES ---------- */

  const unlocked: Badge[] = [];

  for (const badge of badges as Badge[]) {

    if (ownedIds.has(badge.id)) continue;

    const unlock = evaluateCondition(badge, stats);

    if (!unlock) continue;


    /* ---------- SAVE BADGE ---------- */

    await supabase
      .from("user_badges")
      .upsert({
        user_id: userId,
        badge_id: badge.id,
      }, {
        onConflict: "user_id,badge_id"
      });


    /* ---------- XP REWARD ---------- */

    if (badge.xp_reward) {
      await supabase.rpc("increment_xp", {
        p_user_id: userId,
        p_amount: badge.xp_reward
      });
    }

    unlocked.push(badge);
  }

  return unlocked;
}

/* ========================================================= */
/* ================= USER STATS ============================= */
/* ========================================================= */

function computeUserStats(visits: UserHotspot[]): UserStats {

  const provinces = new Set<string>();
  const categories = new Map<string, number>();
  const countryRegions = new Map<string, Set<string>>();
  const visitDates: Date[] = [];

  let hiddenVisits = 0;

  visits.forEach(v => {

    visitDates.push(new Date(v.visited_at));

    const h = v.hotspot;
    if (!h) return;

    provinces.add(h.province);

    if (h.category) {
      categories.set(
        h.category,
        (categories.get(h.category) ?? 0) + 1
      );
    }

    if (h.country) {

      if (!countryRegions.has(h.country)) {
        countryRegions.set(h.country, new Set());
      }

      countryRegions
        .get(h.country)!
        .add(h.province);
    }

    if (h.is_hidden) hiddenVisits++;
  });

  return {
    totalVisits: visitDates.length,
    visitDates,
    provinces,
    categories,
    countryRegions,
    hiddenVisits
  };
}

/* ========================================================= */
/* ================= CONDITION LOGIC ======================== */
/* ========================================================= */

function evaluateCondition(
  badge: Badge,
  stats: UserStats
): boolean {

  switch (badge.condition_type) {

    case "visit_count":
      return stats.totalVisits >= badge.condition_value;


    case "category_count": {
      const category =
        badge.condition_meta?.category;

      const count =
        stats.categories.get(category) ?? 0;

      return count >= badge.condition_value;
    }


    case "region_count": {
      const country =
        badge.condition_meta?.country;

      const regions =
        stats.countryRegions.get(country);

      return (regions?.size ?? 0)
        >= badge.condition_value;
    }


    case "visit_streak":
      return calculateStreak(
        stats.visitDates
      ) >= badge.condition_value;


    case "hidden_gems":
      return stats.hiddenVisits
        >= badge.condition_value;


    case "early_visit":
      return stats.visitDates.some(
        d => d.getHours() < 7
      );


    case "late_visit":
      return stats.visitDates.some(
        d => d.getHours() >= 22
      );


    default:
      return false;
  }
}

/* ========================================================= */
/* ================= STREAK LOGIC =========================== */
/* ========================================================= */

function calculateStreak(dates: Date[]): number {

  if (!dates.length) return 0;

  const sorted =
    [...dates].sort(
      (a,b)=>a.getTime()-b.getTime()
    );

  let streak = 1;
  let max = 1;

  for (let i=1;i<sorted.length;i++){

    const diff =
      (sorted[i].getTime() - sorted[i-1].getTime())
      / 86400000;

    if (diff === 1){
      streak++;
      max = Math.max(max, streak);
    }
    else if (diff > 1){
      streak = 1;
    }
  }

  return max;
}