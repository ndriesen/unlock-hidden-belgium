import { Hotspot } from "@/types/hotspot";

const STORAGE_KEY = "uhb_trips_v1";

export interface TripStop {
  id: string;
  hotspotId: string;
  name: string;
  province: string;
  category: string;
  lat: number;
  lng: number;
  note: string;
  photoUrl: string;
  addedAt: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: "private" | "friends" | "public";
  coverImage: string;
  createdAt: string;
  updatedAt: string;
  stops: TripStop[];
}

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function getTrips(): Trip[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Trip[];
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (error) {
    console.error("Failed to parse trips:", error);
    return [];
  }
}

export function saveTrips(trips: Trip[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function createTrip(input: {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  visibility?: Trip["visibility"];
}): Trip {
  const now = new Date().toISOString();

  return {
    id: createId("trip"),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    startDate: input.startDate ?? "",
    endDate: input.endDate ?? "",
    visibility: input.visibility ?? "private",
    coverImage: "",
    createdAt: now,
    updatedAt: now,
    stops: [],
  };
}

export function upsertTrip(trip: Trip): Trip[] {
  const all = getTrips();
  const existingIndex = all.findIndex((item) => item.id === trip.id);

  if (existingIndex >= 0) {
    all[existingIndex] = {
      ...trip,
      updatedAt: new Date().toISOString(),
    };
  } else {
    all.unshift({
      ...trip,
      updatedAt: new Date().toISOString(),
    });
  }

  saveTrips(all);
  return all;
}

export function removeTrip(tripId: string): Trip[] {
  const remaining = getTrips().filter((trip) => trip.id !== tripId);
  saveTrips(remaining);
  return remaining;
}

export function ensureQuickTrip(): Trip {
  const all = getTrips();
  const existing = all.find((trip) => trip.id === "trip_quick");

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const quickTrip: Trip = {
    id: "trip_quick",
    title: "Quick Ideas",
    description: "Fast list of hotspots to explore next.",
    startDate: "",
    endDate: "",
    visibility: "private",
    coverImage: "",
    createdAt: now,
    updatedAt: now,
    stops: [],
  };

  saveTrips([quickTrip, ...all]);
  return quickTrip;
}

export function hotspotToStop(hotspot: Hotspot): TripStop {
  return {
    id: createId("stop"),
    hotspotId: hotspot.id,
    name: hotspot.name,
    province: hotspot.province,
    category: hotspot.category,
    lat: hotspot.latitude,
    lng: hotspot.longitude,
    note: "",
    photoUrl: hotspot.images?.[0] ?? "",
    addedAt: new Date().toISOString(),
  };
}

export function addHotspotToTrip(tripId: string, hotspot: Hotspot): Trip[] {
  const all = getTrips();
  const index = all.findIndex((trip) => trip.id === tripId);
  if (index < 0) return all;

  const stopAlreadyExists = all[index].stops.some((stop) => stop.hotspotId === hotspot.id);
  if (stopAlreadyExists) return all;

  all[index] = {
    ...all[index],
    updatedAt: new Date().toISOString(),
    stops: [...all[index].stops, hotspotToStop(hotspot)],
  };

  saveTrips(all);
  return all;
}

export function addHotspotToQuickTrip(hotspot: Hotspot): Trip[] {
  const quickTrip = ensureQuickTrip();
  return addHotspotToTrip(quickTrip.id, hotspot);
}

export function removeStopFromTrip(tripId: string, stopId: string): Trip[] {
  const all = getTrips();
  const index = all.findIndex((trip) => trip.id === tripId);
  if (index < 0) return all;

  all[index] = {
    ...all[index],
    updatedAt: new Date().toISOString(),
    stops: all[index].stops.filter((stop) => stop.id !== stopId),
  };

  saveTrips(all);
  return all;
}

export function updateStopNote(tripId: string, stopId: string, note: string): Trip[] {
  const all = getTrips();
  const index = all.findIndex((trip) => trip.id === tripId);
  if (index < 0) return all;

  all[index] = {
    ...all[index],
    updatedAt: new Date().toISOString(),
    stops: all[index].stops.map((stop) =>
      stop.id === stopId
        ? {
            ...stop,
            note,
          }
        : stop
    ),
  };

  saveTrips(all);
  return all;
}

export function buildTripShareText(trip: Trip): string {
  const header = `${trip.title} (${trip.stops.length} stops)`;
  const lines = trip.stops.map(
    (stop, index) =>
      `${index + 1}. ${stop.name} - ${stop.province} (${stop.category})`
  );

  return [header, ...lines].join("\n");
}