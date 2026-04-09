"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { Map, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { useHiddenGemsDemo } from "@/hooks/useHiddenGemsDemo";
import type { ExploreHotspot } from "@/lib/services/explore";
import type { LngLatLike } from "maplibre-gl";

interface Props {
  onGemSelect?: (gem: ExploreHotspot | null) => void;
  className?: string;
  initialView?: { center: [number, number]; zoom: number };
}

const DISCOVERY_MAP_STYLE = "https://demotiles.maplibre.org/style.json";

export default function PremiumHiddenGemsMap({ onGemSelect, className = "", initialView }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const { hiddenGems } = useHiddenGemsDemo();
  const [hoveredGemId, setHoveredGemId] = useState<string | null>(null);

  const gemsGeoJson = useCallback(() => {
    const features = hiddenGems
      .filter((gem) => gem.longitude && gem.latitude)
      .map((gem) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [gem.longitude!, gem.latitude!],
        },
        properties: {
          id: gem.id,
          name: gem.name,
          preview: gem.imageUrl,
          description: gem.description,
          category: gem.category,
          province: gem.province,
          visitCount: gem.visitCount,
          likesCount: gem.likesCount,
        },
      }));

    return turf.featureCollection(features);
  }, [hiddenGems]);

  const journeysGeoJson = useCallback(() => turf.featureCollection([]), []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: DISCOVERY_MAP_STYLE,
      center: initialView?.center || [4.5, 50.8],
      zoom: initialView?.zoom || 4,
      minZoom: 0,
      maxZoom: 22,
      pitch: 60,
      bearing: -15,
    });

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: true }), "top-right");

    const handleResize = () => map.resize();
    window.addEventListener("resize", handleResize);

    map.on("error", (event) => {
      console.error("Discovery map error:", event.error ?? event);
    });

    map.on("load", () => {
      map.resize();

      try {
        map.setProjection({ type: "globe" });
      } catch {
        // Keep default projection on environments/styles that do not support globe.
      }

      map.addSource("gems", {
        type: "geojson",
        data: gemsGeoJson(),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 60,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "gems",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "hsla(200, 60%, 50%, 0.8)",
            10,
            "hsla(200, 60%, 40%, 0.9)",
            50,
            "hsla(200, 60%, 30%, 1)",
          ],
          "circle-radius": ["step", ["get", "point_count"], 25, 10, 35, 50, 50],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.9,
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "gems",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
      });

      map.addLayer({
        id: "gems-unclustered-point",
        type: "circle",
        source: "gems",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 22,
          "circle-color": ["case", ["has", "preview"], "hsla(200, 60%, 50%, 0.1)", "#ef4444"],
          "circle-stroke-width": 4,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "gems-labels",
        type: "symbol",
        source: "gems",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": "{name}",
          "text-font": ["Open Sans Semibold"],
          "text-size": 12,
          "text-offset": [0, 2],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "white",
          "text-halo-color": "hsla(0,0%,0%,0.7)",
          "text-halo-width": 1,
        },
      });

      map.addSource("journeys", {
        type: "geojson",
        data: journeysGeoJson(),
      });

      map.addLayer({
        id: "journey-lines",
        type: "line",
        source: "journeys",
        paint: {
          "line-width": 4,
          "line-color": [
            "case",
            ["==", ["get", "id"], "premium-belgium-2024"],
            "hsla(200, 60%, 50%, 0.7)",
            "hsla(225, 50%, 60%, 0.6)",
          ],
          "line-opacity": 0.8,
          "line-dasharray": [3, 2],
        },
      });

      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("mouseenter", "gems-unclustered-point", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const features = map.queryRenderedFeatures(e.point, { layers: ["gems-unclustered-point"] });
        setHoveredGemId((features[0]?.properties?.id as string | undefined) || null);
      });

      map.on("mouseleave", "gems-unclustered-point", () => {
        map.getCanvas().style.cursor = "";
        setHoveredGemId(null);
      });

      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        if (!features[0]) return;

        const clusterId = Number(features[0].properties?.cluster_id);
        if (!Number.isFinite(clusterId)) return;

        const coords = e.lngLat.wrap() as LngLatLike;
        const source = map.getSource("gems") as maplibregl.GeoJSONSource;

        void source
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            map.easeTo({ center: coords, zoom });
          })
          .catch(() => {
            // Ignore cluster zoom errors and keep current camera.
          });
      });

      map.on("click", "gems-unclustered-point", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["gems-unclustered-point"] });
        const gem = features[0];
        if (!gem) return;

        const selected = hiddenGems.find((item) => item.id === gem.properties?.id);
        if (selected) {
          onGemSelect?.(selected);
        }

        map.flyTo({
          center: e.lngLat,
          zoom: 16,
          pitch: 60,
          bearing: map.getBearing() + 90,
          duration: 1500,
        });
      });
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, [gemsGeoJson, hiddenGems, initialView?.center, initialView?.zoom, journeysGeoJson, onGemSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    (map.getSource("gems") as maplibregl.GeoJSONSource | undefined)?.setData(gemsGeoJson());
    (map.getSource("journeys") as maplibregl.GeoJSONSource | undefined)?.setData(journeysGeoJson());
  }, [gemsGeoJson, journeysGeoJson]);

  return (
    <div className={`w-full h-screen relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {hoveredGemId && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 max-w-sm -translate-x-1/2 transform rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="text-lg font-bold">{hiddenGems.find((gem) => gem.id === hoveredGemId)?.name || "Hidden Gem"}</div>
          <div className="text-sm opacity-80">{hiddenGems.find((gem) => gem.id === hoveredGemId)?.category || ""}</div>
        </div>
      )}
    </div>
  );
}

