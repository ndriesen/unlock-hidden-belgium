"use client";

import { useState, useCallback } from 'react';
import { useUI } from '@/context/UIContext';
import { useSearch } from '@/context/SearchContext';
import { Search, Filter, MapPin } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

export default function UnifiedSearchFilters() {
  const { actions } = useUI();
  const { searchQuery, setSearchQuery } = useSearch();
  const { state } = useUI();
  
  const { category, province } = state.searchFilters;
  const [localCategory, setLocalCategory] = useState(category);
  const [localProvince, setLocalProvince] = useState(province);

  const categories: FilterOption[] = [
    { value: '', label: 'All Categories' },
    { value: 'nature', label: 'Nature' },
    { value: 'food', label: 'Food & Drink' },
    { value: 'culture', label: 'Culture' },
    { value: 'urban', label: 'Urban Gems' },
  ];

  const provinces: FilterOption[] = [
    { value: '', label: 'All Provinces' },
    { value: 'West-Vlaanderen', label: 'West-Vlaanderen' },
    { value: 'Oost-Vlaanderen', label: 'Oost-Vlaanderen' },
    { value: 'Antwerpen', label: 'Antwerpen' },
    // Add more as loaded from DB
  ];

  const applyFilters = useCallback(() => {
    actions.setFilters({ category: localCategory, province: localProvince });
  }, [actions, localCategory, localProvince]);

  const clearFilters = useCallback(() => {
    setLocalCategory('');
    setLocalProvince('');
    actions.setFilters({ category: '', province: '' });
  }, [actions]);

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search hidden gems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={localCategory}
              onChange={(e) => setLocalCategory(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={localProvince}
              onChange={(e) => setLocalProvince(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {provinces.map(prov => (
                <option key={prov.value} value={prov.value}>{prov.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={applyFilters}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md"
          >
            Apply
          </button>

          <button
            onClick={clearFilters}
            className="px-6 py-2 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 transition-all border border-slate-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

