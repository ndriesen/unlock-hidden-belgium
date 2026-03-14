﻿
﻿"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/Supabase/browser-client";
import {
  getLevelFromXp,
  xpRequiredForLevel,
  totalXpForLevel,
} from "@/lib/services/gamificationLevels";
import { useAuth } from "@/context/AuthContext";
import {
  BUDDY_INTEREST_OPTIONS,
  TravelStyle,
  BuddyProfile,
  fetchOwnBuddyProfile,
  upsertOwnBuddyProfile,
} from "@/lib/services/buddies";

interface Hotspot {
  id: string;
  name: string;
  province: string;
}

interface UserHotspotRow {
  visited: boolean;
  wishlist: boolean;
  favorite: boolean;
  hotspots: Hotspot | Hotspot[] | null;
}

interface BadgeFull {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  condition_meta?: object;
}

interface UserBadgeRow {
  awarded_at: string;
  badges: BadgeFull;
}

interface VisitHotspot {
  id: string;
  province: string;
  category?: string;
  country?: string;
  is_hidden?: boolean;
}

interface UserVisitRow {
  hotspot_id: string;
  visited_at: string;
  hotspots: VisitHotspot;
}

interface UserStats {
  totalVisits: number;
  visitDates: Date[];
  provinces: Set<string>;
  categories: Map<string, number>;
  countryRegions: Map<string, Set<string>>;
  hiddenVisits: number;
}

function computeUserStats(visits: UserVisitRow[]): UserStats {
  const provinces = new Set<string>();
  const categories = new Map<string, number>();
  const countryRegions = new Map<string, Set<string>>();
  const visitDates: Date[] = [];
  let hiddenVisits = 0;

  visits.forEach((visit) => {
    const date = new Date(visit.visited_at);
    if (!Number.isNaN(date.getTime())) {
      visitDates.push(date);
    }

    const hotspot = visit.hotspots;
    if (!hotspot) return;

    provinces.add(hotspot.province);

    if (hotspot.category) {
      categories.set(hotspot.category, (categories.get(hotspot.category) ?? 0) + 1);
    }

    if (hotspot.country) {
      if (!countryRegions.has(hotspot.country)) {
        countryRegions.set(hotspot.country, new Set());
      }
      countryRegions.get(hotspot.country)?.add(hotspot.province);
    }

    if (hotspot.is_hidden) hiddenVisits += 1;
  });

  return {
    totalVisits: visitDates.length,
    visitDates,
    provinces,
    categories,
    countryRegions,
    hiddenVisits,
  };
}

