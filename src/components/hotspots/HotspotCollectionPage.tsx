"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUserHotspotCollection,
  UserHotspotCollection,
  UserHotspotEntry,
} from "@/lib/services/userHotspots";

interface HotspotCollectionPageProps {
  collection: UserHotspotCollection;
  title: string;
  emptyMessage: string;
}

function formatVisitedDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "medium",
  }).format(date);
}

export default function HotspotCollectionPage({
  collection,
  title,
  emptyMessage,
}: HotspotCollectionPageProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<UserHotspotEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadCollection = async () => {
      if (!user) {
        setEntries([]);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const data = await fetchUserHotspotCollection(user.id, collection);
        setEntries(data);
      } catch (error) {
        setErrorMessage("Unable to load hotspots right now.");
        console.error("Hotspot collection load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [collection, user]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => a.hotspot.name.localeCompare(b.hotspot.name));
  }, [entries]);

  if (!user) {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <p className="text-slate-700">Please log in to see this collection.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>

      {loading && <p className="text-slate-600">Loading hotspots...</p>}
      {errorMessage && !loading && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {errorMessage}
        </p>
      )}

      {!loading && !errorMessage && sortedEntries.length === 0 && (
        <p className="text-slate-600">{emptyMessage}</p>
      )}

      {!loading && !errorMessage && sortedEntries.length > 0 && (
        <ul className="space-y-2">
          {sortedEntries.map((entry) => (
            <li
              key={entry.hotspot.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-slate-900">{entry.hotspot.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {entry.hotspot.category ?? "Unknown category"} - {entry.hotspot.province ?? "Unknown province"}
              </p>

              {collection === "visited" && entry.visitedAt && (
                <p className="mt-2 text-xs text-slate-500">
                  Visited on {formatVisitedDate(entry.visitedAt)}
                </p>
              )}

              {collection === "all" && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {entry.visited && (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                      Visited
                    </span>
                  )}
                  {entry.wishlist && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                      Wishlist
                    </span>
                  )}
                  {entry.favorite && (
                    <span className="rounded-full bg-fuchsia-100 px-2 py-1 text-fuchsia-700">
                      Favorite
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}