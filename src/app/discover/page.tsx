"use client";

import { useState } from 'react';
import PremiumHiddenGemsMap from '@/components/maps/PremiumHiddenGemsMap';
import HotspotBottomSheet from '@/components/ui/HotspotBottomSheet';
import { useHiddenGems } from '@/hooks/useHiddenGems';
import { useAuth } from '@/context/AuthContext';
import type { ExploreHotspot } from '@/lib/services/explore';
import { Funnel, Plus, MapPin, Search } from 'lucide-react';
import { AnimatedGlassButton } from '@/components/ui/glass-button-hover';

export default function DiscoverPage() {
  const { user } = useAuth();
  const { hiddenGems, loading } = useHiddenGems(user?.id);
  const [selectedGem, setSelectedGem] = useState<ExploreHotspot | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGems = hiddenGems.filter(gem => 
    gem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gem.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gem.province.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentIndex = filteredGems.findIndex(g => g.id === selectedGem?.id);
  const totalGems = filteredGems.length;

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-navy/10">
      {/* Floating Controls */}
      <div className="fixed top-6 left-6 right-6 z-40 flex gap-3">
        <AnimatedGlassButton
          icon={<Search className="w-5 h-5" />}
          label="Search"
          onClick={() => {/* Search modal */}}
          size="sm"
        />
        <AnimatedGlassButton
          icon={<Funnel className="w-5 h-5" />}
          label="Filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
          size="sm"
        />
      </div>

      {/* Map */}
      <div className="h-screen w-full">
        <PremiumHiddenGemsMap 
          onGemSelect={setSelectedGem}
          initialView={{ center: [4.5, 50.8], zoom: 8 }}
        />
      </div>

      {/* FAB Add Hotspot */}
      <AnimatedGlassButton
        className="fixed bottom-8 right-8 z-40 shadow-2xl"
        icon={<Plus className="w-6 h-6" />}
        label="Add Gem"
        contentClassName="bg-teal-600/90 text-white font-bold"
        size="lg"
        onClick={() => {/* Add modal */}}
      />

      {/* Bottom Sheet */}
      <HotspotBottomSheet
        gem={selectedGem}
        onClose={() => setSelectedGem(null)}
        index={currentIndex}
        total={totalGems}
        onPrev={() => {
          if (currentIndex > 0) setSelectedGem(filteredGems[currentIndex - 1]);
        }}
        onNext={() => {
          if (currentIndex < totalGems - 1) setSelectedGem(filteredGems[currentIndex + 1]);
        }}
        className="max-h-[85vh]"
      />
    </main>
  );
}

