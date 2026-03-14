"use client";

import { useState } from 'react';

interface ProfileTab {
  id: string;
  label: string;
}

const tabs: ProfileTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'trips', label: 'Trips' },
  { id: 'hotspots', label: 'Hotspots' },
  { id: 'photos', label: 'Photos' },
  { id: 'badges', label: 'Badges' },
  { id: 'buddies', label: 'Buddies' },
  { id: 'activity', label: 'Activity' },
];

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  stats?: never;

}

export function ProfileTabs({ activeTab, onTabChange, stats }: ProfileTabsProps) {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap gap-2 py-4 -mb-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 border 
                  ${isActive 
                    ? 'bg-white/60 backdrop-blur-xl border-white/30 shadow-xl shadow-white/10 text-slate-900 hover:shadow-2xl hover:shadow-white/20' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

