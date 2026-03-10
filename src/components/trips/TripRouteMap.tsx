"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TripStop } from "@/lib/services/tripBuilder";
import { TripLocation } from "@/lib/services/tripLocationTracking";

interface TripRouteMapProps {
  stops: TripStop[];
  locations?: TripLocation[];
  showRoute?: boolean;
  height?: string;
}

function getStopCoordinates(stop: TripStop): [number, number] | null {
  // TripStop uses lat and lng
  if (stop.lat && stop.lng) {
    return [stop.lat, stop.lng];
  }
  return null;
}

function FitToRoute({ stops, locations }: { stops: TripStop[]; locations?: TripLocation[] }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    // Add stop coordinates
    stops.forEach((stop) => {
      const coords = getStopCoordinates(stop);
      if (coords) points.push(coords);
    });

    // Add tracked location coordinates if available
    if (locations) {
      locations.forEach((loc) => {
        points.push([loc.latitude, loc.longitude]);
      });
    }

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => L.latLng(point[0], point[1])));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true });
  }, [stops, locations, map]);

  return null;
}

function createStopIcon(index: number, total: number): L.DivIcon {
  const size = 32;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  
  let bgColor = "#2A7FFF";
  let symbol = `${index + 1}`;
  
  if (isFirst) {
    bgColor = "#10b981";
    symbol = "S";
  } else if (isLast) {
    bgColor = "#ef4444";
    symbol = "E";
  }

  return new L.DivIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        background:${bgColor};
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.3);
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-size:12px;
        font-weight:700;
      ">${symbol}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function TripRouteMap({
  stops,
  locations = [],
  showRoute = true,
  height = "300px",
}: TripRouteMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Get route coordinates (either from tracked locations or stops)
  const routeCoordinates = useMemo<[number, number][]>(() => {
    if (locations.length > 0) {
      // Use tracked locations for more accurate route
      return locations.map((loc) => [loc.latitude, loc.longitude]);
    }

    // Fall back to stop coordinates
    return stops
      .map((stop) => getStopCoordinates(stop))
      .filter((coords): coords is [number, number] => coords !== null);
  }, [stops, locations]);

  const tile = useMemo(() => ({
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  }), []);

  // Calculate total distance
  const totalDistance = useMemo(() => {
    if (routeCoordinates.length < 2) return 0;
    
    let distance = 0;
    for (let i = 1; i < routeCoordinates.length; i++) {
      const from = L.latLng(routeCoordinates[i - 1]);
      const to = L.latLng(routeCoordinates[i]);
      distance += from.distanceTo(to);
    }
    
    return distance / 1000; // Convert to km
  }, [routeCoordinates]);

  if (stops.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 rounded-xl"
        style={{ height }}
      >
        <p className="text-slate-500">No stops to display on map</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      <MapContainer
        center={[50.85, 4.35]}
        zoom={8}
        className="w-full"
        style={{ height }}
        ref={(mapInstance) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
          }
        }}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />
        
        {/* Route line */}
        {showRoute && routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#2A7FFF",
              weight: 4,
              opacity: 0.8,
              dashArray: locations.length > 0 ? undefined : "10, 10",
            }}
          />
        )}
        
        {/* Stop markers */}
        {stops.map((stop, index) => {
          const coords = getStopCoordinates(stop);
          if (!coords) return null;

          return (
            <Marker
              key={stop.id}
              position={coords}
              icon={createStopIcon(index, stops.length)}
            />
          );
        })}
        
        <FitToRoute stops={stops} locations={locations} />
      </MapContainer>
      
      {/* Distance indicator */}
      {totalDistance > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-sm font-medium text-slate-700">
          {totalDistance.toFixed(1)} km total
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-[#10b981]" />
          <span className="text-slate-600">Start</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-[#2A7FFF]" />
          <span className="text-slate-600">Stop</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span className="text-slate-600">End</span>
        </div>
      </div>
    </div>
  );
}

