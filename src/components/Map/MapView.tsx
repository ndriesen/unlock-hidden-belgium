﻿"use client";


import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { MapResizeFix } from "./MapResizeFix";
import MobileMapFix from "./MobileMapFix";
import { GeolocationControl } from "./GeolocationControl";
import type { LatLngExpression, Map } from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Fullscreen, Minimize } from "lucide-react";


// Task 9: Leaflet Next.js icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

import "leaflet.heat/dist/leaflet-heat.js";
import { useState, useEffect, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from "react";

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

function getPlatform(): "ios" | "android" | "desktop" {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  return "desktop";
}


function FitToHotspots({ hotspots, enabled }: { hotspots: Hotspot[]; enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !hotspots.length || !map) return;

    const points = hotspots
      .map((hotspot) => getCoordinates(hotspot))
      .filter((point): point is [number, number] => point !== null);

    if (!points.length) return;

    if (points.length === 1) {
      map.setView(points[0], 14, {
        animate: true,
      });
    } else {
      const bounds = L.latLngBounds(points.map((point) => L.latLng(point[0], point[1])));
      map.fitBounds(bounds, {
        padding: [28, 28],
        maxZoom: 6,
        animate: true,
      });
    }
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
  const [isDark, setIsDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  useImperativeHandle(ref, () => ({
    flyTo: (coords: [number, number], zoom = 14) => {
      if (!mapRef.current) return;
      mapRef.current.flyTo(coords, zoom, { duration: 0.8 });
    },
  }));
  
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    // Init
    setTimeout(() => map.invalidateSize(), 300);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const hotspotCoordinates = useMemo(() => {
    return hotspots
      .map((h) => {
        const lat = h.lat ?? h.latitude;
        const lng = h.lng ?? h.longitude;

        if (typeof lat !== "number" || typeof lng !== "number") {
          return null;
        }

        return { id: h.id, coords: [lat, lng] };
      })
      .filter(Boolean);
  }, [hotspots]);

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

  const handleGoToCurrentLocation = () => {
    if (!navigator.geolocation || !navigator.permissions) {
      alert("Your browser does not support geolocation.");
      return;
    }

    // Check de huidige permissie-status
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        // Toegang al toegestaan
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            mapRef.current?.flyTo(coords, 14);
          },
          (error) => {
            console.error(error);
            alert("Unable to access your location.");
          }
        );
      } else if (result.state === "prompt") {
        // Browser zal prompt tonen
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            mapRef.current?.flyTo(coords, 14);
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setShowLocationPrompt(true);
            } else {
              alert("Unable to access your location.");
            }
          }
        );
      } else if (result.state === "denied") {
        // Permissie geweigerd → toon instructies
        setShowLocationPrompt(true);
      }

      // Update als permissie verandert (optioneel)
      result.onchange = () => {
        if (result.state === "granted") {
          setShowLocationPrompt(false);
        }
      };
    });
  };

  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

