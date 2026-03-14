"use client";

import { useState } from 'react';

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  awarded_at: string;
}

interface BadgesGridProps {
  badges: Badge[];
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  if (badges.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          🏆
        </div>
        <h3 className="text-lg font-semibold mb-2">No badges yet</h3>
        <p className="text-sm">Explore more to unlock your first achievement!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Achievements ({badges.length})</h3>
      <div className="flex flex-wrap gap-3">
        {badges.slice(0, 20).map((badge) => (
          <div
            key={badge.id}
            className="group relative p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default max-w-xs"
            onMouseEnter={() => setShowTooltip(badge.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            {/* Badge Icon */}
            <div className="text-3xl mb-3">{badge.icon}</div>
            
            {/* Badge Name */}
            <h4 className="font-bold text-sm text-slate-900 mb-1">{badge.name}</h4>
            
            {/* Award Date */}
            <p className="text-xs text-slate-500 mb-2">
              {new Date(badge.awarded_at).toLocaleDateString('nl-BE')}
            </p>

            {/* Tooltip */}
            {showTooltip === badge.id && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-2xl whitespace-pre-wrap max-w-sm pointer-events-none">
                {badge.description}
              </div>
            )}
          </div>
        ))}
      </div>
      {badges.length > 20 && (
        <div className="text-center pt-4">
          <button className="text-sm text-emerald-600 hover:underline font-medium">
            Show all {badges.length} badges
          </button>
        </div>
      )}
    </div>
  );
}

