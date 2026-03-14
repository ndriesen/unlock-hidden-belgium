"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  BUDDY_INTEREST_OPTIONS,
  BuddyProfile,
  BuddyRequest,
  TravelStyle,
  calculateBuddyMatchScore,
  createBuddyRequest,
  fetchBuddyProfiles,
  fetchBuddyRequests,
  fetchOwnBuddyProfile,
  upsertOwnBuddyProfile,
} from "@/lib/services/buddies";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function BuddiesPage() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [availability, setAvailability] = useState("Flexible");
  const [bio, setBio] = useState("");
  const [style, setStyle] = useState<TravelStyle>("balanced");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [profiles, setProfiles] = useState<BuddyProfile[]>([]);
  const [requests, setRequests] = useState<BuddyRequest[]>([]);
  const [buddySearch, setBuddySearch] = useState("");
  const [sourceWarning, setSourceWarning] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    const loadData = async () => {
      const ownProfile = await fetchOwnBuddyProfile(user.id);
      const profileData = await fetchBuddyProfiles(user.id);
      const requestData = await fetchBuddyRequests();

      if (!active) return;

      if (ownProfile) {
        setName(ownProfile.name);
        setCity(ownProfile.city === "Unknown" ? "" : ownProfile.city);
        setSelectedInterests(ownProfile.interests);
        setStyle(ownProfile.style);
        setAvailability(ownProfile.availability);
        setBio(ownProfile.bio);
      } else {
        setName(user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "");
      }

      setProfiles(profileData.profiles);
      setSourceWarning(profileData.warning);
      setRequests(requestData);
      setLoading(false);
    };

    const timer = setTimeout(() => {
      setLoading(true);
      void loadData();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user]);

  const matches = useMemo(() => {
    const ranked = profiles.map((profile) => ({
      ...profile,
      score: calculateBuddyMatchScore(profile, {
        city,
        interests: selectedInterests,
        style,
      }),
    }));

    const sorted = ranked.sort((a, b) => b.score - a.score);
    const query = buddySearch.trim().toLowerCase();
    const filtered = query
      ? sorted.filter((match) => match.name.toLowerCase().includes(query))
      : sorted;

    return filtered.slice(0, 12);
  }, [buddySearch, city, profiles, selectedInterests, style]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest]
    );
  };

  const saveProfile = async () => {
    if (!user) {
      setMessage("Login required.");
      return;
    }

    const result = await upsertOwnBuddyProfile(user.id, {
      name: name.trim() || "Explorer",
      city: city.trim(),
      interests: selectedInterests,
      style,
      availability,
      bio,
    });

    setMessage(result.message);

    const reloaded = await fetchBuddyProfiles(user.id);
    setProfiles(reloaded.profiles);
    setSourceWarning(reloaded.warning);
  };

  const postRequest = async () => {
    if (!user) {
      setMessage("Login required.");
      return;
    }

    const result = await createBuddyRequest(user.id, {
      city: city.trim(),
      style,
      interests: selectedInterests,
      note: note.trim(),
    });

    setMessage(result.message);

    if (result.ok) {
      setNote("");
      setRequests(await fetchBuddyRequests());
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-slate-700">
        Please log in to use Buddy Finder.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Community</p>
        <h1 className="text-2xl font-bold text-slate-900">Travel Buddy Finder</h1>
        <p className="text-sm text-slate-600">
          Find people with matching exploration style, interests and availability.
        </p>

        {sourceWarning && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {sourceWarning}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-900">Your buddy profile</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Display name"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            placeholder="Availability"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={2}
            placeholder="Short bio"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">Travel style</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "slow", label: "Slow explorer" },
              { id: "balanced", label: "Balanced" },
              { id: "active", label: "Active" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setStyle(option.id as TravelStyle)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  style === option.id
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">Interests</p>
          <div className="flex flex-wrap gap-2">
            {BUDDY_INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  selectedInterests.includes(interest)
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="What kind of buddy are you looking for right now?"
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveProfile}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800"
          >
            Save profile
          </button>

          <button
            onClick={postRequest}
            className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold"
          >
            Post buddy request
          </button>
        </div>

        {message && <p className="text-sm text-slate-600">{message}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Top matches</h2>
          <input
            value={buddySearch}
            onChange={(event) => setBuddySearch(event.target.value)}
            placeholder="Search by name"
            className="w-full sm:w-60 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {loading && <p className="text-sm text-slate-600">Loading matches...</p>}
        {!loading && matches.length === 0 && (
          <p className="text-sm text-slate-600">No matches available yet.</p>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <article key={match.userId} className="rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">
                  <Link href={`/profile/${match.userId}`} className="hover:text-emerald-700">
                    {match.name}
                  </Link>
                </p>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                  {match.score}% match
                </span>
              </div>
              <p className="text-xs text-slate-600">{match.city} - {match.availability}</p>
              <p className="text-sm text-slate-700">{match.bio}</p>
              <p className="text-xs text-slate-600">
                {(match.interests.length ? match.interests : ["No interests added"]).join(" - ")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/profile/${match.userId}`}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-center text-sm"
                >
                  View profile
                </Link>
                <button className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                  Invite to plan
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-slate-900">Recent buddy requests</h2>

        {requests.length === 0 && (
          <p className="text-sm text-slate-600">No requests yet.</p>
        )}

        {requests.map((request) => (
          <article key={request.id} className="rounded-xl border border-slate-200 p-3">
            <p className="font-semibold text-slate-900">{request.city || "Unknown city"}</p>
            <p className="text-xs text-slate-600 mt-1">Style: {request.style}</p>
            <p className="text-xs text-slate-600 mt-1">
              {(request.interests.length ? request.interests : ["No interests selected"]).join(" - ")}
            </p>
            {request.note && <p className="text-sm text-slate-700 mt-2">{request.note}</p>}
            <p className="text-xs text-slate-500 mt-2">{formatDate(request.createdAt)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}