useEffect(() => {
  if (typeof window !== "undefined") {
    setPlatform(getPlatform());
  }
}, []);

  return (
    <div
  className={`
    ${isFullscreen 
      ? "fixed inset-0 z-[9998] bg-black w-screen h-screen"
      : "relative w-full"
    }
    ${!isFullscreen && (compact ? 'h-[400px]' : 'h-screen min-h-[500px]')}
    overflow-hidden
  `}

    >
      <MapContainer
        preferCanvas={true}
        renderer={L.canvas({ padding: 0.5 })}
        center={[50.85, 4.35]}
        zoom={8}
        className="w-full h-full leaflet-mobile-fixed leaflet-gpu-accelerated"
        zoomControl={false}
        doubleClickZoom={false}
        ref={(instance) => {
          if (instance !== null) {
            mapRef.current = instance;
          }
        }}
        whenReady={() => {
          if (mapRef.current && typeof mapRef.current.invalidateSize === 'function') {
            setTimeout(() => mapRef.current!.invalidateSize(), compact ? 300 : 100);
          }
        }}
      >
<MapResizeFix />        <MobileMapFix />
        <TileLayer 
          url={tile.url} 
          attribution={tile.attribution}
          detectRetina={true}
          crossOrigin={true}
          updateWhenZooming={false}
          keepBuffer={6}
          tileSize={256}
updateWhenIdle={true}
          eventHandlers={{
            tileerror: (e) => {
              console.error("Tile failed to load", e);
            },
            tileloadstart: () => {
              console.log("Tile loading...");
            }
          }}
        />
        {/* Geolocation: Functional locate control when autoLocate=true */}

      

{viewMode === "markers" && enableClustering && hotspotCoordinates.length > 100 && (
          <MarkerClusterGroup
chunkedLoading            chunkInterval={200}            chunkDelay={50}            removeOutsideVisibleBounds            maxClusterRadius={40}
            iconCreateFunction={(cluster: ClusterLike) => {
              const count = cluster.getChildCount();
              const size = count < 10 ? 26 : count < 50 ? 36 : 54;

              return L.divIcon({
                html: `
                  <div style="
                    width:${size}px;
                    height:${size}px;
                    border-radius:50%;
                    background:rgba(149, 150, 152, 0.65);
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

{/* Locate UI moved to GeolocationControl for functionality */}
        <FitToHotspots hotspots={hotspots} enabled={autoFit} />
      </MapContainer>
      
      
  
        {/* BUTTON CONTROLS */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto z-50">

          {/* Locate / Current Location Button */}
          <button
            onClick={handleGoToCurrentLocation}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white transition"
            title="Go to current location"
          >
            📍
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white transition"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize size={20} /> : <Fullscreen size={20} />}
          </button>

        </div>

      


      

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

      <AnimatePresence>
        {showLocationPrompt && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[10010] bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationPrompt(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed z-[10020] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-xl shadow-xl p-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-4">Enable Location</h3>
              <p className="mb-6">
                {platform === "ios" && (
                  <>Go to Settings 
                  → Safari 
                  → Location 
                  → Allow While Using App</>
                )}
                {platform === "android" && (
                  <>Go to Settings 
                  → Chrome 
                  → Site Settings 
                  → Location 
                  → Allow</>
                )}
                {platform === "desktop" && (
                  <>Please enable location access in your browser settings.</>
                )}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert(
                      "Your browser blocked location access. Please enable it in your browser settings."
                    );
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Enable Location
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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

    const delay = hotspots.length > 2000 ? 30 : 100;
    const timeout = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 50, hotspots.length));
    }, delay);

    return () => clearTimeout(timeout);
  }, [visibleCount, hotspots.length]);
  

// Viewport-based marker rendering (Task 6) + progressive load
  const [bounds, setBounds] = useState<any>(map.getBounds());

  useEffect(() => {
    setBounds(map.getBounds());
  }, [map]);

  useMapEvents({
    moveend: () => setBounds(map.getBounds()),
  });

  

  const visibleHotspots = useMemo(() => {
    // TEMP DISABLED bounds filter for MyHotspots debugging
    // const filtered = hotspots.filter((hotspot) => {
    //   const coords = getCoordinates(hotspot);
    //   if (!coords) return false;
    //   return bounds.contains(coords);
    // });
    const filtered = hotspots.filter((hotspot) => {
      const coords = getCoordinates(hotspot);
      return coords !== null;
    });
    return filtered.slice(0, visibleCount);
  }, [hotspots, visibleCount]); // removed bounds dep

  const size = zoom < 9 ? 16 : zoom < 12 ? 22 : zoom < 14 ? 26 : 30;

  return (
    <>
      {visibleHotspots.map((hotspot) => {
        const coords = getCoordinates(hotspot);
        if (!coords) return null;

        let color = "#959698";
        let symbol = "•";
        if (selectedId === hotspot.id) {
          color = "#f59e0b";
          symbol = "•";
        } else if (visitedIds.includes(hotspot.id)) {
          color = "#10b981";
          symbol = "✓";
        } else if (favoriteIds.includes(hotspot.id)) {
          color = "#e12e55";
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
      maxZoom: 10,
      gradient: { 0.4: "#00f5d4", 0.65: "#ff6b6b", 1: "#ffee00" }
    }) as any;

    heatLayerRef.current?.addTo(map);

    return () => {
      heatLayerRef.current?.removeFrom?.(map);
    };
  }, [hotspots, map]);

  return null;
}











