"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [2.3522, 48.8566],
      zoom: 2,
      pitch: 45,
      bearing: 0,
    });

    mapRef.current = map;

    // ✅ Controls
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // ✅ Wait until map is ready
    map.on("load", () => {
      // 🌍 Optional globe-like fog
     


      // 📍 Add marker AFTER load
      new maplibregl.Marker({ color: "#ff4d4d" })
        .setLngLat([2.3522, 48.8566])
        .setPopup(new maplibregl.Popup().setText("Paris"))
        .addTo(map);
    });

    return () => {
      map.remove(); // ✅ cleanup
    };
  }, []);

  const focusLocation = () => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [2.3522, 48.8566],
      zoom: 16,
      pitch: 60,
      duration: 2500,
    });
  };

  return (
    <>
      <div ref={mapContainer} className="w-full h-screen" />

      <button
        onClick={focusLocation}
        className="fixed bottom-4 left-4 z-50 bg-white px-4 py-2 rounded shadow"
      >
        Focus Paris
      </button>
    </>
  );
}