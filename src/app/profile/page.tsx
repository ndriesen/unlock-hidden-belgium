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
  const [activeTab, setActiveTab] = useState<'overview' | 'preferences' | 'badges'>('overview');

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Buddy Preferences edit state
  const [buddyName, setBuddyName] = useState("");
  const [buddyCity, setBuddyCity] = useState("");
  const [buddyBio, setBuddyBio] = useState("");
  const [buddyAvailability, setBuddyAvailability] = useState("Flexible");
  const [buddyStyle, setBuddyStyle] = useState<TravelStyle>("balanced");
  const [buddyInterests, setBuddyInterests] = useState<string[]>([]);
  const [buddyLanguages, setBuddyLanguages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

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

      // Load buddy profile
      if (userId) {
        const profile = await fetchOwnBuddyProfile(userId);
        if (profile) {
          setBuddyProfile(profile);
          setBuddyName(profile.name);
          setBuddyCity(profile.city);
          setBuddyBio(profile.bio || '');
          setBuddyAvailability(profile.availability);
          setBuddyStyle(profile.style);
          setBuddyInterests(profile.interests);
          // Languages not in current type, mock for now
          setBuddyLanguages(['NL', 'EN']);
        }
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
  }, [userId]);

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

  const handleSaveBuddyPreferences = async () => {
    if (!userId) return;

    setSaving(true);
    setSaveMessage('');

    const result = await upsertOwnBuddyProfile(userId, {
      name: buddyName,
      city: buddyCity,
      interests: buddyInterests,
      style: buddyStyle,
      availability: buddyAvailability,
      bio: buddyBio,
    });

    if (result.ok) {
      setSaveMessage('Buddy preferences saved!');
      // Refresh buddy profile
      const profile = await fetchOwnBuddyProfile(userId);
      setBuddyProfile(profile || null);
    } else {
      setSaveMessage('Error saving. Check console.');
    }

    setSaving(false);
  };

  const toggleInterest = (interest: string) => {
    setBuddyInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleLanguage = (lang: string) => {
    setBuddyLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  if (!userId) {
    return <p className="p-6">Loading profile...</p>;
  }

  // Profile tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'preferences' as const, label: 'Buddy Preferences', icon: '👥' },
    { id: 'badges' as const, label: 'Badges', icon: '🏆' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-32 h-32">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-4xl font-bold shadow-2xl">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                onError={() => setAvatarUrl(null)}
                alt="Avatar"
                fill
                className="object-cover rounded-full"
              />
            ) : (
              <span>{username?.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg cursor-pointer">
            ✏️
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{username || email}</h1>
          <p className="text-lg text-slate-600">{explorerTitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "badges" | "overview" | "preferences")}
                className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Level Progress */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">Level {calculatedLevel}</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Progress to Level {calculatedLevel + 1}</span>
                    <span>{xpIntoLevel} / {xpForNextLevel} XP</span>
                  </div>
                  <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{xpRemaining} XP remaining</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat value={visited.length} label="Visited" />
                <Stat value={wishlistCount} label="Wishlist" />
                <Stat value={favoriteCount} label="Favorites" />
                <Stat value={`${provincesVisited.size}/10`} label="Provinces" />
              </div>

              {/* Coverage */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold mb-3">Belgium Coverage</h3>
                <div className="h-4 bg-slate-200 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                    style={{ width: `${provinceProgress}%` }}
                  />
                </div>
              </div>

              {/* Recent Discoveries */}
              <div>
                <h3 className="font-bold mb-4">Recent Discoveries</h3>
                <div className="space-y-3">
                  {visited.slice(0, 4).map((hotspot) => (
                    <div key={hotspot.id} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        📍
                      </div>
                      <div>
                        <p className="font-semibold">{hotspot.name}</p>
                        <p className="text-sm text-slate-600">{hotspot.province}</p>
                      </div>
                    </div>
                  ))}
                  {visited.length === 0 && (
                    <p className="text-slate-500 p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      Start your adventure!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="max-w-2xl space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Buddy Preferences</h2>
              <p className="text-slate-600">Set your travel style to find perfect companions</p>

              {/* Display current profile */}
              {buddyProfile && (
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <h3 className="font-bold mb-4">Current preferences</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Style</span>
                      <p className="font-semibold capitalize">{buddyProfile.style}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">City</span>
                      <p className="font-semibold">{buddyProfile.city}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Availability</span>
                      <p className="font-semibold">{buddyProfile.availability}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Form */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                <div className="space-y-6">
                  <div>
                    <label className="block font-semibold mb-2">Buddy Name</label>
                    <input
                      type="text"
                      value={buddyName}
                      onChange={(e) => setBuddyName(e.target.value)}
                      placeholder="How others see you"
                      className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">City/Base</label>
                    <input
                      type="text"
                      value={buddyCity}
                      onChange={(e) => setBuddyCity(e.target.value)}
                      placeholder="e.g. Antwerp"
                      className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-3">Travel Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'slow' as TravelStyle, label: 'Slow Explorer' },
                        { value: 'balanced' as TravelStyle, label: 'Balanced' },
                        { value: 'active' as TravelStyle, label: 'Active Adventurer' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setBuddyStyle(option.value)}
                          className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                            buddyStyle === option.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-3">Interests</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl max-h-32 overflow-y-auto">
                      {BUDDY_INTEREST_OPTIONS.map((interest) => (
                        <button
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            buddyInterests.includes(interest)
                              ? 'bg-emerald-500 text-white shadow-md'
                              : 'bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                    {buddyInterests.length > 0 && (
                      <p className="text-sm text-emerald-600 mt-2">
                        {buddyInterests.length} interests selected
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Languages</label>
                    <div className="flex gap-2 flex-wrap">
                      {['NL', 'FR', 'EN', 'DE'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            buddyLanguages.includes(lang)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Availability</label>
                    <select
                      value={buddyAvailability}
                      onChange={(e) => setBuddyAvailability(e.target.value)}
                      className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Flexible</option>
                      <option>Weekends</option>
                      <option>Weekdays</option>
                      <option>This month</option>
                      <option>Next month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Bio</label>
                    <textarea
                      value={buddyBio}
                      onChange={(e) => setBuddyBio(e.target.value)}
                      rows={4}
                      placeholder="Tell explorers about your travel style..."
                      className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-vertical"
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <button
                      onClick={handleSaveBuddyPreferences}
                      disabled={saving}
                      className="flex-1 bg-emerald-600 text-white py-4 px-8 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg"
                    >
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                    {saveMessage && (
                      <div className={`text-sm py-3 px-6 rounded-xl font-semibold flex-1 flex items-center justify-center ${
                        saveMessage.includes('saved') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {saveMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Badges ({earnedBadges.length})</h2>
              </div>
              {earnedBadges.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <span className="text-4xl mb-4 block">🏆</span>
                  <h3 className="text-xl font-bold mb-2">No badges yet</h3>
                  <p className="text-slate-600 mb-6">Keep exploring to unlock achievements</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {earnedBadges.map(({ badges: badge, awarded_at }) => {
                    const progress = userStats ? getProgress(badge, userStats) : { current: 0, desc: '' };
                    return (
                      <div key={badge.id} className="group bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all relative">
                        <div className="text-2xl mb-2">{badge.icon}</div>
                        <h4 className="font-bold text-slate-900 mb-1">{badge.name}</h4>
                        <p className="text-sm text-slate-600 mb-2">{badge.description}</p>
                        <div className="text-xs text-slate-500 mb-2">
                          Awarded {new Date(awarded_at).toLocaleDateString()}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-bold">
                          {progress.current}/{badge.condition_value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {(() => {
                const unearnedBadges = allBadgesFull.filter(b => !earnedBadges.some(e => e.badges.id === b.id));
                if (unearnedBadges.length > 0) {
                  return (
                    <div>
                      <p 
                        className="text-blue-600 cursor-pointer hover:underline font-semibold mb-4"
                        onClick={() => setShowUnearned(!showUnearned)}
                      >
                        {showUnearned ? 'Hide' : 'Show'} {unearnedBadges.length} available badges
                      </p>
                      {showUnearned && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {unearnedBadges.map((badge) => {
                            const progress = userStats ? getProgress(badge, userStats) : { current: 0, desc: '' };
                            return (
                              <div key={badge.id} className="bg-slate-50 p-4 rounded-xl opacity-70 relative group">
                                <div className="text-2xl mb-2">{badge.icon}</div>
                                <h4 className="font-bold text-slate-900 mb-1">{badge.name}</h4>
                                <p className="text-sm text-slate-600">{badge.description}</p>
                                <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                                  {progress.current}/{badge.condition_value}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
              })()}
            </div>
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


