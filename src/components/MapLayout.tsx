"use client";

import { ReactNode } from 'react';
import { useMediaQuery } from 'react-responsive';
import dynamic from 'next/dynamic';
import { useUI } from '@/context/UIContext';
import HotspotPanel from './HotspotPanel';
import HotspotSheet from './HotspotSheet';
import SidebarLayout from './SidebarLayout';
import { MOCK_HOTSPOTS } from '../app/mocks';
// import UnifiedSearchFilters from './UnifiedSearchFilters'; // Phase 2
// import FloatingHotspotList from './FloatingHotspotList'; // Phase 2
import type { Hotspot } from '@/types/hotspot';

const MapContainer = dynamic(
  () => import('@/components/Map/MapContainer').then(mod => mod.default),
  { ssr: false }
);

interface MapLayoutProps {
  children: ReactNode;
}

export default function MapLayout({
  children,
}: MapLayoutProps) {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const ui = useUI();
  
  const { selectedHotspot, activeOverlay, searchFilters, mapView, isSidePanelOpen, isBottomSheetOpen } = ui.state;
  const { actions } = ui;

  // Demo hotspots for map - ensure all required props
  const demoHotspots: Hotspot[] = MOCK_HOTSPOTS.slice(0, 8);

  // Map props with demo data
  const mapProps = {
    hotspots: demoHotspots,
    visitedIds: [],
    wishlistIds: [],
    favoriteIds: [],
    viewMode: mapView.viewMode as 'markers' | 'heatmap',
    mapStyle: mapView.mapStyle as 'default' | 'satellite' | 'retro' | 'terrain',
    searchQuery: searchFilters.query,
    categoryFilter: searchFilters.category,
    provinceFilter: searchFilters.province,
    onSelect: actions.openHotspot,
    selectedHotspotId: selectedHotspot?.id || null,
    onVisit: (id: string) => {
      const hotspot = demoHotspots.find(h => h.id === id);
      if (hotspot) actions.openHotspot(hotspot);
    },
    onToast: (msg: string) => console.log('Toast:', msg),
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      
      {/* z-0: Base Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapContainer {...mapProps} />
      </div>

      {/* z-10: Floating UI Overlays (search, filters, floating lists) */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <SidebarLayout>
          {/* Page content renders as overlay above map */}
          <div className="h-[calc(100vh-4rem)] overflow-auto pb-20 md:pb-0">
            {children}
          </div>
        </SidebarLayout>
      </div>

      {/* z-20: Mobile Bottom Sheet */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-20 h-[70vh] md:hidden
        ${isBottomSheetOpen ? 'translate-y-0' : 'translate-y-full'}
        transition-transform duration-300 ease-out
      `}>
        <HotspotSheet 
          hotspot={selectedHotspot || null}
          onClose={actions.closeOverlay}
          onVisit={() => {}}
          onWishlist={() => {}}
          onFavorite={() => {}}
          onAddToTrip={() => {}}
          isVisited={false}
          isWishlist={false}
          isFavorite={false}
          isLiked={false}
          isSaved={false}
          canGoPrevious={false}
          canGoNext={false}
          onPrevious={() => {}}
          onNext={() => {}}
          positionLabel="Hotspot"
          showTripSelector={false}
          onShowTripSelector={() => {}}
          onTripUpdated={() => {}}
        />
      </div>

      {/* z-30: Desktop Side Panel */}
      {isSidePanelOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-96 z-30 bg-white/95 backdrop-blur-xl border-l-2 border-slate-200 shadow-2xl">
          <HotspotPanel 
            hotspot={selectedHotspot || null}
            onClose={actions.closeOverlay}
            onVisit={() => {}}
            onWishlist={() => {}}
            onFavorite={() => {}}
            onAddToTrip={() => {}}
            isVisited={false}
            isWishlist={false}
            isFavorite={false}
            isLiked={false}
            isSaved={false}
            canGoPrevious={false}
            canGoNext={false}
            onPrevious={() => {}}
            onNext={() => {}}
            positionLabel="Hotspot"
            onTripUpdated={() => {}}
          />
        </div>
      )}

      {/* Overlay backdrop */}
      {activeOverlay !== 'none' && (
        <div 
          className="fixed inset-0 z-15 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={actions.closeOverlay}
        />
      )}
    </div>
  );
}


