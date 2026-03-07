"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ChevronDown,
  Compass,
  Flag,
  Heart,
  Home,
  Map,
  Route,
  User,
  Users,
  CheckCircle2,
  Star,
  Flame,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/Supabase/browser-client";
import {
  getLevelFromXp,
  getProgressPercentage,
} from "@/lib/services/gamificationLevels";
import { fetchVisitStatsForUser } from "@/lib/services/engagement";

interface SidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

interface NavLink {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  submenu?: Array<{
    name: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
  }>;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const [hotspotsOpen, setHotspotsOpen] = useState(() =>
    pathname.startsWith("/hotspots")
  );
  const [xpPoints, setXpPoints] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [dailyVisitDone, setDailyVisitDone] = useState(false);

  useEffect(() => {
    const loadSidebarStats = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      if (!currentUser) return;

      const { data: userData } = await supabase
        .from("users")
        .select("xp_points")
        .eq("id", currentUser.id)
        .single();

      if (userData) {
        setXpPoints(userData.xp_points ?? 0);
      }

      const visitStats = await fetchVisitStatsForUser(currentUser.id);
      setDailyStreak(visitStats.streak);
      setDailyVisitDone(visitStats.visitedToday);
    };

    void loadSidebarStats();
  }, [pathname]);

  const level = getLevelFromXp(xpPoints);
  const progress = getProgressPercentage(xpPoints);

  const navLinks: NavLink[] = [
    { name: "Home", href: "/", icon: Home },
    {
      name: "Hotspots",
      href: "/hotspots",
      icon: Map,
      submenu: [
        { name: "All", href: "/hotspots", icon: Compass },
        { name: "Visited", href: "/hotspots/visited", icon: CheckCircle2 },
        { name: "Favorites", href: "/hotspots/favorites", icon: Star },
        { name: "Wishlist", href: "/hotspots/wishlist", icon: Heart },
      ],
    },
    { name: "Trips", href: "/trips", icon: Route },
    { name: "Buddies", href: "/buddies", icon: Users },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <aside className="h-full bg-slate-950 text-slate-100 flex flex-col justify-between px-3 py-4 transition-all duration-300 border-r border-white/10">
      <div className="space-y-4">
        <div className={`px-2 ${collapsed ? "text-center" : ""}`}>
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <Flag className="w-4 h-4 text-emerald-300" />
            {!collapsed && (
              <span className="text-sm font-semibold">Unlock Belgium</span>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                {dailyStreak}-day streak
              </span>
              <span>{dailyVisitDone ? "Visited today" : "Visit pending"}</span>
            </div>
            <p className="text-xs text-slate-400">
              Open the map, discover one place, keep your streak alive.
            </p>
          </div>
        )}

        <nav className="space-y-1">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.icon;

            if (link.submenu) {
              return collapsed ? (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={onNavigate}
                  aria-label={link.name}
                  className={`flex items-center justify-center rounded-xl p-2 transition ${
                    active ? "bg-emerald-500/20 text-emerald-200" : "hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ) : (
                <div key={link.name} className="space-y-1">
                  <button
                    onClick={() => setHotspotsOpen((prev) => !prev)}
                    className={`flex justify-between items-center w-full px-3 py-2 rounded-xl transition ${
                      active ? "bg-emerald-500/20 text-emerald-200" : "hover:bg-white/10"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <Icon className="w-4 h-4" />
                      {link.name}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        hotspotsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {hotspotsOpen && (
                    <div className="ml-2 pl-2 border-l border-white/10 space-y-1">
                      {link.submenu.map((subLink) => {
                        const SubIcon = subLink.icon;
                        const subActive = isActive(pathname, subLink.href);

                        return (
                          <Link
                            key={subLink.name}
                            href={subLink.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
                              subActive
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5" />
                            {subLink.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={onNavigate}
                aria-label={link.name}
                className={`flex items-center rounded-xl px-3 py-2 transition ${
                  active ? "bg-emerald-500/20 text-emerald-200" : "hover:bg-white/10"
                } ${collapsed ? "justify-center" : "gap-2"}`}
              >
                <Icon className="w-4 h-4" />
                {!collapsed && (
                  <span className="text-sm font-medium">{link.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {!collapsed && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400 mb-1">Explorer Level {level}</p>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
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