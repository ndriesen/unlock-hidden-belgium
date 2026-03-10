"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import TripsOverview from "@/components/trips/TripsOverview";

const TripBuilder = dynamic(() => import("@/components/trips/TripBuilder"), {
  ssr: false,
});

export default function TripsPage() {
  const { user, loading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-200" />
          <div className="w-32 h-4 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F7F7" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Trips</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A7FFF] text-white font-semibold rounded-full hover:bg-[#1a6ee8] transition-all hover:scale-105"
          >
            {showCreateForm ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Trip</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {showCreateForm ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <TripBuilder onComplete={() => setShowCreateForm(false)} />
          </div>
        ) : (
          <TripsOverview onCreateTrip={() => setShowCreateForm(true)} />
        )}
      </main>
    </div>
  );
}

