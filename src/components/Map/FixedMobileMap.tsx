// src/components/Map/FixedMobileMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// 🔹 Type voor markers
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

export default function FixedMobileMap({
  center = [50.85, 4.35], // default: Belgium
  zoom = 7,
  height = '100%',
  markers = [],
  onMarkerClick,
}: FixedMobileMapProps) {
  useEffect(() => {
    // Fix voor Leaflet tiles op mobiele browsers
    const tiles = document.querySelectorAll('.leaflet-tile');
    tiles.forEach(tile => {
      (tile as HTMLElement).style.transform = 'translateZ(0)';
      (tile as HTMLElement).style.willChange = 'transform';
      (tile as HTMLElement).style.backfaceVisibility = 'hidden';
    });
  }, []);

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        preferCanvas={true} // beter voor mobiele performance
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          detectRetina={true}
          tileSize={256}
          zoomOffset={0}
        />

        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(marker),
            }}
          >
            <Popup>
              <strong>{marker.title}</strong>
              <br />
              {marker.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}