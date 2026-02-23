"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser-client";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [hotspots, setHotspots] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from("user_hotspots")
        .select(`
          hotspot:hotspot_id(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "favorite");

      if (error) console.error("Error fetching favorites:", error.message);
      else setHotspots(data ?? []);
    };

    fetchFavorites();
  }, [user]);

  if (!user) return <p>Please login to see your favorites.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">⭐ Favorites</h1>
      {hotspots.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <ul className="space-y-2">
          {hotspots.map((h) => (
            <li key={h.hotspot.id} className="border p-3 rounded">
              <p className="font-bold">{h.hotspot.name}</p>
              <p className="text-sm">{h.hotspot.category} — {h.hotspot.province}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}