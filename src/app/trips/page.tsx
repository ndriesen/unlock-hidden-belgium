"use client";

import Image from "next/image";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchHotspots } from "@/lib/services/hotspots";
import { Hotspot } from "@/types/hotspot";
import {
  Trip,
  addHotspotToQuickTrip,
  addHotspotToTrip,
  buildTripShareText,
  createTrip,
  fetchTrips,
  removeStopFromTrip,
  removeTrip,
  toggleTripLike,
  toggleTripSave,
  updateStopNote,
  updateTripMeta,
  uploadTripStopPhoto,
} from "@/lib/services/tripBuilder";
import { RouteMode, RoutePlan, fetchRoutePlan } from "@/lib/services/routePlanner";
import { useAuth } from "@/context/AuthContext";
import { MediaVisibility } from "@/lib/services/media";
import { supabase } from "@/lib/Supabase/browser-client";

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

interface StopUploadState {
  file: File | null;
  caption: string;
  visibility: MediaVisibility;
  uploading: boolean;
  message: string;
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

function defaultStopUploadState(): StopUploadState {
  return {
    file: null,
    caption: "",
    visibility: "friends",
    uploading: false,
    message: "",
  };
}

export default function TripsPage() {
  const { user, loading: authLoading } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [allHotspots, setAllHotspots] = useState<Hotspot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [pageMessage, setPageMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [routeMode, setRouteMode] = useState<RouteMode>("driving");
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");
  const [mapStyle, setMapStyle] = useState<"default" | "satellite" | "retro" | "terrain">("default");

  const [stopUploads, setStopUploads] = useState<Record<string, StopUploadState>>({});

  const refreshTrips = useCallback(async () => {
    if (!user?.id) {
      setTrips([]);
      setSelectedTripId("");
      return;
    }

    setLoadingTrips(true);
    const loaded = await fetchTrips(user.id);
    setTrips(loaded);

    setSelectedTripId((prev) => {
      if (prev && loaded.some((trip) => trip.id === prev)) {
        return prev;
      }

      return loaded[0]?.id ?? "";
    });

    setLoadingTrips(false);
  }, [user]);

  useEffect(() => {
    const loadHotspots = async () => {
      const data = (await fetchHotspots()) as HotspotRow[] | null;
      if (!data) return;
      setAllHotspots(mapHotspotRows(data));
    };

    void loadHotspots();
  }, []);

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      void (async () => {
        if (!active) return;
        await refreshTrips();
      })();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [refreshTrips]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`trips-live-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        async () => {
          await refreshTrips();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_stops" },
        async () => {
          await refreshTrips();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_media" },
        async () => {
          await refreshTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshTrips]);

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

  const createNewTrip = async () => {
    if (!user?.id) {
      setPageMessage("Login required.");
      return;
    }

    if (!title.trim()) return;

    const nextTrip = await createTrip({
      userId: user.id,
      title,
      description,
      startDate,
      endDate,
      visibility: "private",
    });

    if (!nextTrip) {
      setPageMessage("Could not create trip.");
      return;
    }

    await refreshTrips();
    setSelectedTripId(nextTrip.id);

    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setPageMessage("Trip created.");
  };

  const handleAddStop = async (hotspot: Hotspot) => {
    if (!selectedTrip) return;
    await addHotspotToTrip({ tripId: selectedTrip.id, hotspot });
    await refreshTrips();
  };

  const handleAddToQuickTrip = async (hotspot: Hotspot) => {
    if (!user?.id) {
      setPageMessage("Login required.");
      return;
    }

    await addHotspotToQuickTrip(user.id, hotspot);
    await refreshTrips();
    setPageMessage(`Added ${hotspot.name} to Quick Ideas.`);
  };

  const handleRemoveStop = async (stopId: string) => {
    if (!selectedTrip) return;
    await removeStopFromTrip(selectedTrip.id, stopId);
    await refreshTrips();
  };

  const handleStopNoteChange = async (stopId: string, note: string) => {
    if (!selectedTrip) return;

    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === selectedTrip.id
          ? {
              ...trip,
              stops: trip.stops.map((stop) =>
                stop.id === stopId
                  ? {
                      ...stop,
                      note,
                    }
                  : stop
              ),
            }
          : trip
      )
    );

    await updateStopNote(selectedTrip.id, stopId, note);
  };

  const handleTripDelete = async (tripId: string) => {
    if (!user?.id) return;

    await removeTrip(tripId, user.id);
    await refreshTrips();
  };

  const handleTripVisibilityChange = async (visibility: Trip["visibility"]) => {
    if (!selectedTrip || !user?.id) return;

    await updateTripMeta({
      tripId: selectedTrip.id,
      userId: user.id,
      visibility,
    });

    await refreshTrips();
  };

  const handleTripMetaSave = async () => {
    if (!selectedTrip || !user?.id) return;

    await updateTripMeta({
      tripId: selectedTrip.id,
      userId: user.id,
      description: selectedTrip.description,
    });

    await refreshTrips();
  };

  const handleToggleLike = async () => {
    if (!selectedTrip || !user?.id) {
      setPageMessage("Login required.");
      return;
    }

    await toggleTripLike({
      tripId: selectedTrip.id,
      userId: user.id,
      tripTitle: selectedTrip.title,
    });

    await refreshTrips();
  };

  const handleToggleSave = async () => {
    if (!selectedTrip || !user?.id) {
      setPageMessage("Login required.");
      return;
    }

    await toggleTripSave({
      tripId: selectedTrip.id,
      userId: user.id,
      tripTitle: selectedTrip.title,
    });

    await refreshTrips();
  };

  const copyTripSummary = async () => {
    if (!selectedTrip) return;

    const text = buildTripShareText(selectedTrip);
    await navigator.clipboard.writeText(text);
    setPageMessage("Trip summary copied.");
  };

  const setStopUploadField = (stopId: string, next: Partial<StopUploadState>) => {
    setStopUploads((prev) => ({
      ...prev,
      [stopId]: {
        ...(prev[stopId] ?? defaultStopUploadState()),
        ...next,
      },
    }));
  };

  const uploadStopPhoto = async (stopId: string) => {
    if (!selectedTrip || !user?.id) {
      setPageMessage("Login required.");
      return;
    }

    const state = stopUploads[stopId] ?? defaultStopUploadState();
    const stop = selectedTrip.stops.find((item) => item.id === stopId);

    if (!state.file || !stop) {
      setStopUploadField(stopId, { message: "Select an image first." });
      return;
    }

    setStopUploadField(stopId, { uploading: true, message: "" });

    const result = await uploadTripStopPhoto({
      userId: user.id,
      tripId: selectedTrip.id,
      stopId,
      hotspotId: stop.hotspotId,
      file: state.file,
      caption: state.caption,
      visibility: state.visibility,
    });

    setStopUploadField(stopId, {
      uploading: false,
      message: result.message,
      file: result.success ? null : state.file,
      caption: result.success ? "" : state.caption,
    });

    if (result.success) {
      await refreshTrips();
    }
  };

  if (authLoading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm text-slate-700">
        Please log in to build and track your trips.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
            Route Planner
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Trip Builder</h1>
          <p className="text-sm text-slate-600 mt-1">
            Build routes, track your timeline, and attach photos and notes to each stop.
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

        {pageMessage && <p className="text-xs text-slate-600">{pageMessage}</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-900">Your trips</h2>

          {loadingTrips && <p className="text-xs text-slate-500">Loading trips...</p>}

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
              <p className="text-[11px] text-slate-500 mt-1">
                {trip.likesCount} likes • {trip.savesCount} saves
              </p>
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

                <div className="flex items-center gap-2 flex-wrap">
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
                    onClick={handleToggleLike}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      selectedTrip.likedByMe
                        ? "bg-rose-100 text-rose-700"
                        : "border border-slate-200"
                    }`}
                  >
                    Like ({selectedTrip.likesCount})
                  </button>

                  <button
                    onClick={handleToggleSave}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      selectedTrip.savedByMe
                        ? "bg-amber-100 text-amber-700"
                        : "border border-slate-200"
                    }`}
                  >
                    Save ({selectedTrip.savesCount})
                  </button>

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
                  const nextDescription = event.target.value;

                  setTrips((prev) =>
                    prev.map((trip) =>
                      trip.id === selectedTrip.id
                        ? {
                            ...trip,
                            description: nextDescription,
                          }
                        : trip
                    )
                  );
                }}
                onBlur={handleTripMetaSave}
                rows={3}
                placeholder="Describe the vibe of this trip"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />

              <div className="rounded-xl border border-slate-200 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">Route details</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={routeMode}
                      onChange={(event) => setRouteMode(event.target.value as RouteMode)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    >
                      <option value="driving">Driving</option>
                      <option value="cycling">Cycling</option>
                      <option value="walking">Walking</option>
                    </select>

                    <select
                      value={mapStyle}
                      onChange={(event) =>
                        setMapStyle(
                          event.target.value as "default" | "satellite" | "retro" | "terrain"
                        )
                      }
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    >
                      <option value="default">Default</option>
                      <option value="satellite">Satellite</option>
                      <option value="retro">Retro</option>
                      <option value="terrain">Terrain</option>
                    </select>
                  </div>
                </div>

                {routeLoading && <p className="text-sm text-slate-600">Calculating route...</p>}

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
                  mapStyle={mapStyle}
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Add stops</p>
                  <button
                    onClick={() => {
                      if (!filteredHotspots[0]) return;
                      void handleAddToQuickTrip(filteredHotspots[0]);
                    }}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-1"
                  >
                    Quick add first result
                  </button>
                </div>
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
                      onClick={() => {
                        void handleAddStop(hotspot);
                      }}
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

                {selectedTrip.stops.map((stop, index) => {
                  const uploadState = stopUploads[stop.id] ?? defaultStopUploadState();

                  return (
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
                          onClick={() => {
                            void handleRemoveStop(stop.id);
                          }}
                          className="text-xs text-red-600"
                        >
                          Remove
                        </button>
                      </div>

                      <textarea
                        value={stop.note}
                        onChange={(event) => {
                          void handleStopNoteChange(stop.id, event.target.value);
                        }}
                        rows={2}
                        placeholder="Add memory note, meeting point, or timing"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />

                      {stop.media.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {stop.media.slice(0, 8).map((item) => (
                            <div key={item.id} className="relative h-24 w-32 overflow-hidden rounded-lg border border-slate-200"><Image src={item.signedUrl} alt={item.caption || `${stop.name} media`} fill sizes="128px" className="object-cover" /></div>
                          ))}
                        </div>
                      )}

                      <div className="grid gap-2 md:grid-cols-4">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) =>
                            setStopUploadField(stop.id, {
                              file: event.target.files?.[0] ?? null,
                            })
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                        />
                        <input
                          value={uploadState.caption}
                          onChange={(event) =>
                            setStopUploadField(stop.id, {
                              caption: event.target.value,
                            })
                          }
                          placeholder="Photo caption"
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                        />
                        <select
                          value={uploadState.visibility}
                          onChange={(event) =>
                            setStopUploadField(stop.id, {
                              visibility: event.target.value as MediaVisibility,
                            })
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                        >
                          <option value="private">Private</option>
                          <option value="friends">Friends</option>
                          <option value="public">Public</option>
                        </select>
                        <button
                          onClick={() => {
                            void uploadStopPhoto(stop.id);
                          }}
                          disabled={uploadState.uploading}
                          className="rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                        >
                          {uploadState.uploading ? "Uploading..." : "Upload photo"}
                        </button>
                      </div>

                      {uploadState.message && (
                        <p className="text-xs text-slate-600">{uploadState.message}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}











