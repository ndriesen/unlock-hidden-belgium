"use client";

import { useState } from 'react';
import { ExplorerCard } from './ExplorerCard';
import { BuddyProfile, calculateBuddyMatchScore } from '@/lib/services/buddies';

interface TopMatchesProps {
  profiles: BuddyProfile[];
  onSearchChange: (query: string) => void;
  onChatOpen?: (userId: string) => void;
  onPlanTrip?: (userId: string) => void;
}

export function TopMatches({ profiles, onSearchChange, onChatOpen, onPlanTrip }: TopMatchesProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const matches = profiles.slice(0, 12)
    .map(profile => ({
      ...profile,
      score: calculateBuddyMatchScore(profile, {
        city: '',
        interests: [],
        style: 'balanced'
      })
    }))
    .sort((a, b) => b.score - a.score);

  const filteredMatches = searchQuery
    ? matches.filter(match => match.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : matches;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Top Matches</h2>
          <p className="text-slate-600">Perfect explorers for your next adventure</p>
        </div>
        <input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearchChange(e.target.value);
          }}
          placeholder="Search explorers by name..."
          className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
        />
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No matches yet</h3>
          <p className="text-slate-600 mb-4">Update your preferences to see top explorers</p>
          <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
            Edit preferences
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMatches.map((match) => (
<ExplorerCard
              key={match.userId}
              profile={match}
              matchPercentage={match.score}
              showMatchExplanation={true}
              activityStatus="active-today"
              onChatOpen={onChatOpen}
              onPlanTrip={onPlanTrip}
            />
          ))}
        </div>
      )}
    </section>
  );
}