function calculateStreak(dates: Date[]): number {
  if (!dates.length) return 0;

  const dayKeys = Array.from(
    new Set(
      dates.map((date) => {
        const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return normalized.getTime();
      }).sort((a, b) => a - b)
    )
  );

  if (!dayKeys.length) return 0;

  let streak = 1;
  let maxStreak = 1;

  for (let i = 1; i < dayKeys.length; i++) {
    const diffDays = (dayKeys[i] - dayKeys[i - 1]) / 86400000;
    if (diffDays === 1) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  return maxStreak;
}

interface ProgressInfo {
  current: number;
  desc: string;
}

function getProgress(badge: BadgeFull, stats: UserStats): ProgressInfo {
  const value = badge.condition_value;
  let current = 0;
  let desc = 'unknown';

  switch (badge.condition_type) {
    case "visit_count":
      current = stats.totalVisits;
      desc = "visits";
      break;
    case "visit_streak":
      current = calculateStreak(stats.visitDates);
      desc = "day streak";
      break;
    case "category_count": {
      const cat = (badge.condition_meta as any)?.category ?? "";
      current = stats.categories.get(cat) ?? 0;
      desc = `${cat}s`;
      break;
    }
    case "region_count": {
      const country = (badge.condition_meta as any)?.country ?? "BE";
      current = stats.countryRegions.get(country)?.size ?? 0;
      desc = "regions";
      break;
    }
    case "hidden_gems":
      current = stats.hiddenVisits;
      desc = "hidden gems";
      break;
    case "early_visit":
      current = stats.visitDates.some((date) => date.getHours() < 7) ? 1 : 0;
      desc = "early visit";
      break;
    case "late_visit":
      current = stats.visitDates.some((date) => date.getHours() >= 22) ? 1 : 0;
      desc = "late visit";
      break;
    default:
      current = 0;
      desc = "condition";
  }
  return { current: Math.min(current, value), desc };
}

function normalizeHotspot(joinedHotspot: UserHotspotRow["hotspots"]): Hotspot | null {
  if (!joinedHotspot) return null;
  return Array.isArray(joinedHotspot) ? (joinedHotspot[0] ?? null) : joinedHotspot;
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'edit'>('stats');

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvailability, setEditAvailability] = useState("Flexible");
  const [editStyle, setEditStyle] = useState<TravelStyle>("balanced");
  const [editInterests, setEditInterests] = useState<string[]>([]);

  const [xpPoints, setXpPoints] = useState(0);
  const [visited, setVisited] = useState<Hotspot[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<UserBadgeRow[]>([]);
  const [allBadgesFull, setAllBadgesFull] = useState<BadgeFull[]>([]);
  const [userVisits, setUserVisits] = useState<UserVisitRow[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showUnearned, setShowUnearned] = useState(false);
  const [buddyProfile, setBuddyProfile] = useState<BuddyProfile | null>(null);
  const [message, setMessage] = useState(""); 

  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      if (!authUser) return;

      setUserId(authUser.id);
      setEmail(authUser.email ?? "");
      setAvatarUrl(authUser.user_metadata?.avatar_url ?? null);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("xp_points, username")
        .eq("id", authUser.id)
        .single();

      if (userError) {
        if (userError.code === "PGRST116") {
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.full_name || authUser.email,
              avatar_url: authUser.user_metadata?.avatar_url,
              created_at: new Date().toISOString(),
            });
          
          if (!insertError) {
            const { data: newUserData } = await supabase
              .from("users")
              .select("xp_points, username")
              .eq("id", authUser.id)
              .single();
            
            if (newUserData) {
              setXpPoints(newUserData.xp_points ?? 0);
              setUsername(newUserData.username ?? "");
            }
          }
        } else {
          console.error("User profile load error:", userError);
        }
      } else if (userData) {
        setXpPoints(userData.xp_points ?? 0);
        setUsername(userData.username ?? "");
      }

      const { data: userHotspots, error: hotspotError } = await supabase
        .from("user_hotspots")
        .select(`
            visited,
            wishlist,
            favorite,
            hotspots(id, name, province)
          `)
        .eq("user_id", authUser.id);

      if (hotspotError) {
        console.error("User hotspots load error:", hotspotError);
      }

      const normalizedRows = (userHotspots ?? []) as UserHotspotRow[];

      const visitedList = normalizedRows
        .filter((row) => row.visited)
        .map((row) => normalizeHotspot(row.hotspots))
        .filter((hotspot): hotspot is Hotspot => hotspot !== null);

      setVisited(visitedList);
      setWishlistCount(normalizedRows.filter((row) => row.wishlist).length);
      setFavoriteCount(normalizedRows.filter((row) => row.favorite).length);

      // New badge queries
      const { data: earnedData, error: earnedError } = await supabase
        .from("user_badges")
        .select(`
          awarded_at,
          badges (
            id,
            name,
            description,
            icon,
            condition_type,
            condition_value,
            condition_meta
          )
        `)
        .eq("user_id", authUser.id)
        .order("awarded_at", { ascending: false });

      if (earnedError) {
        console.error("Earned badges error:", earnedError);
      } else {
        setEarnedBadges((earnedData ?? []) as unknown as UserBadgeRow[]);
      }

      const { data: allData, error: allError } = await supabase
        .from("badges")
        .select("id, name, description, icon, condition_type, condition_value, condition_meta");

      if (allError) {
        console.error("All badges error:", allError);
      } else {
        setAllBadgesFull((allData ?? []) as BadgeFull[]);
      }

      const { data: visitData, error: visitError } = await supabase
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
        .eq("user_id", authUser.id)
        .eq("visited", true);

      if (visitError) {
        console.error("User visits error:", visitError);
      } else {
        const visits = (visitData ?? []) as unknown as UserVisitRow[];

        setUserVisits(visits);
        const stats = computeUserStats(visits);
        setUserStats(stats);
      }
    };

    fetchUser();
  }, []);

  const calculatedLevel = getLevelFromXp(xpPoints);
  const xpForNextLevel = xpRequiredForLevel(calculatedLevel);
  const xpAtStartOfLevel = totalXpForLevel(calculatedLevel);

  const xpIntoLevel = xpPoints - xpAtStartOfLevel;
  const xpRemaining = Math.max(xpForNextLevel - xpIntoLevel, 0);

  const progressPercentage =
    xpForNextLevel > 0 ? Math.min((xpIntoLevel / xpForNextLevel) * 100, 100) : 0;

  const provincesVisited = new Set(visited.map((entry) => entry.province));

  const provinceProgress = visited.length > 0 ? (provincesVisited.size / 10) * 100 : 0;

  const explorerTitle =
    calculatedLevel < 5
      ? "Rookie Explorer"
      : calculatedLevel < 10
        ? "Adventurer"
        : calculatedLevel < 20
          ? "Master Explorer"
          : "Legend of Belgium";

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.type)) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const uniqueId = crypto.randomUUID();
    const filePath = `${userId}/${uniqueId}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    setAvatarUrl(publicUrl);
  };

  if (!userId) {
    return <p className="p-6">Loading profile...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white text-center space-y-4">
        <div className="relative mx-auto w-28 h-28">
          <div className="w-full h-full rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold overflow-hidden relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                onError={() => setAvatarUrl(null)}
                alt="Profile avatar"
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              username?.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()
            )}
          </div>

          <label className="absolute bottom-0 right-0 bg-white text-black rounded-full px-3 py-2 cursor-pointer shadow text-xs font-semibold">
            Edit
            <input hidden type="file" accept="image/*" onChange={handleAvatarUpload} />
          </label>
        </div>

        <div>
          <h2 className="text-xl font-bold">{username || email}</h2>
          <p className="text-sm opacity-80">{email}</p>
          <p className="mt-2 text-sm font-semibold">{explorerTitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow space-y-4">
        <p className="text-lg font-semibold">
          Level {calculatedLevel} - {explorerTitle}
        </p>

        <div className="flex justify-between text-sm text-gray-500">
          <span>Progress to Level {calculatedLevel + 1}</span>
          <span>
            {xpIntoLevel} / {xpForNextLevel} XP
          </span>
        </div>

        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <p className="text-xs text-gray-400 text-right">{xpRemaining} XP remaining</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <Stat value={visited.length} label="Visited" />
        <Stat value={wishlistCount} label="Wishlist" />
        <Stat value={favoriteCount} label="Favorites" />
        <Stat value={`${provincesVisited.size}/10`} label="Provinces" />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow space-y-3">
        <h3 className="font-semibold">Belgium Coverage</h3>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-700"
            style={{ width: `${provinceProgress}%` }}
          />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Badge Collection</h3>
        <div className="space-y-2">
          {earnedBadges.length === 0 ? (
            <p className="text-gray-500 text-sm">
              You did not yet earn a badge. Keep discovering to earn your first badge(s).
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                {earnedBadges.map(({ badges: badge, awarded_at }) => {
                  const progress = userStats ? getProgress(badge, userStats) : { current: 0, desc: '' };

                  return (
                    <div key={badge.id} className="relative group">
                      <div className="px-3 py-2 rounded-full text-sm bg-yellow-100 hover:shadow-md cursor-help">
                        {badge.icon} {badge.name}
                      </div>

                      <div className="absolute hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded-md p-3 w-56 -top-2 left-1/2 -translate-x-1/2 -translate-y-full shadow-lg">
                        <div className="font-bold">{badge.description}</div>
                        <div className="mt-1">Awarded at {awarded_at}</div>
                        <div>{progress.current}/{badge.condition_value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const unearnedBadges = allBadgesFull.filter(b => !earnedBadges.some(e => e.badges.id === b.id));
                if (unearnedBadges.length === 0) return null;
                return (
                  <p 
                    className="text-blue-600 cursor-pointer hover:underline text-sm mt-2"
                    onClick={() => setShowUnearned(!showUnearned)}
                  >
                    {showUnearned ? 'Hide' : 'Show'} available badges ({unearnedBadges.length})
                  </p>
                );
              })()}
              {showUnearned && userStats && (() => {
                const unearnedBadges = allBadgesFull.filter(
                  (b) => !earnedBadges.some((e) => e.badges.id === b.id)
                );

                return (
                  <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-gray-200">
                    {unearnedBadges.map((badge) => {
                      const progress = getProgress(badge, userStats);

                      return (
                        <div key={badge.id} className="relative group">
                          <div className="px-3 py-2 rounded-full text-sm bg-gray-200 opacity-70 hover:shadow-md cursor-help">
                            {badge.icon} {badge.name}
                          </div>

                          {/* Custom tooltip */}
                          <div className="absolute hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded-md p-3 w-56 -top-2 left-1/2 -translate-x-1/2 -translate-y-full shadow-lg">
                            <div className="font-bold">{badge.description}</div>
                            <div className="mt-1">{progress.current}/{badge.condition_value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Recent Discoveries</h3>
        <div className="space-y-2">
          {visited.slice(0, 3).map((hotspot) => (
            <div key={hotspot.id} className="bg-white p-3 rounded-xl shadow">
              {hotspot.name}
            </div>
          ))}

          {visited.length === 0 && (
            <p className="text-sm text-slate-500">
              No visits yet. Start exploring to fill your passport.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

