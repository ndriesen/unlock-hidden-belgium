"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TripStop } from "@/lib/services/tripPlanner";

interface TripRouteMapProps {
  stops: TripStop[];
  routeGeometry: [number, number][];
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const bounds = L.latLngBounds(points.map((point) => L.latLng(point[0], point[1])));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  }, [map, points]);

  return null;
}

export default function TripRouteMap({ stops, routeGeometry }: TripRouteMapProps) {
  const stopPoints: [number, number][] = stops.map((stop) => [stop.lat, stop.lng]);
  const linePoints = routeGeometry.length ? routeGeometry : stopPoints;

  if (!stopPoints.length) {
    return (
      <div className="h-[300px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-600">
        Add at least one stop to show your route map.
      </div>
    );
  }

  return (
    <div className="h-[300px] rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={stopPoints[0]}
        zoom={8}
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {linePoints.length > 1 && (
          <Polyline positions={linePoints} pathOptions={{ color: "#059669", weight: 4 }} />
        )}

        {stops.map((stop) => (
          <Marker key={stop.id} position={[stop.lat, stop.lng]} />
        ))}

        <FitBounds points={linePoints.length > 1 ? linePoints : stopPoints} />
      </MapContainer>
    </div>
  );
}