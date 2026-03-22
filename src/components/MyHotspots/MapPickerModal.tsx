"use client";

import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MapClickHandler from './MapClickHandler';
import { MapResizeFix } from './MapResizeFix';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import 'leaflet/dist/leaflet.css';

// Custom marker icon to avoid CSP violation
const customIcon = L.divIcon({
  className: 'custom-pin',
  html: '<div style="background: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

import type { LatLngTuple } from 'leaflet';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, address: string) => void;
}

export type MapPickerPosition = {
  lat: number;
  lng: number;
  address: string;
};

export default function MapPickerModal({ isOpen, onClose, onConfirm }: MapPickerModalProps) {
  const [position, setPosition] = useState<LatLngTuple>([50.8503, 4.3517]); // Brussels default
  const [previewAddress, setPreviewAddress] = useState('Click/tap on map to place pin, then confirm');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force remount on open

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      console.log('Geocoding', lat, lng);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&accept-language=en`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log('Geocode response:', data);
      const displayAddress = data.display_name || data.address?.name || data.address?.road || data.address?.city || data.address?.town || data.address?.hamlet || 'Unknown location';
      setPreviewAddress(displayAddress);
      return displayAddress;
    } catch (error) {
      console.error('Geocoding failed:', error);
      setPreviewAddress(`Location set: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
      return `Location set: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const newPos = [lat, lng] as LatLngTuple;
    setPosition(newPos);
    await reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleConfirm = useCallback(() => {
    onConfirm(position[0], position[1], previewAddress);
    onClose();
  }, [position, previewAddress, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">📍 Place Pin on Map</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-2xl transition-all"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="text-emerald-100 mt-1">Click anywhere to place the pin</p>
        </div>

        {/* Map: Full height */}
        <div className="flex-1 w-full relative rounded-b-3xl overflow-hidden min-h-[300px] md:min-h-[500px]">
          <MapContainer 
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            preferCanvas={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap'
              detectRetina={true}
            />
            <MapClickHandler onClick={handleMapClick} />
            <Marker position={position} icon={customIcon}>
              <Popup closeButton={false} className="p-0">
                <div className="flex items-center gap-2 p-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="font-medium text-sm text-slate-800">Selected spot</span>
                </div>
              </Popup>
            </Marker>
            <MapResizeFix />
          </MapContainer>
        </div>

        {/* Address Preview & Buttons */}
        <div className="p-6 pt-4 bg-gradient-to-t from-slate-50 to-transparent border-t border-slate-200">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-slate-900 mb-1">📍 Selected Location</p>
              <p className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                {isGeocoding ? '🔄 Locating...' : previewAddress}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Lat: {Number(position[0]).toFixed(4)} | Lng: {Number(position[1]).toFixed(4)}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isGeocoding}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-all shadow-lg disabled:opacity-50"
              >
                ✅ Confirm Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
