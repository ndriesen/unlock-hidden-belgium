 "use client";

import Link from 'next/link';
import Image from 'next/image';
import { BuddyProfile } from '@/lib/services/buddies';

interface ExplorerCardProps {
  profile: BuddyProfile;
  matchPercentage?: number;
  showMatchExplanation?: boolean;
  activityStatus?: 'active-today' | 'active-week' | 'inactive';
  distanceKm?: number;
  onChatOpen?: (userId: string) => void;
  onPlanTrip?: (userId: string) => void;
}

export function ExplorerCard({ 
  profile, 
  matchPercentage,
  showMatchExplanation = false,
  activityStatus = 'inactive',
  distanceKm = undefined,
  onChatOpen,
  onPlanTrip
}: ExplorerCardProps) {
  const level = Math.floor(profile.xpPoints / 1000); // Rough level calculation

  const getActivityBadge = () => {
    switch (activityStatus) {
      case 'active-today': return <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>;
      case 'active-week': return <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full"></span>;
      default: return <span className="inline-block w-2 h-2 bg-slate-400 rounded-full"></span>;
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
            {profile.avatarUrl ? (
              <Image 
                src={profile.avatarUrl} 
                alt={profile.name}
                fill 
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/50">
                <span className="text-xs font-bold text-slate-600">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-sm truncate mb-0.5">
              {profile.name}
            </h3>
            <div className="flex items-center gap-1">
              <p className="text-xs text-slate-600 truncate">{profile.city}</p>
              {distanceKm && (
                <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded-full font-semibold">
                  {distanceKm}km
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-600 font-semibold">
              Lv. {level}
            </p>
          </div>
          {getActivityBadge()}
        </div>
      </div>

      {/* Match Badge */}
      {matchPercentage && (
        <div className="mb-4 p-2 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg font-bold text-emerald-700">{matchPercentage}%</span>
            <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Match</span>
          </div>
          {showMatchExplanation && (
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-800">Why we match:</p>
              <ul className="text-slate-600 list-disc list-inside space-y-0.5">
                {profile.interests.slice(0,2).map((interest) => (
                  <li key={interest} className="truncate">{interest}</li>
                ))}
              </ul>
              <p className="text-slate-500 text-[10px] mt-1">{profile.city === 'Antwerp' ? 'Nearby: Antwerp' : 'Nearby explorer'}</p>
            </div>
          )}
        </div>
      )}

      {/* Bio & Interests */}
      <p className="text-sm text-slate-700 mb-3 flex-1 line-clamp-2 leading-relaxed">
        {profile.bio || 'Active explorer looking for adventure companions!'}
      </p>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {profile.interests.slice(0,2).map((interest) => (
          <span key={interest} className="px-1.5 py-0.5 bg-slate-100 text-xs rounded-full text-slate-700">
            {interest}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-200">
        <Link
          href={`/profile/${profile.userId}`}
          className="text-xs text-center px-1.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
        >
          Profile
        </Link>
        <button 
          onClick={() => onPlanTrip?.(profile.userId)}
          className="text-xs text-center px-1.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors font-medium text-emerald-700 border border-emerald-200">
          Plan trip
        </button>
        <button 
          onClick={() => onChatOpen?.(profile.userId)}
          className="text-xs text-center px-1.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium text-blue-700 border border-blue-200">
          Chat
        </button>
      </div>
    </div>
  );
}

