"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map, NavigationControl, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { useTripData } from '@/hooks/useTripData';
import type { TripStop } from '@/types/trip';

interface Props {
  onStopSelect?: (stop: TripStop | null) => void;
  className?: string;
}

export default function PremiumTripMap({ onStopSelect, className = '' }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [selectedStop, setSelectedStop] = useState<TripStop | null>(null);
  const { currentTrip, loading } = useTripData();

  // Generate GeoJSON from trip stops
const stopsGeoJson = useCallback((): ReturnType<typeof turf.featureCollection> => {
    if (!currentTrip?.stops.length) return turf.featureCollection([]);

const features: any[] = currentTrip.stops.map(stop => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point',
        coordinates: [stop.lng, stop.lat]
      } as any,
      properties: {
        id: stop.id,
        name: stop.name,
        state: stop.visitedAt ? 'visited' : 'upcoming',
        preview: stop.photoUrl,
        description: stop.note?.slice(0, 100) || '',
        lng: stop.lng,
        lat: stop.lat
      }
    }));

    return turf.featureCollection(features);
  }, [currentTrip]);

  // Route line GeoJSON
  const routeGeoJson = useCallback(() => {
    if (!currentTrip?.stops.length) return null;
    const line = turf.lineString(currentTrip.stops.map(s => [s.lng, s.lat]));
    return line; // Smooth curve (beautify not needed)
  }, [currentTrip]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Reliable dark-compatible MapLibre demo
      center: [4.5, 50.8], // Belgium center
      zoom: 7,
      pitch: 30,
      bearing: 0,
      // antialias: true // MapLibre TS option not available
    });

    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      // Route layer
      const route = routeGeoJson();
      if (route) {
        map.addSource('route', {
          type: 'geojson',
          data: route
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-width': [
              'case',
              ['boolean', ['get', 'under-construction'], false],
              3,
              6
            ],
            'line-color': '#6366f1', // Indigo glow
            'line-opacity': 0.8,
            'line-dasharray': [2, 2]
          }
        });
      }

      // Stops source
      map.addSource('stops', {
        type: 'geojson',
        data: stopsGeoJson(),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Clusters
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'stops',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbda',
            10, '#459fcd',
            100, '#317dc5'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10, 30,
            100, 45
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'stops',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // Unclustered pins
      map.addLayer({
        id: 'stops-unclustered-point',
        type: 'circle',
        source: 'stops',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 18,
          'circle-color': [
            'case',
            ['==', ['get', 'state'], 'visited'], '#10b981',
            ['==', ['get', 'state'], 'current'], '#f59e0b', 
            '#3b82f6'
          ],
          'circle-translate': [0, -20],
          'circle-blur': 0.1,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9
        }
      });
      map.addLayer({
        id: 'stops-unclustered-label',
        type: 'symbol',
        source: 'stops',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': '{name}',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 2],
          'text-anchor': 'top'
        }
      });

      // Hover effect
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'stops-unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'stops-unclustered-point', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    // Click handlers
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      if (!features[0]) return;
      
      const clusterId = features[0].properties!.cluster_id;
      const coordinates = e.lngLat.wrap() as maplibregl.LngLatLike;
      
      (map.getSource('stops') as any).getClusterExpansionZoom(
        clusterId,
        (err?: any, zoom?: number) => {
          if (err) return;
          
          map.easeTo({
            center: coordinates,
            zoom: zoom || 14
          });
        }
      );
    });

    map.on('click', 'stops-unclustered-point', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['stops-unclustered-point'] });
      if (features?.length) {
        const feature = features[0];
        const stop = currentTrip?.stops.find(s => s.id === (feature.properties as any).id);
        setSelectedStop(stop || null);
        onStopSelect?.(stop || null);
        // Smooth zoom
        map.flyTo({
          center: e.lngLat.toArray() as [number, number],
          zoom: 14,
          pitch: 45,
          duration: 1000
        });
      }
    });

    // Fit bounds
    if (currentTrip?.stops.length > 0) {
      const points = currentTrip.stops.map(s => [s.lat, s.lng] as [number, number]).filter(([lat, lng]) => lat && lng);
      if (points.length > 0) {
        const [minLng, minLat, maxLng, maxLat] = points.reduce(([minLng, minLat, maxLng, maxLat], [lat, lng]) => [
          Math.min(minLat, lat),
          Math.min(minLng, lng),
          Math.max(maxLat, lat),
          Math.max(maxLng, lng)
        ], [Infinity, Infinity, -Infinity, -Infinity]);
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
          padding: 50,
          duration: 2000
        });
      }
    }

    return () => {
      map.remove();
    };
  }, [stopsGeoJson, routeGeoJson, currentTrip, onStopSelect]);

  // Update sources on data change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading) return;

    (map.getSource('stops') as any)?.setData(stopsGeoJson());
    const route = routeGeoJson();
    if (route) (map.getSource('route') as any)?.setData(route);
  }, [stopsGeoJson, routeGeoJson]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white animate-pulse">Loading journey map...</div>
      </div>
    );
  }

  return (
    <div className={`w-full h-screen relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {selectedStop && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl max-w-sm">
            <h3 className="font-bold text-lg">{selectedStop.name}</h3>
            <p className="text-sm opacity-80">{selectedStop.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
