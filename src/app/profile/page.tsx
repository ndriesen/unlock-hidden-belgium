"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/Supabase/browser-client";
import {
  getLevelFromXp,
  xpRequiredForLevel,
  totalXpForLevel,
} from "@/lib/services/gamificationLevels";

interface Hotspot {
  id: string;
  name: string;
  province: string;
}

interface UserHotspot {
  visited: boolean;
  wishlist: boolean;
  favorite: boolean;
  hotspots: Hotspot[] | null;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [xpPoints, setXpPoints] = useState(0);
  const [visited, setVisited] = useState<Hotspot[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;

      setUserId(user.id);
      setEmail(user.email ?? "");
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);

      const { data: userData } = await supabase
        .from("users")
        .select("xp_points, username")
        .eq("id", user.id)
        .single();

      if (userData) {
        setXpPoints(userData.xp_points ?? 0);
        setUsername(userData.username ?? "");
      }

      const { data: userHotspots } = await supabase
        .from("user_hotspots")
        .select(`
          visited,
          wishlist,
          favorite,
          hotspots(id, name, province)
        `)
        .eq("user_id", user.id);

      const normalized = (userHotspots ?? []) as UserHotspot[];

      // VISITED
      const visitedList = normalized
        .filter((h) => h.visited)
        .flatMap((h) => h.hotspots ?? []);

      setVisited(visitedList);

      // WISHLIST
      setWishlistCount(
        normalized.filter((h) => h.wishlist).length
      );

      // FAVORITES
      setFavoriteCount(
        normalized.filter((h) => h.favorite).length
      );

      // FETCH ALL BADGES
      const { data: allBadgesData } = await supabase
        .from("badges")
        .select("*");

      // FETCH USER OWNED BADGES
      const { data: userBadgesData } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);

      const ownedIds = new Set(
        userBadgesData?.map((b: any) => b.badge_id)
      );

      const mergedBadges =
        allBadgesData?.map((badge: any) => ({
          ...badge,
          unlocked: ownedIds.has(badge.id),
        })) ?? [];
      console.log("merged badges: " + mergedBadges)
      setAllBadges(mergedBadges);
    };

    fetchUser();
  }, []);

  console.log("All badges" + allBadges)


  /* ================= XP CALCULATIONS ================= */

  const calculatedLevel = getLevelFromXp(xpPoints);
  const xpForNextLevel = xpRequiredForLevel(calculatedLevel);
  const xpAtStartOfLevel = totalXpForLevel(calculatedLevel);

  const xpIntoLevel = xpPoints - xpAtStartOfLevel;
  const xpRemaining = xpForNextLevel - xpIntoLevel;

  const progressPercentage =
    xpForNextLevel > 0
      ? (xpIntoLevel / xpForNextLevel) * 100
      : 0;

  const provincesVisited = new Set(
    visited.map((v) => v.province)
  );

  const provinceProgress =
    visited.length > 0
      ? (provincesVisited.size / 10) * 100
      : 0;

  const explorerTitle =
    calculatedLevel < 5
      ? "Rookie Explorer"
      : calculatedLevel < 10
      ? "Adventurer"
      : calculatedLevel < 20
      ? "Master Explorer"
      : "Legend of Belgium";

  const handleAvatarUpload = async (e: any) => {
    if (!userId) return;

    const file = e.target.files[0];
    if (!file) return;

    const filePath = `${userId}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (error) return console.error(error);

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    setAvatarUrl(publicUrl);
  };

  if (!userId) return <p className="p-6">Loading Passport...</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white text-center space-y-4">

        <div className="relative mx-auto w-28 h-28">
          <div className="w-full h-full rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                onError={() => setAvatarUrl(null)}
                className="w-full h-full object-cover"
              />
            ) : (
              username?.charAt(0).toUpperCase() ||
              email.charAt(0).toUpperCase()
            )}
          </div>

          <label className="absolute bottom-0 right-0 bg-white text-black rounded-full p-2 cursor-pointer shadow">
            ✏️
            <input hidden type="file" onChange={handleAvatarUpload} />
          </label>
        </div>

        <div>
          <h2 className="text-xl font-bold">
            {username || email}
          </h2>
          <p className="text-sm opacity-80">{email}</p>
          <p className="mt-2 text-sm font-semibold">
            {explorerTitle}
          </p>
        </div>
      </div>

      {/* XP CARD */}
      <div className="bg-white rounded-2xl p-6 shadow space-y-4">
        <p className="text-lg font-semibold">
          Level {calculatedLevel} — {explorerTitle}
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

        <p className="text-xs text-gray-400 text-right">
          {xpRemaining} XP remaining
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <Stat value={visited.length} label="Visited" />
        <Stat value={wishlistCount} label="Wishlist" />
        <Stat value={favoriteCount} label="Favorites" />
        <Stat value={`${provincesVisited.size}/10`} label="Provinces" />
      </div>

      {/* PROVINCE PROGRESS */}
      <div className="bg-white rounded-2xl p-6 shadow space-y-3">
        <h3 className="font-semibold">Belgium Coverage</h3>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-700"
            style={{ width: `${provinceProgress}%` }}
          />
        </div>
      </div>

      {/* BADGES */}
      <div>
        <h3 className="font-semibold mb-3">Badge Collection</h3>

        <div className="flex flex-wrap gap-3">
          {allBadges.length === 0 && (
            <p className="text-gray-500 text-sm">
              No badges found.
            </p>
          )}

          {allBadges.map((b) => (
            <div
              key={b.id}
              className={`px-3 py-2 rounded-full text-sm ${
                b.unlocked
                  ? "bg-yellow-100"
                  : "bg-gray-200 opacity-50"
              }`}
            >
              {b.icon} {b.name}
            </div>
          ))}
        </div>
      </div>

      {/* RECENT VISITS */}
      <div>
        <h3 className="font-semibold mb-3">Recent Discoveries</h3>
        <div className="space-y-2">
          {visited.slice(0, 3).map((v) => (
            <div
              key={v.id}
              className="bg-white p-3 rounded-xl shadow"
            >
              {v.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: any) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}