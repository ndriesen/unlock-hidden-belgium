"use client";

import { NearbyQuest } from "@/lib/services/quests";

interface NearbyQuestsProps {
  quests: NearbyQuest[];
  loading: boolean;
  onOpenHotspot: (hotspotId: string) => void;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

export default function NearbyQuests({
  quests,
  loading,
  onOpenHotspot,
}: NearbyQuestsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
          Nearby Quests
        </p>
        <h2 className="text-lg font-bold text-slate-900">Ready to unlock today</h2>
      </div>

      {loading && <p className="text-sm text-slate-600">Locating nearby quests...</p>}

      {!loading && quests.length === 0 && (
        <p className="text-sm text-slate-600">
          No nearby quests found yet. Enable location and explore the map.
        </p>
      )}

      <div className="grid gap-2 md:grid-cols-3">
        {quests.map((quest) => (
          <article
            key={quest.hotspot.id}
            className="rounded-xl border border-slate-200 p-3 space-y-2"
          >
            <p className="font-semibold text-slate-900">{quest.hotspot.name}</p>
            <p className="text-xs text-slate-600">
              {quest.hotspot.category} - {quest.hotspot.province}
            </p>
            <p className="text-xs text-emerald-700 font-semibold">
              {formatDistance(quest.distanceKm)} away
            </p>
            <button
              onClick={() => onOpenHotspot(quest.hotspot.id)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            >
              Open quest
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}