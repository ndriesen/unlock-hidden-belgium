import { TripStop } from "@/lib/services/tripBuilder";

export type RouteMode = "driving" | "cycling" | "walking";

export interface RouteLeg {
  fromStopId: string;
  toStopId: string;
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMin: number;
  estimatedCostEur: number;
}

export interface RoutePlan {
  mode: RouteMode;
  distanceKm: number;
  durationMin: number;
  estimatedFuelCostEur: number;
  estimatedTollCostEur: number;
  estimatedTotalCostEur: number;
  geometry: [number, number][];
  legs: RouteLeg[];
  provider: "osrm";
}

interface OsrmRouteResponse {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    legs?: Array<{
      distance: number;
      duration: number;
      summary?: string;
    }>;
  }>;
}

function round(value: number, decimals = 1): number {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function estimateCosts(distanceKm: number, mode: RouteMode) {
  if (mode !== "driving") {
    return {
      fuel: 0,
      toll: 0,
      total: 0,
    };
  }

  const litersPer100Km = 6.5;
  const fuelPricePerLiter = 1.8;

  const litersUsed = (distanceKm / 100) * litersPer100Km;
  const fuel = litersUsed * fuelPricePerLiter;

  const toll = distanceKm * 0.03;

  return {
    fuel: round(fuel, 2),
    toll: round(toll, 2),
    total: round(fuel + toll, 2),
  };
}

function buildRouteLegs(
  stops: TripStop[],
  routeLegs: NonNullable<NonNullable<OsrmRouteResponse["routes"]>[number]["legs"]>,
  mode: RouteMode
): RouteLeg[] {
  const result: RouteLeg[] = [];

  for (let index = 0; index < stops.length - 1; index += 1) {
    const from = stops[index];
    const to = stops[index + 1];
    const leg = routeLegs[index];

    if (!leg) {
      continue;
    }

    const distanceKm = round(leg.distance / 1000, 1);
    const durationMin = round(leg.duration / 60, 0);
    const costs = estimateCosts(distanceKm, mode);

    result.push({
      fromStopId: from.id,
      toStopId: to.id,
      fromName: from.name,
      toName: to.name,
      distanceKm,
      durationMin,
      estimatedCostEur: costs.total,
    });
  }

  return result;
}

export async function fetchRoutePlan(
  stops: TripStop[],
  mode: RouteMode
): Promise<RoutePlan | null> {
  if (stops.length < 2) return null;

  const coordinates = stops.map((stop) => `${stop.lng},${stop.lat}`).join(";");

  const url = `https://router.project-osrm.org/route/v1/${mode}/${coordinates}?overview=full&geometries=geojson&steps=false`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const payload = (await response.json()) as OsrmRouteResponse;
  const route = payload.routes?.[0];

  if (!route) return null;

  const distanceKm = round(route.distance / 1000, 1);
  const durationMin = round(route.duration / 60, 0);
  const costs = estimateCosts(distanceKm, mode);
  const legs = buildRouteLegs(stops, route.legs ?? [], mode);

  return {
    mode,
    distanceKm,
    durationMin,
    estimatedFuelCostEur: costs.fuel,
    estimatedTollCostEur: costs.toll,
    estimatedTotalCostEur: costs.total,
    geometry: route.geometry.coordinates.map((point) => [point[1], point[0]]),
    legs,
    provider: "osrm",
  };
}

