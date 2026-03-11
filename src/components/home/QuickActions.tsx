"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Sparkles, Map, Heart, Trophy, Users } from "lucide-react";
import { Hotspot } from "@/types/hotspot";

interface QuickActionsProps {
  onSurpriseMe: () => void;
  visitedCount: number;
  wishlistCount: number;
  streak: number;
}

export default function QuickActions({
  onSurpriseMe,
  visitedCount,
  wishlistCount,
  streak,
}: QuickActionsProps) {
  const [isSurprising, setIsSurprising] = useState(false);

  const handleSurpriseMe = useCallback(() => {
    setIsSurprising(true);
    onSurpriseMe();
    setTimeout(() => setIsSurprising(false), 1000);
  }, [onSurpriseMe]);

  const actions = [
    {
      icon: Map,
      label: "Open Map",
      href: "/hotspots",
      color: "bg-emerald-500",
      description: "Explore all hotspots",
    },
    {
      icon: Heart,
      label: "Wishlist",
      href: "/hotspots/wishlist",
      color: "bg-rose-500",
      description: `${wishlistCount} places saved`,
    },
    {
      icon: Trophy,
      label: "Achievements",
      href: "/profile",
      color: "bg-amber-500",
      description: `${streak} day streak`,
    },
    {
      icon: Users,
      label: "Find Buddies",
      href: "/buddies",
      color: "bg-blue-500",
      description: "Connect with explorers",
    },
  ];

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Surprise Me Button - Featured */}
          <button
            onClick={handleSurpriseMe}
            disabled={isSurprising}
            className="col-span-2 md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 p-4 text-white shadow-lg shadow-amber-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/40 active:scale-[0.98] disabled:opacity-80"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-30 animate-pulse" />
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className={`w-6 h-6 ${isSurprising ? 'animate-spin' : 'animate-pulse'}`} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">🎲 Surprise Me!</p>
                  <p className="text-white/80 text-sm">Discover a random gem</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </button>

          {/* Action Grid */}
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {action.label}
                  </p>
                  <p className="text-slate-500 text-xs truncate">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats Summary */}
        <div className="mt-6 flex items-center justify-center gap-8 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-900">{visitedCount}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Visited</p>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div>
            <p className="text-2xl font-bold text-slate-900">{wishlistCount}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Wishlist</p>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div>
            <p className="text-2xl font-bold text-amber-600">{streak}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Day Streak</p>
          </div>
        </div>
      </div>
    </section>
  );
}

