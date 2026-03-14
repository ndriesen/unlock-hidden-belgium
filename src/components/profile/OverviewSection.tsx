"use client";

import Image from 'next/image';
import { PublicProfileData } from '@/lib/services/publicProfiles';

interface OverviewSectionProps {
  data: PublicProfileData;
}

export function OverviewSection({ data }: OverviewSectionProps) {
  const profile = data.profile;
  const stats = data.stats;

  if (!profile) {
    return <div className="text-center py-12 text-slate-500">Profile not found</div>;
  }

  const level = stats.level;
  const xpForNext = 500; // From gamification service
  const xpProgress = (profile.xpPoints / xpForNext) * 100;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white overflow-hidden mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10" />
        <div className="relative max-w-md mx-auto text-center">
          <div className="relative w-28 h-28 mx-auto mb-6 shadow-2xl shadow-black/20 rounded-full overflow-hidden ring-4 ring-white/30">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
          <p className="text-lg opacity-90 mb-1">{profile.city || 'Explorer'}</p>
          <p className="text-emerald-100 font-semibold mb-6">{profile.style}</p>
          
          {/* XP Progress */}
          <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Level {level}</span>
              <span>{Math.floor(profile.xpPoints)} XP</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 shadow-inner" 
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Level', value: stats.level, icon: '⭐' },
          { label: 'Hotspots', value: stats.visitedCount, icon: '📍' },
          { label: 'Provinces', value: stats.provincesCount + '/10', icon: '🗺️' },
          { label: 'Badges', value: stats.badgesCount, icon: '🏆' },
          { label: 'Trips', value: stats.tripsCount, icon: '🛤️' },
          { label: 'Buddies', value: stats.buddiesCount, icon: '👥' },
        ].map((stat) => (
          <div key={stat.label} className="group p-4 bg-white rounded-2xl shadow-sm text-center hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="font-bold text-lg">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* About & Interests */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3 p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>👋</span>
            About
          </h3>
          <p className="text-slate-700 leading-relaxed">
            {profile.bio || "Passionate explorer discovering Belgium's hidden gems."}
          </p>
          <p className="text-sm text-emerald-600 font-semibold">
            Availability: {profile.availability}
          </p>
        </div>
        <div className="space-y-3 p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>❤️</span>
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.length > 0 ? (
              profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full"
                >
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic text-sm">No interests shared</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

