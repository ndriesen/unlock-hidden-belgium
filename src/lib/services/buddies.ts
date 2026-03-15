import { supabase } from "@/lib/Supabase/browser-client";

export const BUDDY_INTEREST_OPTIONS = [
  "Hidden gems",
  "Nature walks",
  "Photography",
  "Food spots",
  "Family activities",
  "Culture",
  "Nightlife",
  "Adventure",
] as const;

export type TravelStyle = "slow" | "balanced" | "active";

export interface BuddyProfile {
  userId: string;
  name: string;
  city: string;
  interests: string[];
  style: TravelStyle;
  availability: string;
  bio: string;
  avatarUrl: string;
  xpPoints: number;
}

export interface BuddyRequest {
  id: string;
  userId: string;
  city: string;
  style: TravelStyle;
  interests: string[];
  note: string;
  createdAt: string;
}

import {
  type ConversationId,
  type Message,
  getOrCreateConversation,
  getMessages,
  sendMessage
} from './chat';

export {
  getOrCreateConversation,
  getMessages,
  sendMessage,
};
export type { ConversationId, Message };

interface BuddyProfileRow {
  user_id: string;
  display_name: string | null;
  city: string | null;
  interests: string[] | null;
  travel_style: TravelStyle | null;
  availability: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  xp_points: number | null;
  city?: string | null;
  travel_style?: TravelStyle | null;
  interests?: string[] | null;
  availability?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

function normalizeInterests(value: string[] | null | undefined): string[] {
  if (!value || !Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string").slice(0, 8);
}

function normalizeStyle(value: string | null | undefined): TravelStyle {
  if (value === "slow" || value === "active" || value === "balanced") {
    return value;
  }

  return "balanced";
}

function mapBuddyProfileRow(row: BuddyProfileRow): BuddyProfile {
  return {
    userId: row.user_id,
    name: row.display_name ?? "Explorer",
    city: row.city ?? "Unknown",
    interests: normalizeInterests(row.interests),
    style: normalizeStyle(row.travel_style),
    availability: row.availability ?? "Flexible",
    bio: row.bio ?? "Always up for discovering new places.",
    avatarUrl: row.avatar_url ?? "",
    xpPoints: 0,
  };
}

function mapUserRow(row: UserRow): BuddyProfile {
  const fallbackName = row.username || row.email?.split("@")[0] || "Explorer";

  return {
    userId: row.id,
    name: fallbackName,
    city: row.city ?? "Unknown",
    interests: normalizeInterests(row.interests),
    style: normalizeStyle(row.travel_style),
    availability: row.availability ?? "Flexible",
    bio: row.bio ?? "Looking for new places to explore.",
    avatarUrl: row.avatar_url ?? "",
    xpPoints: row.xp_points ?? 0,
  };
}

export async function fetchBuddyProfiles(currentUserId: string) {
  const { data: profiles, error: profileError } = await supabase
    .from("buddy_profiles")
    .select(
      "user_id,display_name,city,interests,travel_style,availability,bio,avatar_url"
    )
    .neq("user_id", currentUserId)
    .limit(50);

  if (!profileError && profiles && profiles.length > 0) {
    // Validate users exist
    const validProfiles = await Promise.all(
      (profiles as BuddyProfileRow[]).map(async (row) => {
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('id', row.user_id);
        return count && count > 0 ? mapBuddyProfileRow(row) : null;
      })
    );
    const filteredProfiles = validProfiles.filter((p): p is BuddyProfile => p !== null);
    
    return {
      source: "buddy_profiles" as const,
      profiles: filteredProfiles,
      warning: filteredProfiles.length < profiles.length ? "Some profiles skipped (invalid user)." : "",
    };
  }

  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id,username,email,xp_points,city,travel_style,interests,availability,bio,avatar_url")
    .neq("id", currentUserId)
    .limit(50);

  if (userError || !users || users.length === 0) {
    return {
      source: "none" as const,
      profiles: [] as BuddyProfile[],
      warning:
        "Buddy profiles are not available yet. Create the backend tables to enable advanced matching.",
    };
  }

  // Users fallback already from users table, so valid
  return {
    source: "users_fallback" as const,
    profiles: (users as UserRow[]).map(mapUserRow),
    warning:
      "Using basic user data. Add buddy profile fields in the backend for richer matching.",
  };
}

export async function fetchOwnBuddyProfile(userId: string): Promise<BuddyProfile | null> {
  const { data, error } = await supabase
    .from("buddy_profiles")
    .select(
      "user_id,display_name,city,interests,travel_style,availability,bio,avatar_url"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapBuddyProfileRow(data as BuddyProfileRow);
}

export async function upsertOwnBuddyProfile(
  userId: string,
  payload: {
    name: string;
    city: string;
    interests: string[];
    style: TravelStyle;
    availability: string;
    bio: string;
  }
): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabase.from("buddy_profiles").upsert(
    {
      user_id: userId,
      display_name: payload.name,
      city: payload.city,
      interests: payload.interests,
      travel_style: payload.style,
      availability: payload.availability,
      bio: payload.bio,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return {
      ok: false,
      message:
        "Could not save buddy profile in backend. Ensure table buddy_profiles exists.",
    };
  }

  return { ok: true, message: "Buddy profile saved." };
}

export async function createBuddyRequest(
  userId: string,
  payload: {
    city: string;
    style: TravelStyle;
    interests: string[];
    note: string;
  }
): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabase.from("buddy_requests").insert({
    user_id: userId,
    city: payload.city,
    travel_style: payload.style,
    interests: payload.interests,
    note: payload.note,
  });

  if (error) {
    return {
      ok: false,
      message:
        "Could not post buddy request in backend. Ensure table buddy_requests exists.",
    };
  }

  return { ok: true, message: "Buddy request posted." };
}

export async function fetchBuddyRequests(): Promise<BuddyRequest[]> {
  const { data, error } = await supabase
    .from("buddy_requests")
    .select("id,user_id,city,travel_style,interests,note,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    return [];
  }

  return (data as Array<{
    id: string;
    user_id: string;
    city: string | null;
    travel_style: TravelStyle | null;
    interests: string[] | null;
    note: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    userId: row.user_id,
    city: row.city ?? "",
    style: normalizeStyle(row.travel_style),
    interests: normalizeInterests(row.interests),
    note: row.note ?? "",
    createdAt: row.created_at,
  }));
}

export async function fetchFilteredBuddyProfiles(
  currentUserId: string,
  filters: {
    city?: string;
    style?: TravelStyle;
    interests?: string[];
    availability?: string;
  }
): Promise<{profiles: BuddyProfile[]}> {
  let query = supabase
    .from("buddy_profiles")
    .select(
      "user_id,display_name,city,interests,travel_style,availability,bio,avatar_url"
    )
    .neq("user_id", currentUserId)
    .limit(50);

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters.style) {
    query = query.eq("travel_style", filters.style);
  }
  if (filters.interests?.length) {
    query = query.contains("interests", filters.interests);
  }
  if (filters.availability) {
    query = query.eq("availability", filters.availability);
  }

  const { data: profiles, error } = await query;
  if (error) throw error;

  return {
    profiles: (profiles as BuddyProfileRow[]).map(mapBuddyProfileRow),
  };
}



export function calculateBuddyMatchScore(
  profile: BuddyProfile,
  preferences: {
    city: string;
    interests: string[];
    style: TravelStyle;
  } = { city: '', interests: [], style: 'balanced' }
): number {


  const overlap = profile.interests.filter((interest) =>
    preferences.interests.includes(interest)
  ).length;

  const overlapScore = overlap * 18;
  const styleScore = profile.style === preferences.style ? 28 : 8;
  const cityScore =
    preferences.city &&
    profile.city.toLowerCase() === preferences.city.toLowerCase()
      ? 20
      : 0;

  const activityScore = Math.min(profile.xpPoints / 200, 12);

  return Math.max(0, Math.min(100, overlapScore + styleScore + cityScore + activityScore));
}