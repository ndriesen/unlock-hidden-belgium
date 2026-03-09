"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  Crown,
  Flag,
  Flame,
  Home,
  Map,
  Heart,
  Route,
  User,
  Users,
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
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();

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
    { name: "Explore", href: "/hotspots", icon: Map },
    { name: "My Hotspots", href: "/hotspots/my", icon: Heart },
    { name: "Trips", href: "/trips", icon: Route },
    { name: "Buddies", href: "/buddies", icon: Users },
    { name: "Activity", href: "/activity", icon: Bell },
    { name: "Pricing", href: "/pricing", icon: Crown },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <aside className="h-full bg-slate-950 text-slate-100 flex flex-col justify-between px-3 py-4 transition-all duration-300 border-r border-white/10">
      <div className="space-y-4">
        <div className={`px-2 ${collapsed ? "text-center" : ""}`}>
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <Flag className="w-4 h-4 text-emerald-300" />
            {!collapsed && <span className="text-sm font-semibold">Spotly</span>}
          </div>
          {!collapsed && (
            <p className="mt-2 text-[11px] text-slate-400">Unlock hidden gems</p>
          )}
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
              Keep your rhythm by exploring at least one hotspot today.
            </p>
          </div>
        )}

        <nav className="space-y-1">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.icon;

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
                {!collapsed && <span className="text-sm font-medium">{link.name}</span>}
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

