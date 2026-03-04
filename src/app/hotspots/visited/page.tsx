"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/Supabase/browser-client";

export default function VisitedPage() {
  const { user } = useAuth();
  const [hotspots, setHotspots] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchVisited = async () => {
      const { data, error } = await supabase
        .from("user_hotspots")
        .select(`
          hotspot:hotspot_id(*),
          visited_at
        `)
        .eq("user_id", user.id)
        .eq("status", "visited");

      if (error) console.error("Error fetching visited hotspots:", error.message);
      else setHotspots(data ?? []);
    };

    fetchVisited();
  }, [user]);

  if (!user) return <p>Please login to see your visited hotspots.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">✅ Visited</h1>
      {hotspots.length === 0 ? (
        <p>You haven’t visited any hotspots yet.</p>
      ) : (
        <ul className="space-y-2">
          {hotspots.map((h) => (
            <li key={h.hotspot.id} className="border p-3 rounded">
              <p className="font-bold">{h.hotspot.name}</p>
              <p className="text-sm">{h.hotspot.category} — {h.hotspot.province}</p>
              <p className="text-xs text-gray-500">Visited: {new Date(h.visited_at).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}