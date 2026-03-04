"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet.heat";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { Hotspot } from "@/types/hotspot";
import type { LeafletEvent } from "leaflet";


/* ========================================================= */
/* ======================= TYPES =========================== */
/* ========================================================= */



interface Props {
  hotspots: Hotspot[];
  visitedIds?: string[];
  wishlistIds?: string[];
  favoriteIds?: string[];
  viewMode: "markers" | "heatmap";
  mapStyle: "default" | "satellite";
  onVisit?: (id: string) => void;
  onSelect?: (h: Hotspot) => void;
}

/* ========================================================= */
/* ======================= MAP VIEW ======================== */
/* ========================================================= */

export default function MapView({
  hotspots = [],
  visitedIds = [],
  wishlistIds = [],
  favoriteIds = [],
  viewMode = "markers",
  mapStyle = "default",
  onVisit,
  onSelect,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  /* ---------------- DARK MODE ---------------- */

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(media.matches);

    const listener = () => setIsDark(media.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  /* ---------------- PERFORMANCE ---------------- */

  const useCanvas = hotspots.length > 1500;

  /* ---------------- TILE SWITCH ---------------- */

  const tileUrl =
    mapStyle === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  

  /* ---------------- SMOOTH SELECT ---------------- */

  const handleSelect = useCallback(
    (h: Hotspot) => {
      setSelectedId(h.id);
      onSelect?.(h);

      if (mapRef.current) {
        const lat = h.lat ?? h.latitude;
        const lng = h.lng ?? h.longitude;

        if (lat && lng) {
          mapRef.current.flyTo([lat, lng], 14, {
            duration: 0.8,
          });
        }
      }
    },
    [onSelect]
  );

  /* ========================================================= */
  /* ====================== RENDER =========================== */
  /* ========================================================= */

  return (
    <MapContainer
      preferCanvas={useCanvas}
      center={[50.85, 4.35]}
      zoom={8}
      className="w-full h-[75vh]"
      ref={(mapInstance) => {
        if (mapInstance) {
          mapRef.current = mapInstance;
        }
      }}
    >
      <TileLayer url={tileUrl} />

      {viewMode === "markers" && (
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          iconCreateFunction={(cluster: any) => {
            const count = cluster.getChildCount();

            const size =
              count < 10 ? 26 :
              count < 50 ? 36 :
              54;

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

      {viewMode === "heatmap" && (
        <HeatmapLayer hotspots={hotspots} />
      )}

      <UserLocation hotspots={hotspots} onVisit={onVisit} />
    </MapContainer>
  );
}

/* ========================================================= */
/* ================= ZOOM AWARE MARKERS ==================== */
/* ========================================================= */

function ZoomAwareMarkers({
  hotspots,
  selectedId,
  visitedIds,
  wishlistIds,
  favoriteIds,
  onSelect,
  onVisit,
}: any) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on("zoomend", handleZoom);
    return () => map.off("zoomend", handleZoom);
  }, [map]);

  const size =
    zoom < 9 ? 16 :
    zoom < 12 ? 20 :
    zoom < 14 ? 24 :
    28;

  return (
    <>
      {hotspots.map((h: any) => {
        const lat = h.lat ?? h.latitude;
        const lng = h.lng ?? h.longitude;
        if (!lat || !lng) return null;

        let color = "#10b981";

        if (selectedId === h.id) color = "#f59e0b";
        else if (visitedIds.includes(h.id)) color = "#9ca3af";
        else if (favoriteIds.includes(h.id)) color = "#a855f7";
        else if (wishlistIds.includes(h.id)) color = "#facc15";

        const icon = new L.DivIcon({
          className: "",
          html: `
            <div style="
              width:${size}px;
              height:${size}px;
              background:${color};
              border-radius:50%;
              border:2px solid white;
              box-shadow:0 4px 10px rgba(0,0,0,0.25);
            "></div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        return (
          <Marker
            key={h.id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelect(h),
              dblclick: () => onVisit?.(h.id),
            }}
          />
        );
      })}
    </>
  );
}

/* ========================================================= */
/* ======================= HEATMAP ========================= */
/* ========================================================= */

function HeatmapLayer({ hotspots }: { hotspots: Hotspot[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Get max popularity for normalization
    const maxPopularity = Math.max(
      ...hotspots.map((h: any) => h.visit_count || h.likes || 1),
      1
    );

    const heatPoints = hotspots
      .map((h: any) => {
        const lat = h.lat ?? h.latitude;
        const lng = h.lng ?? h.longitude;
        if (!lat || !lng) return null;

        const popularity = h.visit_count || h.likes || 1;

        // Normalize 0 → 1
        const intensity = popularity / maxPopularity;

        return [lat, lng, intensity] as [number, number, number];
      })
      .filter(Boolean) as [number, number, number][];

    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      gradient: {
        0.3: "#60a5fa",
        0.5: "#34d399",
        0.7: "#facc15",
        0.9: "#f97316",
        1.0: "#ef4444",
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [hotspots, map]);

  return null;
}

/* ========================================================= */
/* ==================== USER LOCATION ====================== */
/* ========================================================= */

function UserLocation({ hotspots, onVisit }: any) {
  const map = useMap();
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords: [number, number] = [
        pos.coords.latitude,
        pos.coords.longitude,
      ];
      setPosition(coords);
      map.flyTo(coords, 12);
    });
  }, [map]);

  useEffect(() => {
    if (!position) return;

    hotspots.forEach((h: any) => {
      const lat = h.lat ?? h.latitude;
      const lng = h.lng ?? h.longitude;
      if (!lat || !lng) return;

      const distance = map.distance(position, [lat, lng]);

      if (distance < 100) {
        onVisit?.(h.id);
      }
    });
  }, [position, hotspots, onVisit, map]);

  if (!position) return null;

  return <Marker position={position} />;
}
