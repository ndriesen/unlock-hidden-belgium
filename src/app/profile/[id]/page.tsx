"use client";

import Image from "next/image";
import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/Supabase/browser-client";

interface PublicProfile {
  id: string;
  name: string;
  city: string;
  interests: string[];
  style: string;
  availability: string;
  bio: string;
  avatarUrl: string;
  xpPoints: number;
}

interface BuddyProfileRow {
  user_id: string;
  display_name: string | null;
  city: string | null;
  interests: string[] | null;
  travel_style: string | null;
  availability: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  city: string | null;
  interests: string[] | null;
  travel_style: string | null;
  availability: string | null;
  bio: string | null;
  avatar_url: string | null;
  xp_points: number | null;
}

function normalizeInterests(value: string[] | null | undefined): string[] {
  if (!value || !Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string").slice(0, 8);
}

function normalizeStyle(value: string | null | undefined): string {
  if (!value) return "Balanced";
  if (value === "slow") return "Slow explorer";
  if (value === "active") return "Active";
  return "Balanced";
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const id = use(params).id;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");
  
      const { data: buddyData } = await supabase
        .from("buddy_profiles")
        .select("user_id,display_name,city,interests,travel_style,availability,bio,avatar_url")
        .eq("user_id", id)
        .maybeSingle();

      if (!active) return;

      if (buddyData) {
        const row = buddyData as BuddyProfileRow;
        setProfile({
          id: row.user_id,
          name: row.display_name ?? "Explorer",
          city: row.city ?? "Unknown",
          interests: normalizeInterests(row.interests),
          style: normalizeStyle(row.travel_style),
          availability: row.availability ?? "Flexible",
          bio: row.bio ?? "Always up for discovering new places.",
          avatarUrl: row.avatar_url ?? "",
          xpPoints: 0,
        });
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("id,username,email,city,interests,travel_style,availability,bio,avatar_url,xp_points")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (!userData) {
        setError("Profile not found.");
        setLoading(false);
        return;
      }

      const row = userData as UserRow;
      const fallbackName = row.username || row.email?.split("@")[0] || "Explorer";

      setProfile({
        id: row.id,
        name: fallbackName,
        city: row.city ?? "Unknown",
        interests: normalizeInterests(row.interests),
        style: normalizeStyle(row.travel_style),
        availability: row.availability ?? "Flexible",
        bio: row.bio ?? "Looking for new places to explore.",
        avatarUrl: row.avatar_url ?? "",
        xpPoints: row.xp_points ?? 0,
      });
      setLoading(false);
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="p-6 text-slate-600">Loading profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-slate-600">
        {error || "Profile not available."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-slate-100 text-3xl font-bold text-slate-500 flex items-center justify-center">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-sm text-slate-600">{profile.city} ? {profile.availability}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-700">{profile.style}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">About</h2>
          <p className="text-sm text-slate-700">{profile.bio}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">Interests</h2>
          {profile.interests.length === 0 ? (
            <p className="text-sm text-slate-600">No interests shared yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
