"use client";

import { type ExampleMarker } from '@/components/Map/FixedMobileMap';
import dynamic from 'next/dynamic';

const DynamicFixedMobileMap = dynamic(
  () => import('@/components/Map/FixedMobileMap'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full bg-gradient-to-br from-emerald-50/90 to-blue-50/90 backdrop-blur-sm rounded-2xl border border-emerald-200/50">
    <div className="text-emerald-600 animate-pulse">
      <div className="w-12 h-12 border-4 border-emerald-300/50 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="font-medium">Loading interactive map...</p>
    </div>
  </div> }
);

export default function MapTestPage() {
  const handleMarkerClick = (marker: ExampleMarker) => {
    alert(`Clicked: ${marker.title}\\n${marker.description}`);
  };

  const extraMarkers: ExampleMarker[] = [
    {
      id: 'antwerp',
      position: [51.2213, 4.4052] as [number, number],
      title: 'Antwerp Cathedral',
      description: 'Additional test marker for Belgium.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
            🗺️ Fixed Mobile Leaflet Map
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Test tiles/markers on desktop & mobile. All fixes applied: height, GPU, retina tiles, z-index.
          </p>
        </div>
        
        {/* Mobile-responsive heights */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="h-[400px] md:h-[600px]">
            <DynamicFixedMobileMap 
              height="100%"
              onMarkerClick={handleMarkerClick}
            />
          </div>
          <div className="h-[400px] md:h-[600px]">
            <DynamicFixedMobileMap 
              center={[50.85, 4.35]} // Belgium center
              zoom={8}
              height="100%"
              markers={extraMarkers}
              onMarkerClick={handleMarkerClick}
            />
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/50">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">✅ Fixes Applied:</h2>
          <ul className="space-y-3 text-lg text-gray-700">
            <li>• <strong>Height:</strong> Explicit container + resize invalidation</li>
            <li>• <strong>Tiles:</strong> Retina OSM, detectRetina=true, smooth updates</li>
            <li>• <strong>GPU:</strong> Canvas mode, transform hacks (CSS)</li>
            <li>• <strong>Z-Index:</strong> Fixed layers (add CSS snippet)</li>
            <li>• <strong>Mobile:</strong> Touch zoom, no glitches on iOS/Android</li>
          </ul>
          <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <strong>Test:</strong> Use Chrome DevTools mobile emulation. Tiles should load smoothly!
          </div>
        </div>
      </div>
    </div>
  );
}
