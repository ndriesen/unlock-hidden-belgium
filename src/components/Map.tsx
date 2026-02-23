"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { supabase } from "@/lib/supabase/browser-client";
import Notifications, { Notification } from "@/components/Notifications";
import BadgeCelebration from "@/components/BadgeCelebration";

// Fix default icon issue with Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface Hotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  province: string;
}

interface MapProps {
  categoryFilter?: string;
  provinceFilter?: string;
}

export default function Map({ categoryFilter, provinceFilter }: MapProps) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);
  const nextId = useRef(0);

  // --- Notifications helper ---
  const showNotification = (message: string, type: "xp" | "badge") => {
    const id = nextId.current++;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 2500);
  };

  // --- Fetch logged-in user ---
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user.id ?? null);
    };
    getUser();
  }, []);

  // --- Fetch hotspots ---
  useEffect(() => {
    const fetchHotspots = async () => {
      const { data, error } = await supabase.from("hotspots").select("*");
      if (error) console.error("Failed to load hotspots:", error.message);
      else setHotspots(data as Hotspot[]);
    };
    fetchHotspots();
  }, []);

  // --- Apply filters ---
  const filteredHotspots = hotspots.filter(
    (h) =>
      (!categoryFilter || h.category === categoryFilter) &&
      (!provinceFilter || h.province === provinceFilter)
  );

  // --- Mark hotspot visited + XP + Badge ---
  const markVisited = async (hotspotId: string) => {
    if (!userId) return showNotification("Please login first", "badge");

    await supabase.from("user_hotspots").upsert({
      user_id: userId,
      hotspot_id: hotspotId,
      status: "visited",
      visited_at: new Date(),
    });

    const { error: xpError } = await supabase.rpc("increment_xp", {
      p_user_id: userId,
    });
    if (xpError) console.error("XP error:", xpError.message);
    else showNotification("+10 XP", "xp");

    const { error: badgeError } = await supabase.rpc("award_badges", {
      p_user_id: userId,
    });
    if (badgeError) console.error("Badge error:", badgeError.message);
    else {
      showNotification("🏅 Badge earned!", "badge");
      setBadgeUnlocked(true);
    }
  };
  
  return (
    <>
      <MapContainer
        center={[50.85, 4.35]}
        zoom={8}
        className="w-full h-[70vh] sm:h-[80vh]"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {filteredHotspots.map((h) => (
          <Marker
            key={h.id}
            position={[h.latitude, h.longitude]}
            title={h.name}
          >
            <Popup>
              <div className="space-y-2">
                <h2 className="font-bold text-sm sm:text-base">{h.name}</h2>
                <p className="text-xs sm:text-sm">
                  {h.category} — {h.province}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <button
                    onClick={() => markVisited(h.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded w-full sm:w-auto transition-transform hover:scale-105"
                  >
                    Mark as Visited
                  </button>

                  <button
                    onClick={async () => {
                      if (!userId) return showNotification("Login first", "badge");
                      await supabase.from("user_hotspots").upsert({
                        user_id: userId,
                        hotspot_id: h.id,
                        status: "wishlist",
                        created_at: new Date(),
                      });
                      showNotification("Added to Wishlist 💡", "badge");
                    }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded w-full sm:w-auto transition-transform hover:scale-105"
                  >
                    Wishlist
                  </button>

                  <button
                    onClick={async () => {
                      if (!userId) return showNotification("Login first", "badge");
                      await supabase.from("user_hotspots").upsert({
                        user_id: userId,
                        hotspot_id: h.id,
                        status: "favorite",
                        created_at: new Date(),
                      });
                      showNotification("Marked as Favorite ⭐", "badge");
                    }}
                    className="bg-purple-600 text-white px-3 py-1 rounded w-full sm:w-auto transition-transform hover:scale-105"
                  >
                    Favorite
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Notifications & Badge Celebration */}
      <Notifications notifications={notifications} />
      <BadgeCelebration trigger={badgeUnlocked} onComplete={() => setBadgeUnlocked(false)} />
    </>
  );
}