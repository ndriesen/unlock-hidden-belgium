"use client";

import Image from "next/image";
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

interface UserHotspotRow {
  visited: boolean;
  wishlist: boolean;
  favorite: boolean;
  hotspots: Hotspot | Hotspot[] | null;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
}

interface BadgeRow {
  id: string;
  name: string;
  icon: string;
}

function normalizeHotspot(joinedHotspot: UserHotspotRow["hotspots"]): Hotspot | null {
  if (!joinedHotspot) return null;
  return Array.isArray(joinedHotspot) ? (joinedHotspot[0] ?? null) : joinedHotspot;
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
        console.error("User profile load error:", userError);
      }

      if (userData) {
        setXpPoints(userData.xp_points ?? 0);
        setUsername(userData.username ?? "");
      }

      const { data: userHotspots, error: hotspotError } = await supabase
        .from("user_hotspots")
        .select(
          `
            visited,
            wishlist,
            favorite,
            hotspots(id, name, province)
          `
        )
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

      const { data: allBadgesData, error: badgesError } = await supabase
        .from("badges")
        .select("id, name, icon");

      if (badgesError) {
        console.error("Badge catalog load error:", badgesError);
      }

      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", authUser.id);

      if (userBadgesError) {
        console.error("User badges load error:", userBadgesError);
      }

      const ownedIds = new Set(
        (userBadgesData ?? []).map((entry: { badge_id: string }) => entry.badge_id)
      );

      const mergedBadges = ((allBadgesData ?? []) as BadgeRow[]).map((badge) => ({
        ...badge,
        unlocked: ownedIds.has(badge.id),
      }));

      setAllBadges(mergedBadges);
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

    // Use UUID for secure random path
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

        <div className="flex flex-wrap gap-3">
          {allBadges.length === 0 && (
            <p className="text-gray-500 text-sm">No badges found.</p>
          )}

          {allBadges.map((badge) => (
            <div
              key={badge.id}
              className={`px-3 py-2 rounded-full text-sm ${
                badge.unlocked ? "bg-yellow-100" : "bg-gray-200 opacity-50"
              }`}
            >
              {badge.icon} {badge.name}
            </div>
          ))}
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

