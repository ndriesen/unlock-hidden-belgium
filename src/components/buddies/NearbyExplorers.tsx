"use client";

import { ExplorerCard } from './ExplorerCard';
import { BuddyProfile } from '@/lib/services/buddies';

interface NearbyExplorersProps {
  profiles: BuddyProfile[];
  cityFilter: string;
  onChatOpen?: (userId: string) => void;
  onPlanTrip?: (userId: string) => void;
}

export function NearbyExplorers({ profiles, cityFilter, onChatOpen, onPlanTrip }: NearbyExplorersProps) {
  const nearbyProfiles = profiles.filter(profile => 
    profile.city.toLowerCase().includes(cityFilter.toLowerCase()) || cityFilter === ''
  );

  if (nearbyProfiles.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">📍</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No nearby explorers</h3>
        <p className="text-slate-600">Try a different city or broaden your search</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Nearby Explorers</h2>
        <p className="text-slate-600">
          {nearbyProfiles.length} explorers around {cityFilter || 'you'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {nearbyProfiles.slice(0, 16).map((profile) => (
<ExplorerCard
              key={profile.userId}
              profile={profile}
              activityStatus={Math.random() > 0.6 ? 'active-today' : 'active-week'}
              onChatOpen={onChatOpen}
              onPlanTrip={onPlanTrip}
            />
        ))}
      </div>

      {nearbyProfiles.length > 16 && (
        <div className="text-center">
          <button className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm">
            Load more explorers
          </button>
        </div>
      )}
    </section>
  );
}

