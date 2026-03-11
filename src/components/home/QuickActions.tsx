"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  MapPin, 
  Plus, 
  Compass, 
  Heart, 
  Footprints, 
  Trophy,
  Navigation,
  Users,
  Shuffle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
  const router = useRouter();
  const { user } = useAuth();
  const [isSurprising, setIsSurprising] = useState(false);

  const handleSurpriseMe = useCallback(() => {
    setIsSurprising(true);
    onSurpriseMe();
    setTimeout(() => setIsSurprising(false), 1500);
  }, [onSurpriseMe]);

  const handleAddHotspot = useCallback(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    // Open add hotspot modal or navigate
    router.push("/hotspots/my");
  }, [user, router]);

  const handleNearMe = useCallback(() => {
    router.push("/hotspots?filter=nearme");
  }, [router]);

  const actions = [
    {
      icon: Plus,
      label: "Add Hotspot",
      description: "Share a hidden gem",
      onClick: handleAddHotspot,
      color: "bg-emerald-500",
      highlight: true,
    },
    {
      icon: Shuffle,
      label: "Surprise Me",
      description: "Random discovery",
      onClick: handleSurpriseMe,
      color: "bg-amber-500",
      highlight: true,
    },
    {
      icon: MapPin,
      label: "My Trips",
      description: "Plan your adventures",
      href: "/trips",
      color: "bg-blue-500",
    },
    {
      icon: Navigation,
      label: "Near Me",
      description: "Discover nearby",
      onClick: handleNearMe,
      color: "bg-rose-500",
    },
  ];

  return (
    <section className="py-4 md:py-6">
      <div className="container mx-auto px-4">
        {/* Primary Actions - Featured */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
          {actions.map((action) => {
            const Icon = action.icon;
            const isAction = "onClick" in action;

            const buttonContent = (
              <>
                <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  {isSurprising && action.label === "Surprise Me" ? (
                    <Sparkles className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-bold text-slate-900 text-sm md:text-base truncate">
                    {action.label}
                  </p>
                  <p className="text-slate-500 text-xs truncate">
                    {action.description}
                  </p>
                </div>
              </>
            );

            if (isAction) {
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:shadow-lg active:scale-[0.98] ${
                    action.highlight
                      ? "bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-emerald-300 hover:-translate-y-1"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {buttonContent}
                </button>
              );
            }

            return (
              <Link
                key={action.label}
                href={action.href || "/"}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  action.highlight
                    ? "bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-emerald-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {buttonContent}
              </Link>
            );
          })}
        </div>

        {/* Secondary Links */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            href="/hotspots"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
          >
            <Compass className="w-4 h-4" />
            Explore Map
          </Link>
          <Link
            href="/hotspots/wishlist"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-rose-300 hover:text-rose-600 transition-colors"
          >
            <Heart className="w-4 h-4" />
            Wishlist ({wishlistCount})
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-amber-300 hover:text-amber-600 transition-colors"
          >
            <Trophy className="w-4 h-4" />
            {streak} Day Streak
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 flex items-center justify-center gap-6 md:gap-10 text-center">
          <div className="flex flex-col">
            <p className="text-xl md:text-2xl font-bold text-slate-900">{visitedCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Visited</p>
          </div>
          <div className="w-px h-8 md:h-10 bg-slate-200" />
          <div className="flex flex-col">
            <p className="text-xl md:text-2xl font-bold text-slate-900">{wishlistCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Wishlist</p>
          </div>
          <div className="w-px h-8 md:h-10 bg-slate-200" />
          <div className="flex flex-col">
            <p className="text-xl md:text-2xl font-bold text-amber-600">{streak}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Streak</p>
          </div>
        </div>
      </div>
    </section>
  );
}

