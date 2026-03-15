"use client";

import { useState, useCallback, useEffect } from 'react';
import { TravelStyle } from '@/lib/services/buddies';
import { BUDDY_INTEREST_OPTIONS } from '@/lib/services/buddies';

interface BuddyFiltersProps {
  onFiltersChange: (filters: {
    city: string;
    style: TravelStyle;
    interests: string[];
    availability: string;
  }) => void;
  initialFilters?: {
    city: string;
    style: TravelStyle;
    interests: string[];
    availability: string;
  };
}

export function BuddyFilters({ 
  onFiltersChange, 
  initialFilters = { city: '', style: 'balanced', interests: [], availability: 'Flexible' }
}: BuddyFiltersProps) {
  const [city, setCity] = useState(initialFilters.city);
  const [style, setStyle] = useState<TravelStyle>(initialFilters.style);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialFilters.interests);
  const [availability, setAvailability] = useState(initialFilters.availability);

  const debouncedChange = useCallback(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({ city, style, interests: selectedInterests, availability });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [city, style, selectedInterests, availability, onFiltersChange]);

  const toggleInterest = useCallback((interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  }, []);

  // Update parent on changes
  useEffect(() => {
    debouncedChange();
  }, [city, style, selectedInterests, availability, debouncedChange]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <h3 className="font-bold text-lg text-slate-900 mb-1">Find your perfect match</h3>
      <p className="text-sm text-slate-600 mb-6">Filter explorers by location, style and interests</p>
      
      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">City</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Antwerp, Ghent..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Travel Style */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-3">Travel Style</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'slow' as TravelStyle, label: 'Slow Explorer' },
            { id: 'balanced' as TravelStyle, label: 'Balanced' },
            { id: 'active' as TravelStyle, label: 'Active' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setStyle(id)}
              className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                style === id 
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-md' 
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-3">Interests</label>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl">
          {BUDDY_INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                selectedInterests.includes(interest)
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
        {selectedInterests.length > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            {selectedInterests.length} interests selected
          </p>
        )}
      </div>

      {/* Availability */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">Availability</label>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        >
          <option value="Flexible">Flexible</option>
          <option value="Weekends">Weekends</option>
          <option value="Weekdays">Weekdays</option>
          <option value="This month">This month</option>
          <option value="Next month">Next month</option>
        </select>
      </div>
    </div>
  );
}

