"use client";

import { useMap } from 'react-leaflet';
import { useCallback, useEffect } from 'react';
import L from 'leaflet';

interface GeolocationControlProps {
  autoLocate?: boolean;
}

export function GeolocationControl({ autoLocate = true }: GeolocationControlProps) {
  const map = useMap();

  const locate = useCallback(() => {
    console.log('🧭 Starting geolocation...');
    map.locate({ 
      setView: true, 
      maxZoom: 16,
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000
    });
  }, [map]);

  useEffect(() => {
    if (autoLocate) {
      const timer = setTimeout(locate, 800);
      return () => clearTimeout(timer);
    }
  }, [locate, autoLocate]);

  useEffect(() => {
    const handleLocationFound = (e: L.LocationEvent) => {
      console.log('📍 Location found:', e.latlng, 'accuracy:', e.accuracy);
      
      L.marker(e.latlng)
        .addTo(map)
        .bindPopup(`You are here<br>Accuracy: ${Math.round(e.accuracy)}m`)
        .openPopup();

      L.circle(e.latlng, e.accuracy, {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.2,
        weight: 2
      }).addTo(map);
    };

    const handleLocationError = (e: L.ErrorEvent) => {
      console.error('❌ Geolocation error:', e.message);
    };

    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    return () => {
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
    };
  }, [map]);

  return (
    <div className="leaflet-control-container">
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control-locate leaflet-bar leaflet-control">
          <a 
            className="leaflet-control-locate-toggle" 
            href="#" 
            title="Locate me" 
            role="button" 
            aria-label="Locate me"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              locate();
            }}
          >
            <span className="leaflet-control-locate-location"></span>
          </a>
        </div>
      </div>
    </div>
  );
}

