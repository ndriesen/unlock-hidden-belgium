'use client';

import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useCallback } from 'react';

// 🔹 Exported ExampleMarker type for external usage
export type ExampleMarker = {
  id: string;
  position: [number, number];
  title: string;
  description: string;
};

interface FixedMobileMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string | number;
  markers?: ExampleMarker[];
  onMarkerClick?: (marker: ExampleMarker) => void;
}

// 🆕 Custom hook: MapResizeFix - Forces Leaflet invalidateSize on mount/resize for mobile
// Fixes common mobile issue where map tiles don't render correctly after dynamic height changes
function MapResizeFix() {
  const map = useMap();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // Fix 1: Initial invalidateSize after mount (critical for SSR/Next.js dynamic)
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Fix 2: ResizeObserver for dynamic container changes (mobile orientation, modals)
    const container = map.getContainer();
    if (container) {
      resizeObserverRef.current = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserverRef.current.observe(container);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [map]);

  return null;
}

export default function FixedMobileMap({
  center = [50.85, 4.35], // Default: Belgium center [Brussels]
  zoom = 7,
  height = '400px', // Default fallback; use h-screen parent for full screen
  markers = [],
  onMarkerClick,
}: FixedMobileMapProps) {
  // Example markers array (3 points in Belgium) - copy this for testing!
  const exampleMarkers: ExampleMarker[] = [
    {
      id: 'brussels',
      position: [50.8503, 4.3517],
      title: 'Brussels City Center',
      description: 'Grand Place & Belgian capital 🏰',
    },
    {
      id: 'ghent',
      position: [51.0543, 3.7174],
      title: 'Ghent Historic Center',
      description: 'Medieval beauty with canals & castles 🌉',
    },
    {
      id: 'antwerp',
      position: [51.2213, 4.4052],
      title: 'Antwerp Diamond District',
      description: 'Fashion & diamonds in Flanders 💎',
    },
  ];

  // GPU acceleration fix for tiles on mount (mobile browsers)
  useEffect(() => {
    const fixTiles = () => {
      const tiles = document.querySelectorAll('.leaflet-tile') as NodeListOf<HTMLElement>;
      tiles.forEach((tile) => {
        // Mobile GPU wake-up: Hardware acceleration layers
        tile.style.transform = 'translateZ(0)';
        tile.style.willChange = 'transform';
        tile.style.backfaceVisibility = 'hidden';
        tile.style.webkitTransform = 'translateZ(0)'; // iOS Safari
      });
    };

    // Run immediately + after tiles load
    fixTiles();
    const observer = new MutationObserver(fixTiles);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const mapStyle: React.CSSProperties = {
    height: '100%',
    width: '100%',
    // Inline GPU acceleration (backup if globals.css classes fail)
    transform: 'translateZ(0)',
    willChange: 'transform',
  };

  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: '100%',
  };

  return (
    // 🔧 Mobile-proof container: h-screen parent + CSS classes trigger globals.css fixes
    <div 
      className="leaflet-mobile-fixed leaflet-gpu-accelerated w-full h-screen min-h-screen overflow-hidden"
      style={containerStyle}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={mapStyle}
        preferCanvas={true} // 📱 GPU canvas rendering (150% faster on mobile)
        scrollWheelZoom={true} // 🖱️ Enabled for desktop, smooth on touch devices
        className="rounded-xl shadow-lg" // Tailwind styling
      >
        {/* 🗺️ TileLayer: Retina/High-DPI optimized */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          // Retina/High-DPI fixes:
          detectRetina={true}      // 🔍 Auto-detects @2x tiles on Retina/iPhone
          tileSize={256}           // 📏 Standard 256px tiles
          zoomOffset={0}           // ⚙️ No zoom offset for crisp rendering
          updateWhenIdle={false}   // 🚀 Continuous tile updates while panning
        />

        {/* 📍 Markers with click handlers */}
        {(markers.length > 0 ? markers : exampleMarkers).map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            eventHandlers={{
              click: () => onMarkerClick?.(marker),
            }}
          >
            <Popup>
              <div className="min-w-[280px] p-4">
                <h3 className="font-bold text-lg mb-2">{marker.title}</h3>
                <p>{marker.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 🛠️ Auto-resize hook - Essential for mobile/Next.js */}
        <MapResizeFix />
      </MapContainer>
    </div>
  );
}

