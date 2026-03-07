"use client";

import { useEffect, useState } from "react";
import { LeagueBoard, fetchLeagueBoard } from "@/lib/services/leagues";

interface LeaguePanelProps {
  userId: string | null;
}

export default function LeaguePanel({ userId }: LeaguePanelProps) {
  const [board, setBoard] = useState<LeagueBoard>({
    entries: [],
    currentUserEntry: null,
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;

    const timer = setTimeout(() => {
      void (async () => {
        const next = await fetchLeagueBoard(userId, 10);
        if (active) {
          setBoard(next);
        }
      })();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [userId]);

  if (!userId) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
          Weekly League
        </p>
        <h2 className="text-lg font-bold text-slate-900">Explorer Rankings</h2>
      </div>

      <div className="grid gap-2">
        {board.entries.slice(0, 5).map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
          >
            <p className="text-sm font-semibold text-slate-900">
              #{entry.rank} {entry.name}
            </p>
            <p className="text-xs text-slate-600">
              {entry.xp} XP - {entry.tier}
            </p>
          </div>
        ))}
      </div>

      {board.currentUserEntry && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-sm font-semibold text-emerald-900">
            Your rank: #{board.currentUserEntry.rank}
          </p>
          <p className="text-xs text-emerald-800">
            {board.currentUserEntry.xp} XP - {board.currentUserEntry.tier}
          </p>
        </div>
      )}
    </section>
  );
}