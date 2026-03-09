"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TripStop } from "@/lib/services/tripBuilder";

interface TripRouteMapProps {
  stops: TripStop[];
  routeGeometry: [number, number][];
  mapStyle?: "default" | "satellite" | "retro" | "terrain";
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const bounds = L.latLngBounds(points.map((point) => L.latLng(point[0], point[1])));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
  }, [map, points]);

  return null;
}

function buildStopIcon(index: number, isLast: boolean): L.DivIcon {
  const bg = index === 0 ? "#0ea5e9" : isLast ? "#ef4444" : "#059669";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:30px;
        height:30px;
        border-radius:999px;
        background:${bg};
        color:white;
        border:2px solid #ffffff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:12px;
        font-weight:700;
        box-shadow:0 8px 18px rgba(15,23,42,0.28);
      ">${index + 1}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function getTileConfig(style: TripRouteMapProps["mapStyle"]) {
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

  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  };
}

export default function TripRouteMap({
  stops,
  routeGeometry,
  mapStyle = "default",
}: TripRouteMapProps) {
  const stopPoints: [number, number][] = useMemo(
    () => stops.map((stop) => [stop.lat, stop.lng]),
    [stops]
  );

  const linePoints = routeGeometry.length ? routeGeometry : stopPoints;
  const tile = getTileConfig(mapStyle);

  if (!stopPoints.length) {
    return (
      <div className="h-[320px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-600">
        Add at least one stop to show your route map.
      </div>
    );
  }

  return (
    <div className="h-[320px] rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={stopPoints[0]}
        zoom={8}
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />

        {linePoints.length > 1 && (
          <Polyline
            positions={linePoints}
            pathOptions={{ color: "#059669", weight: 5, opacity: 0.9 }}
          />
        )}

        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={buildStopIcon(index, index === stops.length - 1)}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {index + 1}. {stop.name}
            </Tooltip>
          </Marker>
        ))}

        <FitBounds points={linePoints.length > 1 ? linePoints : stopPoints} />
      </MapContainer>
    </div>
  );
}

