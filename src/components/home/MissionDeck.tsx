"use client";

import type { ComponentType } from "react";
import { Flame, Heart, Star, Footprints, Compass } from "lucide-react";

interface MissionDeckProps {
  visitedCount: number;
  wishlistCount: number;
  favoriteCount: number;
  streak: number;
  visitedToday: boolean;
}

interface MissionItem {
  id: string;
  label: string;
  value: number;
  target: number;
  icon: ComponentType<{ className?: string }>;
  doneLabel: string;
}

function MissionProgress({ value, target }: { value: number; target: number }) {
  const percentage = Math.min((value / target) * 100, 100);

  return (
    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
      <div
        className="h-full bg-emerald-500 transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function MissionDeck({
  visitedCount,
  wishlistCount,
  favoriteCount,
  streak,
  visitedToday,
}: MissionDeckProps) {
  const missions: MissionItem[] = [
    {
      id: "visit_today",
      label: "Visit 1 new place today",
      value: visitedToday ? 1 : 0,
      target: 1,
      icon: Footprints,
      doneLabel: "Daily visit done",
    },
    {
      id: "wishlist_builder",
      label: "Build a 5-place wishlist",
      value: wishlistCount,
      target: 5,
      icon: Heart,
      doneLabel: "Wishlist mission done",
    },
    {
      id: "favorite_curator",
      label: "Curate 3 favorites",
      value: favoriteCount,
      target: 3,
      icon: Star,
      doneLabel: "Favorites mission done",
    },
    {
      id: "explorer_path",
      label: "Reach 10 visited spots",
      value: visitedCount,
      target: 10,
      icon: Compass,
      doneLabel: "Explorer path unlocked",
    },
  ];

  const completed = missions.filter((mission) => mission.value >= mission.target).length;

  return (
    <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 md:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Adventure Loop</p>
          <h2 className="text-lg font-bold text-slate-900">Daily Missions</h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-white border border-emerald-200 px-3 py-1.5">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-slate-800">{streak} day streak</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {missions.map((mission) => {
          const done = mission.value >= mission.target;
          const Icon = mission.icon;

          return (
            <article
              key={mission.id}
              className={`rounded-xl border p-3 space-y-2 ${
                done
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${done ? "text-emerald-600" : "text-slate-500"}`} />
                <p className="text-sm font-semibold text-slate-900">{mission.label}</p>
              </div>
              <MissionProgress value={mission.value} target={mission.target} />
              <p className="text-xs text-slate-600">
                {done
                  ? mission.doneLabel
                  : `${Math.min(mission.value, mission.target)} / ${mission.target}`}
              </p>
            </article>
          );
        })}
      </div>

      <p className="text-sm text-slate-700">
        {completed}/{missions.length} missions complete. Keep the streak alive to unlock more badges faster.
      </p>
    </section>
  );
}