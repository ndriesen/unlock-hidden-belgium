"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/Supabase/browser-client";

interface Hotspot {
  id: string;
  name: string;
  province: string;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [xpPoints, setXpPoints] = useState(0);
  const [explorerLevel, setExplorerLevel] = useState(1);

  const [visited, setVisited] = useState<Hotspot[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const [badges, setBadges] = useState<Badge[]>([]);
  const [editing, setEditing] = useState(false);

  /* ================= LOAD USER ================= */

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
        .select("xp_points, explorer_level, username")
        .eq("id", user.id)
        .single();

      if (userData) {
        setXpPoints(userData.xp_points ?? 0);
        setExplorerLevel(userData.explorer_level ?? 1);
        setUsername(userData.username ?? "");
      }

      const { data: userHotspots } = await supabase
        .from("user_hotspots")
        .select("status, hotspots(id, name, province)")
        .eq("user_id", user.id);

      if (userHotspots) {
        const visitedList = userHotspots
          .filter((h: any) => h.status === "visited")
          .map((h: any) => h.hotspots);

        setVisited(visitedList);
        setWishlistCount(
          userHotspots.filter((h: any) => h.status === "wishlist").length
        );
        setFavoriteCount(
          userHotspots.filter((h: any) => h.status === "favorite").length
        );
      }

      const { data: badgeData } = await supabase
        .from("user_badges")
        .select("badges(*)")
        .eq("user_id", user.id);

      setBadges(badgeData?.map((b: any) => b.badges) ?? []);
    };

    fetchUser();
  }, []);

  /* ================= AVATAR UPLOAD ================= */

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

  /* ================= XP PROGRESS ================= */

  const xpForNextLevel = explorerLevel * 100;
  const progress =
    ((xpPoints % xpForNextLevel) / xpForNextLevel) * 100;

  const provincesVisited = new Set(visited.map((v) => v.province));
  const provinceProgress =
    (provincesVisited.size / 10) * 100;

  const explorerTitle =
    explorerLevel < 5
      ? "Rookie Explorer"
      : explorerLevel < 10
      ? "Adventurer"
      : explorerLevel < 20
      ? "Master Explorer"
      : "Legend of Belgium";

  if (!userId) return <p className="p-6">Loading Passport...</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      {/* PASSPORT HEADER */}
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
      <div className="bg-white rounded-2xl p-6 shadow space-y-3">
        <div className="flex justify-between font-medium">
          <span>Level {explorerLevel}</span>
          <span>{xpPoints} XP</span>
        </div>

        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-gray-500">
          {xpForNextLevel - (xpPoints % xpForNextLevel)} XP to next level
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
            className="h-full bg-teal-500"
            style={{ width: `${provinceProgress}%` }}
          />
        </div>
      </div>

      {/* BADGES */}
      <div>
        <h3 className="font-semibold mb-3">Badge Collection</h3>
        <div className="flex flex-wrap gap-3">
          {badges.length === 0 && (
            <p className="text-gray-500 text-sm">
              Earn your first badge by exploring!
            </p>
          )}
          {badges.map((b) => (
            <div
              key={b.id}
              className="bg-yellow-100 px-3 py-2 rounded-full text-sm"
            >
              {b.name}
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