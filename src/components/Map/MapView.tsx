"use client";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet.heat/dist/leaflet-heat.js";
import { useState, useEffect, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from "react";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { Hotspot } from "@/types/hotspot";

interface Props {
  hotspots: Hotspot[];
  loading: boolean;
  compact?: boolean;
  visitedIds?: string[];
  wishlistIds?: string[];
  favoriteIds?: string[];
  selectedHotspotId?: string | null;
  viewMode: "markers" | "heatmap";
  mapStyle: "default" | "satellite" | "retro" | "terrain";
  autoLocate?: boolean;
  autoFit?: boolean;
  enableClustering?: boolean;
  preventZoom?: boolean;
  onVisit?: (id: string) => void;
  onSelect?: (hotspot: Hotspot) => void;
}

interface ZoomAwareMarkersProps {
  hotspots: Hotspot[];
  selectedId: string | null;
  visitedIds: string[];
  wishlistIds: string[];
  favoriteIds: string[];
  onSelect: (hotspot: Hotspot) => void;
  onVisit?: (id: string) => void;
}

interface UserLocationProps {
  hotspots: Hotspot[];
  onVisit?: (id: string) => void;
}

interface ClusterLike {
  getChildCount: () => number;
}

interface HeatLayerOptions {
  radius: number;
  blur: number;
  maxZoom: number;
  gradient: Record<number, string>;
}

interface HeatLayerFactory {
  heatLayer: (
    points: [number, number, number][],
    options: HeatLayerOptions
  ) => L.Layer;
}

export interface MapViewHandle {
  flyTo: (coords: [number, number], zoom?: number) => void;
}

function getCoordinates(
  hotspot: Pick<Hotspot, "lat" | "lng" | "latitude" | "longitude">
): [number, number] | null {
  const lat = hotspot.lat ?? hotspot.latitude;
  const lng = hotspot.lng ?? hotspot.longitude;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return [lat, lng];
}

function mapTileConfig(style: Props["mapStyle"], isDark: boolean) {
  if (style === "satellite") {
    return {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles © Esri",
    };
  }

  if (style === "retro") {
    return {
      url: "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png",
      attribution: "© Stadia Maps © Stamen Design © OpenMapTiles © OpenStreetMap contributors",
    };
  }

  if (style === "terrain") {
    return {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: "Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap",
    };
  }

  if (isDark) {
    return {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "© OpenStreetMap contributors © CARTO",
    };
  }

  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  };
}

function FitToHotspots({ hotspots, enabled }: { hotspots: Hotspot[]; enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !hotspots.length) return;

    const points = hotspots
      .map((hotspot) => getCoordinates(hotspot))
      .filter((point): point is [number, number] => point !== null);

    if (!points.length) return;

    if (points.length === 1) {
      map.setView(points[0], 14, {
        animate: true,
      });
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => L.latLng(point[0], point[1])));
    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: 13,
      animate: true,
    });
  }, [enabled, hotspots, map]);

  return null;
}

const MapView = forwardRef<MapViewHandle, Props>(function MapView({
  hotspots = [],
  loading,
  compact = false,
  visitedIds = [],
  wishlistIds = [],
  favoriteIds = [],
  selectedHotspotId,
  viewMode = "markers",
  mapStyle = "default",
  autoLocate = true,
  autoFit = false,
  enableClustering = true,
  preventZoom = false,
  onVisit,
  onSelect,
}: Props, ref) {
  const mapRef = useRef<L.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useImperativeHandle(ref, () => ({
    flyTo: (coords: [number, number], zoom = 14) => {
      if (!mapRef.current) return;
      mapRef.current.flyTo(coords, zoom, { duration: 0.8 });
    },
  }));

  useEffect(() => {
    if (selectedHotspotId === undefined) return;
    setSelectedId(selectedHotspotId);
  }, [selectedHotspotId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = (event: MediaQueryListEvent) => {
      setIsDark(event.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const useCanvas = hotspots.length > 1500;
  const tile = useMemo(() => mapTileConfig(mapStyle, isDark), [mapStyle, isDark]);

  const handleSelect = useCallback(
    (hotspot: Hotspot) => {
      setSelectedId(hotspot.id);
      onSelect?.(hotspot);

      const coords = getCoordinates(hotspot);
      if (!coords || !mapRef.current || preventZoom) return;

      mapRef.current.flyTo(coords, 14, {
        duration: 0.8,
      });
    },
    [onSelect, preventZoom]
  );

  return (
    <div className="relative w-full h-full">
      <MapContainer
        preferCanvas={useCanvas}
        center={[50.85, 4.35]}
        zoom={8}
        className="w-full h-full"
        ref={(mapInstance) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
          }
        }}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />

        {viewMode === "markers" && enableClustering && hotspots.length > 1 && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={19}
            iconCreateFunction={(cluster: ClusterLike) => {
              const count = cluster.getChildCount();
              const size = count < 10 ? 26 : count < 50 ? 36 : 54;

              return L.divIcon({
                html: `
                  <div style="
                    width:${size}px;
                    height:${size}px;
                    border-radius:50%;
                    background:rgba(16,185,129,0.65);
                    backdrop-filter: blur(8px);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    color:white;
                    font-weight:600;
                    border:2px solid rgba(255,255,255,0.6);
                    box-shadow:0 8px 20px rgba(0,0,0,0.25);
                  ">
                    ${count}
                  </div>
                `,
                className: "",
                iconSize: L.point(size, size),
              });
            }}
          >
            <ZoomAwareMarkers
              hotspots={hotspots}
              selectedId={selectedId}
              visitedIds={visitedIds}
              wishlistIds={wishlistIds}
              favoriteIds={favoriteIds}
              onSelect={handleSelect}
              onVisit={onVisit}
            />
          </MarkerClusterGroup>
        )}

        {viewMode === "markers" && (!enableClustering || hotspots.length <= 1) && (
          <ZoomAwareMarkers
            hotspots={hotspots}
            selectedId={selectedId}
            visitedIds={visitedIds}
            wishlistIds={wishlistIds}
            favoriteIds={favoriteIds}
            onSelect={handleSelect}
            onVisit={onVisit}
          />
        )}

        {viewMode === "heatmap" && <HeatmapLayer hotspots={hotspots} />}

{autoLocate && (
  <div className="leaflet-control-container">
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control-locate leaflet-bar leaflet-control">
        <a className="leaflet-control-locate-toggle" href="#" title="Locate me" role="button" aria-label="Locate me">
          <span className="leaflet-control-locate-location"></span>
        </a>
      </div>
    </div>
  </div>
)}
        <FitToHotspots hotspots={hotspots} enabled={autoFit} />
      </MapContainer>

      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center text-emerald-700 font-semibold pointer-events-none">
          Loading map data...
        </div>
      )}

      {!loading && !compact && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-emerald-700 font-medium">
          {hotspots.length} hotspots loaded • Click markers to explore
        </div>
      )}
    </div>
  );
});

