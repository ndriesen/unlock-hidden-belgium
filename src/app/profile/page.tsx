"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser-client";
import { Hotspot } from "@/components/Map";
import { Badge } from "@/lib/types"; // optioneel, kan inline type

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [xpPoints, setXpPoints] = useState<number>(0);
  const [explorerLevel, setExplorerLevel] = useState<number>(1);
  const [visitedHotspots, setVisitedHotspots] = useState<Hotspot[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [provincesPercent, setProvincesPercent] = useState<number>(0);

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;

      setUserId(user.id);
      setEmail(user.email ?? "");

      // Fetch user XP, level
      const { data: userData } = await supabase
        .from("users")
        .select("xp_points, explorer_level")
        .eq("id", user.id)
        .single();
      if (userData) {
        setXpPoints(userData.xp_points);
        setExplorerLevel(userData.explorer_level);
      }

      // Fetch visited hotspots
      const { data: hotspotsData } = await supabase
        .from("user_hotspots")
        .select("hotspots(*)")
        .eq("user_id", user.id)
        .eq("status", "visited");
      setVisitedHotspots(hotspotsData?.map((uh: any) => uh.hotspots) ?? []);

      // Fetch earned badges
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("badges(*)")
        .eq("user_id", user.id);
      setBadges(badgesData?.map((ub: any) => ub.badges) ?? []);

      // Compute % provinces visited
      const provincesVisited = new Set(
        (hotspotsData?.map((uh: any) => uh.hotspots.province) ?? [])
      );
      const totalProvinces = 10; // België heeft 10 provincies
      setProvincesPercent(Math.round((provincesVisited.size / totalProvinces) * 100));
    };

    fetchUser();
  }, []);

  if (!userId) return <p>Loading profile...</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

      <div className="mb-6">
        <p className="font-medium">Email: {email}</p>
        <p className="font-medium">Explorer Level: {explorerLevel}</p>
        <p className="font-medium">XP Points: {xpPoints}</p>
        <p className="font-medium">Provinces Explored: {provincesPercent}%</p>
        <p className="font-medium">Visited Hotspots: {visitedHotspots.length}</p>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Earned Badges</h2>
        {badges.length === 0 ? (
          <p>No badges earned yet 🎯</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <div
                key={b.id}
                className="bg-yellow-100 p-2 rounded flex items-center gap-2"
              >
                {b.icon && <img src={b.icon} alt={b.name} className="w-6 h-6" />}
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}