"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/lib/Supabase/browser-client";
import {
  getLevelFromXp,
  getProgressPercentage,
} from "@/lib/services/gamificationLevels";

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const [hotspotsOpen, setHotspotsOpen] = useState(false);
  const [xpPoints, setXpPoints] = useState(0);

  useEffect(() => {
    const loadXp = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("xp_points")
        .eq("id", user.id)
        .single();

      if (userData) {
        setXpPoints(userData.xp_points ?? 0);
      }
    };

    loadXp();
  }, []);

  const level = getLevelFromXp(xpPoints);
  const progress = getProgressPercentage(xpPoints);

  const navLinks = [
    { name: "Home", href: "/" },
    {
      name: "Hotspots",
      href: "/hotspots",
      submenu: [
        { name: "All Hotspots", href: "/hotspots" },
        { name: "Visited", href: "/hotspots/visited" },
        { name: "Favorites", href: "/hotspots/favorites" },
        { name: "Wishlist", href: "/hotspots/wishlist" },
      ],
    },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <aside className="h-full bg-slate-900 text-white flex flex-col justify-between p-6 transition-all duration-300">
      <div>
        {!collapsed && (
          <h1 className="text-lg font-semibold mb-8">
            Unlock Hidden Belgium
          </h1>
        )}

        <nav className="space-y-2">
          {navLinks.map((link) =>
            link.submenu ? (
              <div key={link.name}>
                <button
                  onClick={() => setHotspotsOpen(!hotspotsOpen)}
                  className="flex justify-between items-center w-full px-4 py-2 rounded-xl hover:bg-white/10 transition"
                >
                  {!collapsed && <span>{link.name}</span>}
                  {!collapsed && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        hotspotsOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {!collapsed && hotspotsOpen && (
                  <div className="ml-4 mt-2 space-y-1">
                    {link.submenu.map((s) => (
                      <Link
                        key={s.name}
                        href={s.href}
                        className="block px-4 py-1 text-sm rounded-lg hover:bg-white/10 transition"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                className="block px-4 py-2 rounded-xl hover:bg-white/10 transition"
              >
                {!collapsed && link.name}
              </Link>
            )
          )}
        </nav>
      </div>

      {!collapsed && (
        <div>
          <p className="text-sm mb-2">
            Level {level} Explorer
          </p>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}