export default MapView;

function ZoomAwareMarkers({
  hotspots,
  selectedId,
  visitedIds,
  wishlistIds,
  favoriteIds,
  onSelect,
  onVisit,
}: ZoomAwareMarkersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [visibleCount, setVisibleCount] = useState(50); // Start with 50 markers

  // Reset visible count when hotspots change
  useEffect(() => {
    setVisibleCount(50);
  }, [hotspots]);

  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on("zoomend", handleZoom);

    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map]);

  // Staggered marker loading - progressively show more markers
  useEffect(() => {
    if (visibleCount >= hotspots.length) return;

    const timeout = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 50, hotspots.length));
    }, 100);

    return () => clearTimeout(timeout);
  }, [visibleCount, hotspots.length]);

  // Only show markers up to visibleCount for performance
  const visibleHotspots = useMemo(
    () => hotspots.slice(0, visibleCount),
    [hotspots, visibleCount]
  );

  const size = zoom < 9 ? 18 : zoom < 12 ? 22 : zoom < 14 ? 26 : 30;

  return (
    <>
      {visibleHotspots.map((hotspot) => {
        const coords = getCoordinates(hotspot);
        if (!coords) return null;

        let color = "#10b981";
        let symbol = "•";
        if (selectedId === hotspot.id) {
          color = "#f59e0b";
          symbol = "•";
        } else if (visitedIds.includes(hotspot.id)) {
          color = "#64748b";
          symbol = "✓";
        } else if (favoriteIds.includes(hotspot.id)) {
          color = "#e11d48";
          symbol = "♡";
        } else if (wishlistIds.includes(hotspot.id)) {
          color = "#f59e0b";
          symbol = "⟟";
        }

        const icon = new L.DivIcon({
          className: "",
          html: `
            <div style="
              width:${size}px;
              height:${size}px;
              background:${color};
              border-radius:999px;
              border:2px solid white;
              box-shadow:0 8px 16px rgba(0,0,0,0.25);
              color:white;
              font-size:${Math.max(11, Math.floor(size * 0.45)) + 2}px;
              line-height:${size - 4}px;
              text-align:center;
              font-weight:700;
            ">${symbol}</div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        return (
          <Marker
            key={hotspot.id}
            position={coords}
            icon={icon}
            eventHandlers={{
              click: () => onSelect(hotspot),
              dblclick: () => onVisit?.(hotspot.id),
            }}
          />
        );
      })}
    </>
  );
}

function HeatmapLayer({ hotspots }: { hotspots: Hotspot[] }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    // Clear existing layer
    heatLayerRef.current?.removeFrom?.(map);

    const points = hotspots
      .map((hotspot) => {
        const coords = getCoordinates(hotspot);
        if (!coords) return null;
        return [coords[0], coords[1], (hotspot.visit_count || 1) / 100] as [number, number, number];
      })
      .filter((p): p is [number, number, number] => p !== null);

    if (points.length === 0) return;

    heatLayerRef.current = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: "#00f5d4", 0.65: "#ff6b6b", 1: "#ffee00" }
    }) as any;

    heatLayerRef.current?.addTo(map);

    return () => {
      heatLayerRef.current?.removeFrom?.(map);
    };
  }, [hotspots, map]);

  return null;
}










