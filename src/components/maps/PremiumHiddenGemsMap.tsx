"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { useHiddenGemsDemo } from '@/hooks/useHiddenGemsDemo';
import { useAuth } from '@/context/AuthContext';
import type { ExploreHotspot } from '@/lib/services/explore';
import type { LngLatLike } from 'maplibre-gl';

interface Props {
  onGemSelect?: (gem: ExploreHotspot | null) => void;
  className?: string;
  initialView?: { center: [number, number]; zoom: number };
}

export default function PremiumHiddenGemsMap({ onGemSelect, className = '', initialView }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const { user } = useAuth();
  const { hiddenGems, loading } = useHiddenGemsDemo();
  const [selectedGem, setSelectedGem] = useState<ExploreHotspot | null>(null);
  const [hoveredGemId, setHoveredGemId] = useState<string | null>(null);

  // Hotspots GeoJSON
  const gemsGeoJson = useCallback((): any => {
    const features = hiddenGems.filter(gem => gem.longitude && gem.latitude).map(gem => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [gem.longitude!, gem.latitude!]
      },
      properties: {
        id: gem.id,
        name: gem.name,
        preview: gem.imageUrl,
        description: gem.description,
        category: gem.category,
        province: gem.province,
        visitCount: gem.visitCount,
        likesCount: gem.likesCount
      }
    }));
    return turf.featureCollection(features);
  }, [hiddenGems]);

  // Remove journey lines - use real data later
  const journeysGeoJson = useCallback(() => turf.featureCollection([]), []);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      center: initialView?.center || [4.5, 50.8],
      zoom: initialView?.zoom || 4,
      minZoom: 0,
      maxZoom: 22,
      pitch: 60,
      bearing: -15
    });

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      // Gems source (clustered)
      map.addSource('gems', {
        type: 'geojson',
        data: gemsGeoJson(),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 60
      });

      // Clusters (premium style)
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'gems',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            'hsla(200, 60%, 50%, 0.8)', // Teal light
            10, 'hsla(200, 60%, 40%, 0.9)', 
            50, 'hsla(200, 60%, 30%, 1)' // Navy dark
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            25,
            10, 35,
            50, 50
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.9
        }
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'gems',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14
        }
      });

      // Unclustered image pins
      map.addLayer({
        id: 'gems-unclustered-point',
        type: 'circle',
        source: 'gems',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 22,
          'circle-color': [
            'case',
            ['has', 'preview'], 'hsla(200, 60%, 50%, 0.1)',
            '#ef4444'
          ],
          'circle-stroke-width': 4,
          'circle-stroke-color': '#ffffff'
        }
      });


      // Remove fallback layer, merged into gems-unclustered-point

      // Labels
      map.addLayer({
        id: 'gems-labels',
        type: 'symbol',
        source: 'gems',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': '{name}',
          'text-font': ['Open Sans Semibold'],
          'text-size': 12,
          'text-offset': [0, 2],
          'text-anchor': 'top',
          'text-allow-overlap': false
        },
        paint: {
          'text-color': 'white',
          'text-halo-color': 'hsla(0,0%,0%,0.7)',
          'text-halo-width': 1
        }
      });

      // Journeys (subtle lines)
      map.addSource('journeys', {
        type: 'geojson',
        data: journeysGeoJson()
      });
      map.addLayer({
        id: 'journey-lines',
        type: 'line',
        source: 'journeys',
        paint: {
          'line-width': 4,
          'line-color': [
            'case',
            ['==', ['get', 'id'], 'premium-belgium-2024'], 'hsla(200, 60%, 50%, 0.7)', // Teal main
            'hsla(225, 50%, 60%, 0.6)' // Navy secondary
          ],
          'line-opacity': 0.8,
          'line-dasharray': [3, 2]
        }
      });

      // Icons handled with circle styles, no sprites needed
    });

    // Interactions
    map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');
    map.on('mouseenter', 'gems-unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'gems-unclustered-point', () => { map.getCanvas().style.cursor = ''; });

    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0]?.properties!.cluster_id!;
      const coords = e.lngLat.wrap() as LngLatLike;
      (map.getSource('gems') as any).getClusterExpansionZoom(clusterId, (err?: maplibregl.ErrorEvent | null, zoom?: number) => {
        if (!err) {
          map.easeTo({ center: coords, zoom: zoom! });
        }
      });
    });

      map.on('click', 'gems-unclustered-point', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['gems-unclustered-point'] });
        const gem = features[0];
        if (gem) {
        const selected = hiddenGems.find(g => g.id === gem.properties!.id);
          if (selected) {
            setSelectedGem(selected);
            onGemSelect?.(selected);
          }
          map.flyTo({
            center: e.lngLat,
            zoom: 16,
            pitch: 60,
            bearing: map.getBearing() + 90, // Cinematic spin
            duration: 1500
          });
        }
      });

map.on('mouseenter', 'gems-unclustered-point', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['gems-unclustered-point'] });
      setHoveredGemId(features[0]?.properties!.id || null);
    });
    map.on('mouseleave', 'gems-unclustered-point', () => setHoveredGemId(null));

    return () => map.remove();
  }, [gemsGeoJson, journeysGeoJson]);

  // Update data
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      (map.getSource('gems') as any)?.setData(gemsGeoJson());
      (map.getSource('journeys') as any)?.setData(journeysGeoJson());
    }
  }, [gemsGeoJson, journeysGeoJson]);

  return (
    <div className={`w-full h-screen relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
{hoveredGemId && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl max-w-sm z-20 pointer-events-none">
          <div className="font-bold text-lg">{hiddenGems.find(g => g.id === hoveredGemId)?.name || 'Hidden Gem'}</div>
          <div className="text-sm opacity-80">{hiddenGems.find(g => g.id === hoveredGemId)?.category || ''}</div>
        </div>
      )}
    </div>
  );
}

