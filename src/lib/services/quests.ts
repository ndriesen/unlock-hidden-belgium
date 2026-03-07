import { Hotspot } from "@/types/hotspot";

export interface NearbyQuest {
  hotspot: Hotspot;
  distanceKm: number;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceBetweenKm(
  a: [number, number],
  b: [number, number]
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b[0] - a[0]);
  const dLng = toRadians(b[1] - a[1]);

  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthRadiusKm * c;
}

export function buildNearbyQuests(
  hotspots: Hotspot[],
  position: [number, number],
  visitedIds: string[]
): NearbyQuest[] {
  const visited = new Set(visitedIds);

  return hotspots
    .filter((hotspot) => !visited.has(hotspot.id))
    .map((hotspot) => {
      const distanceKm = distanceBetweenKm(position, [
        hotspot.latitude,
        hotspot.longitude,
      ]);

      return {
        hotspot,
        distanceKm,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);
}