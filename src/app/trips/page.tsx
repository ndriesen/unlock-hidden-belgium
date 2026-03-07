"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { fetchHotspots } from "@/lib/services/hotspots";
import { Hotspot } from "@/types/hotspot";
import {
  Trip,
  addHotspotToTrip,
  buildTripShareText,
  createTrip,
  getTrips,
  removeStopFromTrip,
  removeTrip,
  updateStopNote,
  upsertTrip,
} from "@/lib/services/tripPlanner";
import {
  RouteMode,
  RoutePlan,
  fetchRoutePlan,
} from "@/lib/services/routePlanner";

const TripRouteMap = dynamic(() => import("@/components/trips/TripRouteMap"), {
  ssr: false,
});

interface HotspotRow {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  category: string | null;
  province: string | null;
  images?: string[] | null;
}

function mapHotspotRows(rows: HotspotRow[]): Hotspot[] {
  return rows
    .filter((row) => row.latitude !== null && row.longitude !== null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      category: row.category ?? "Unknown",
      province: row.province ?? "Unknown",
      images: row.images ?? undefined,
    }));
}

function getInitialTrips(): Trip[] {
  return getTrips();
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>(() => getInitialTrips());
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    const initial = getInitialTrips();
    return initial[0]?.id ?? "";
  });
  const [allHotspots, setAllHotspots] = useState<Hotspot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [routeMode, setRouteMode] = useState<RouteMode>("driving");
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");

  useEffect(() => {
    const loadHotspots = async () => {
      const data = (await fetchHotspots()) as HotspotRow[] | null;
      if (!data) return;
      setAllHotspots(mapHotspotRows(data));
    };

    void loadHotspots();
  }, []);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) ?? null,
    [selectedTripId, trips]
  );

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      void (async () => {
        if (!selectedTrip || selectedTrip.stops.length < 2) {
          if (active) {
            setRoutePlan(null);
            setRouteLoading(false);
            setRouteMessage("Add at least two stops to compute a route.");
          }
          return;
        }

        if (active) {
          setRouteLoading(true);
          setRouteMessage("");
        }

        const plan = await fetchRoutePlan(selectedTrip.stops, routeMode);

        if (!active) return;

        if (!plan) {
          setRoutePlan(null);
          setRouteLoading(false);
          setRouteMessage(
            "Could not fetch route details right now. Try again in a moment."
          );
          return;
        }

        setRoutePlan(plan);
        setRouteLoading(false);
      })();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [routeMode, selectedTrip]);

  const filteredHotspots = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allHotspots.slice(0, 8);

    return allHotspots
      .filter(
        (hotspot) =>
          hotspot.name.toLowerCase().includes(q) ||
          hotspot.category.toLowerCase().includes(q) ||
          hotspot.province.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allHotspots, searchTerm]);

  const createNewTrip = () => {
    if (!title.trim()) return;

    const nextTrip = createTrip({
      title,
      description,
      startDate,
      endDate,
      visibility: "private",
    });

    const updated = upsertTrip(nextTrip);
    setTrips(updated);
    setSelectedTripId(nextTrip.id);

    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
  };

  const handleAddStop = (hotspot: Hotspot) => {
    if (!selectedTrip) return;
    const updated = addHotspotToTrip(selectedTrip.id, hotspot);
    setTrips(updated);
  };

  const handleRemoveStop = (stopId: string) => {
    if (!selectedTrip) return;
    const updated = removeStopFromTrip(selectedTrip.id, stopId);
    setTrips(updated);
  };

  const handleStopNoteChange = (stopId: string, note: string) => {
    if (!selectedTrip) return;
    const updated = updateStopNote(selectedTrip.id, stopId, note);
    setTrips(updated);
  };

  const handleTripDelete = (tripId: string) => {
    const updated = removeTrip(tripId);
    setTrips(updated);

    if (selectedTripId === tripId) {
      setSelectedTripId(updated[0]?.id ?? "");
    }
  };

  const handleTripVisibilityChange = (visibility: Trip["visibility"]) => {
    if (!selectedTrip) return;

    const updated = upsertTrip({
      ...selectedTrip,
      visibility,
    });

    setTrips(updated);
  };

  const copyTripSummary = async () => {
    if (!selectedTrip) return;

    const text = buildTripShareText(selectedTrip);
    await navigator.clipboard.writeText(text);
  };

  const saveTripMeta = () => {
    if (!selectedTrip) return;

    const updated = upsertTrip(selectedTrip);
    setTrips(updated);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
            Route Planner
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Trip Builder</h1>
          <p className="text-sm text-slate-600 mt-1">
            Build your route, add story notes per stop, and get travel estimates.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Trip title (e.g. Ardennes Weekend)"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short description"
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>

        <button
          onClick={createNewTrip}
          className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold"
        >
          Create trip
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-900">Your trips</h2>

          {trips.length === 0 && (
            <p className="text-sm text-slate-600">No trips yet. Create your first route above.</p>
          )}

          {trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => setSelectedTripId(trip.id)}
              className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                selectedTripId === trip.id
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              <p className="font-semibold text-slate-900">{trip.title}</p>
              <p className="text-xs text-slate-600 mt-1">{trip.stops.length} stops</p>
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          {!selectedTrip && (
            <p className="text-slate-600">Select a trip to edit its stops and story.</p>
          )}

          {selectedTrip && (
            <>
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedTrip.title}</h2>
                  <p className="text-sm text-slate-600">
                    {selectedTrip.startDate || "No start"} - {selectedTrip.endDate || "No end"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTrip.visibility}
                    onChange={(event) =>
                      handleTripVisibilityChange(event.target.value as Trip["visibility"])
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  >
                    <option value="private">Private</option>
                    <option value="friends">Friends</option>
                    <option value="public">Public</option>
                  </select>

                  <button
                    onClick={copyTripSummary}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                  >
                    Copy summary
                  </button>

                  <button
                    onClick={() => handleTripDelete(selectedTrip.id)}
                    className="rounded-lg bg-red-500 text-white px-3 py-1.5 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <textarea
                value={selectedTrip.description}
                onChange={(event) => {
                  const updated = trips.map((trip) =>
                    trip.id === selectedTrip.id
                      ? {
                          ...trip,
                          description: event.target.value,
                        }
                      : trip
                  );
                  setTrips(updated);
                }}
                onBlur={saveTripMeta}
                rows={3}
                placeholder="Describe the vibe of this trip"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />

              <div className="rounded-xl border border-slate-200 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">Route details</p>
                  <select
                    value={routeMode}
                    onChange={(event) => setRouteMode(event.target.value as RouteMode)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  >
                    <option value="driving">Driving</option>
                    <option value="cycling">Cycling</option>
                    <option value="walking">Walking</option>
                  </select>
                </div>

                {routeLoading && (
                  <p className="text-sm text-slate-600">Calculating route...</p>
                )}

                {!routeLoading && routeMessage && (
                  <p className="text-sm text-slate-600">{routeMessage}</p>
                )}

                {routePlan && (
                  <div className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-5 text-sm">
                      <div className="rounded-lg border border-slate-200 p-2">
                        <p className="text-xs text-slate-500">Distance</p>
                        <p className="font-semibold text-slate-900">{routePlan.distanceKm} km</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-2">
                        <p className="text-xs text-slate-500">Duration</p>
                        <p className="font-semibold text-slate-900">{routePlan.durationMin} min</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-2">
                        <p className="text-xs text-slate-500">Fuel estimate</p>
                        <p className="font-semibold text-slate-900">EUR {routePlan.estimatedFuelCostEur}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-2">
                        <p className="text-xs text-slate-500">Toll estimate</p>
                        <p className="font-semibold text-slate-900">EUR {routePlan.estimatedTollCostEur}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-2">
                        <p className="text-xs text-slate-500">Total cost estimate</p>
                        <p className="font-semibold text-slate-900">EUR {routePlan.estimatedTotalCostEur}</p>
                      </div>
                    </div>

                    {routePlan.legs.length > 0 && (
                      <div className="rounded-lg border border-slate-200 p-2 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Segment details
                        </p>
                        <div className="space-y-1">
                          {routePlan.legs.map((leg, index) => (
                            <p key={`${leg.fromStopId}_${leg.toStopId}`} className="text-xs text-slate-700">
                              {index + 1}. {leg.fromName} to {leg.toName} - {leg.distanceKm} km - {leg.durationMin} min - EUR {leg.estimatedCostEur}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Route data provider: {routePlan.provider.toUpperCase()}.
                    </p>
                  </div>
                )}

                <TripRouteMap
                  stops={selectedTrip.stops}
                  routeGeometry={routePlan?.geometry ?? []}
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <p className="text-sm font-semibold text-slate-800">Add stops</p>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search hotspots"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />

                <div className="grid gap-2 md:grid-cols-2">
                  {filteredHotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      onClick={() => handleAddStop(hotspot)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-emerald-200"
                    >
                      <p className="font-semibold text-slate-900">{hotspot.name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {hotspot.category} - {hotspot.province}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">Trip timeline</p>

                {selectedTrip.stops.length === 0 && (
                  <p className="text-sm text-slate-600">No stops yet. Add one from the search list.</p>
                )}

                {selectedTrip.stops.map((stop, index) => (
                  <article key={stop.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {index + 1}. {stop.name}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {stop.category} - {stop.province}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveStop(stop.id)}
                        className="text-xs text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    <textarea
                      value={stop.note}
                      onChange={(event) => handleStopNoteChange(stop.id, event.target.value)}
                      rows={2}
                      placeholder="Add memory note, meeting point, or timing"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}