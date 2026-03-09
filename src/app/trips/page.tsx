"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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

// Import new components
import TripHero from "@/components/trips/TripHero";
import MemoryCard from "@/components/trips/MemoryCard";
import EmptyMemories from "@/components/trips/EmptyMemories";
import TripHighlights from "@/components/trips/TripHighlights";
import StopDrawer from "@/components/trips/StopDrawer";
import CreateMemoryModal from "@/components/trips/CreateMemoryModal";

const TripRouteMap = dynamic(() => import("@/components/trips/TripRouteMap"), {
  ssr: false,
});

type TripTab = "route" | "memories" | "insights";

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

// Get cover image for a trip - priority: cover_photo → first memory → fallback
function getTripCoverImage(trip: Trip): string {
  if (trip.coverImage) return trip.coverImage;
  for (const stop of trip.stops) {
    if (stop.media.length > 0) {
      return stop.media[0].signedUrl;
    }
  }
  if (trip.stops[0]?.photoUrl) {
    return trip.stops[0].photoUrl;
  }
  return "https://images.unsplash.com/photo-1469474968028-56623f02e42e";
}

export default function TripsPage() {
  const { user, loading: authLoading } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [allHotspots, setAllHotspots] = useState<Hotspot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TripTab>("route");

  // Modal/Drawer states
  const [selectedStopForDrawer, setSelectedStopForDrawer] = useState<Trip["stops"][0] | null>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [selectedStopForMemory, setSelectedStopForMemory] = useState<{ id: string; name: string } | null>(null);

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

  // Refs for scroll-into-view
  const stopRefs = useRef<Record<string, HTMLDivElement>>({});

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
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, async () => {
        await refreshTrips();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_stops" }, async () => {
        await refreshTrips();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_media" }, async () => {
        await refreshTrips();
      })
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
          setRouteMessage("Could not fetch route details right now. Try again in a moment.");
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

  // Get all photos for highlights
  const allTripPhotos = useMemo(() => {
    if (!selectedTrip) return [];
    return selectedTrip.stops.flatMap((stop) => stop.media);
  }, [selectedTrip]);

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
          ? { ...trip, stops: trip.stops.map((stop) => (stop.id === stopId ? { ...stop, note } : stop)) }
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
    await updateTripMeta({ tripId: selectedTrip.id, userId: user.id, visibility });
    await refreshTrips();
  };

  const handleToggleLike = async () => {
    if (!selectedTrip || !user?.id) {
      setPageMessage("Login required.");
      return;
    }
    await toggleTripLike({ tripId: selectedTrip.id, userId: user.id, tripTitle: selectedTrip.title });
    await refreshTrips();
  };

  const handleToggleSave = async () => {
    if (!selectedTrip || !user?.id) {
      setPageMessage("Login required.");
      return;
    }
    await toggleTripSave({ tripId: selectedTrip.id, userId: user.id, tripTitle: selectedTrip.title });
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
      [stopId]: { ...(prev[stopId] ?? defaultStopUploadState()), ...next },
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

  // Handlers for new components
  const handleOpenStopDrawer = (stop: Trip["stops"][0]) => {
    setSelectedStopForDrawer(stop);
  };

  const handleCloseStopDrawer = () => {
    setSelectedStopForDrawer(null);
  };

  const handleAddMemoryFromDrawer = (stop: Trip["stops"][0]) => {
    setSelectedStopForMemory({ id: stop.id, name: stop.name });
    setIsMemoryModalOpen(true);
    setSelectedStopForDrawer(null);
  };

  const handleAddMemoryClick = (stop: Trip["stops"][0]) => {
    setSelectedStopForMemory({ id: stop.id, name: stop.name });
    setIsMemoryModalOpen(true);
  };

  // Calculate trip progress
  const tripProgress = useMemo(() => {
    if (!selectedTrip) return { stops: 0, memories: 0 };
    const memories = selectedTrip.stops.reduce((acc, stop) => acc + stop.media.length, 0);
    return { stops: selectedTrip.stops.length, memories };
  }, [selectedTrip]);

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
      {/* Create Trip Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Route Planner</p>
          <h1 className="text-2xl font-bold text-slate-900">Trip Builder</h1>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Trip title (e.g. Ardennes Weekend)" className="rounded-xl border border-slate-200 px-3 py-2" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="rounded-xl border border-slate-200 px-3 py-2" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
        </div>
        <button onClick={createNewTrip} className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold">
          Create trip
        </button>
        {pageMessage && <p className="text-xs text-slate-600">{pageMessage}</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar - Trip Cards with Cover Images */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-900">Your trips</h2>
          {loadingTrips && <p className="text-xs text-slate-500">Loading trips...</p>}
          {trips.length === 0 && <p className="text-sm text-slate-600">No trips yet. Create your first route above.</p>}
          {trips.map((trip) => {
            const memories = trip.stops.reduce((acc, stop) => acc + stop.media.length, 0);
            return (
              <button
                key={trip.id}
                onClick={() => setSelectedTripId(trip.id)}
                className={`w-full text-left rounded-xl border overflow-hidden transition ${
                  selectedTripId === trip.id ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200 hover:border-emerald-200"
                }`}
              >
                <div className="relative h-24 w-full bg-slate-200">
                  <Image src={getTripCoverImage(trip)} alt={trip.title} fill className="object-cover" sizes="288px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="font-semibold text-white text-sm truncate">{trip.title}</p>
                  </div>
                </div>
                <div className="p-2 bg-white flex justify-between items-center">
                  <p className="text-[11px] text-slate-500">{trip.stops.length} stops</p>
                  <p className="text-[11px] text-slate-500">{memories} memories</p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <div className="space-y-4">
          {!selectedTrip && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-600">Select a trip to start planning your adventure.</p>
            </div>
          )}

          {selectedTrip && (
            <>
              {/* Trip Hero - NEW COMPONENT */}
              <TripHero trip={selectedTrip} />

              {/* Big Map - 45% viewport height */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm" style={{ height: "45vh", minHeight: "300px" }}>
                <TripRouteMap stops={selectedTrip.stops} routeGeometry={routePlan?.geometry ?? []} mapStyle={mapStyle} />
              </div>

              {/* Tab Navigation */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200">
                  {(["route", "memories", "insights"] as TripTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                        activeTab === tab ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {tab === "route" && "🗺 Route"}
                      {tab === "memories" && "📸 Memories"}
                      {tab === "insights" && "📊 Insights"}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {/* ROUTE TAB */}
                  {activeTab === "route" && (
                    <div className="space-y-4">
                      {/* Add stops search */}
                      <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                        <p className="text-sm font-semibold text-slate-800">Add stops</p>
                        <input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search hotspots..."
                          className="w-full rounded-lg border border-slate-200 px-3 py-2"
                        />
                        {filteredHotspots.length > 0 && (
                          <div className="grid gap-2 md:grid-cols-2">
                            {filteredHotspots.map((hotspot) => (
                              <button
                                key={hotspot.id}
                                onClick={() => handleAddStop(hotspot)}
                                className="rounded-lg border border-slate-200 p-2 text-left hover:border-emerald-200 flex gap-2"
                              >
                                {hotspot.images?.[0] && (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image src={hotspot.images[0]} alt={hotspot.name} fill className="object-cover" sizes="48px" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{hotspot.name}</p>
                                  <p className="text-xs text-slate-600">{hotspot.category} • {hotspot.province}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Visual Stop Cards with click handler */}
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-800">Trip stops</p>
                        {selectedTrip.stops.length === 0 && <p className="text-sm text-slate-600">No stops yet. Add one from the search above.</p>}
                        {selectedTrip.stops.map((stop, index) => {
                          const uploadState = stopUploads[stop.id] ?? defaultStopUploadState();
                          const stopImage = stop.media[0]?.signedUrl || stop.photoUrl || "https://images.unsplash.com/photo-1469474968028-56623f02e42e";
                          
                          return (
                            <div 
                              key={stop.id} 
                              ref={(el) => { if (el) stopRefs.current[stop.id] = el; }}
                              className="rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-300 transition"
                              onClick={() => handleOpenStopDrawer(stop)}
                            >
                              <div className="flex">
                                {/* Stop Image */}
                                <div className="relative w-24 h-24 flex-shrink-0">
                                  <Image src={stopImage} alt={stop.name} fill className="object-cover" sizes="96px" loading="lazy" />
                                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                                    {index + 1}
                                  </div>
                                </div>
                                
                                {/* Stop Info */}
                                <div className="flex-1 p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-semibold text-slate-900">{stop.name}</p>
                                      <p className="text-xs text-slate-600">{stop.category} • {stop.province}</p>
                                    </div>
                                    <button onClick={() => handleRemoveStop(stop.id)} className="text-xs text-red-600 hover:text-red-700">
                                      Remove
                                    </button>
                                  </div>
                                  
                                  <textarea
                                    value={stop.note}
                                    onChange={(e) => handleStopNoteChange(stop.id, e.target.value)}
                                    placeholder="Add a note..."
                                    className="w-full text-xs rounded border border-slate-200 px-2 py-1 resize-none"
                                    rows={2}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>

                              {/* Photos */}
                              {stop.media.length > 0 && (
                                <div className="border-t border-slate-100 p-2 flex gap-1 overflow-x-auto">
                                  {stop.media.slice(0, 6).map((item) => (
                                    <div key={item.id} className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                      <Image src={item.signedUrl} alt={item.caption || stop.name} fill className="object-cover" sizes="64px" loading="lazy" />
                                    </div>
                                  ))}
                                  {stop.media.length > 6 && (
                                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-600">
                                      +{stop.media.length - 6}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Add Memory Button */}
                              <div className="border-t border-slate-100 p-2" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => handleAddMemoryClick(stop)}
                                  className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-emerald-400 hover:text-emerald-600 flex items-center justify-center gap-2"
                                >
                                  📸 Add memory
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* MEMORIES TAB - Now with Timeline, Highlights, Empty States */}
                  {activeTab === "memories" && (
                    <div className="space-y-4">
                      {/* Trip Highlights - NEW */}
                      <TripHighlights photos={allTripPhotos} />
                      
                      {selectedTrip.stops.length === 0 ? (
                        <EmptyMemories onAddMemory={() => setIsMemoryModalOpen(true)} />
                      ) : (
                        selectedTrip.stops.map((stop, index) => {
                          const hasMemory = stop.media.length > 0 || (stop.note && stop.note.trim().length > 0);
                          
                          return (
                            <div key={stop.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <p className="font-semibold text-slate-900">📍 {stop.name}</p>
                              </div>

                              {hasMemory ? (
                                <>
                                  {stop.media.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {stop.media.map((item) => (
                                        <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden">
                                          <Image src={item.signedUrl} alt={item.caption || stop.name} fill className="object-cover" sizes="200px" loading="lazy" />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {stop.note && (
                                    <p className="text-sm text-slate-700 italic">"{stop.note}"</p>
                                  )}
                                </>
                              ) : (
                                <div className="bg-slate-50 rounded-lg p-4 text-center">
                                  <p className="text-sm text-slate-600">You visited this hotspot.</p>
                                  <button 
                                    onClick={() => handleAddMemoryClick(stop)}
                                    className="mt-2 text-sm text-emerald-600 font-medium hover:text-emerald-700"
                                  >
                                    + Create a memory?
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* INSIGHTS TAB */}
                  {activeTab === "insights" && (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 p-4 text-center">
                          <p className="text-2xl font-bold text-slate-900">{routePlan?.distanceKm ?? "-"}</p>
                          <p className="text-xs text-slate-500 uppercase">km</p>
                          <p className="text-xs text-slate-400 mt-1">Total Distance</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4 text-center">
                          <p className="text-2xl font-bold text-slate-900">{routePlan?.durationMin ?? "-"}</p>
                          <p className="text-xs text-slate-500 uppercase">min</p>
                          <p className="text-xs text-slate-400 mt-1">Driving Time</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4 text-center">
                          <p className="text-2xl font-bold text-slate-900">€{routePlan?.estimatedFuelCostEur ?? "-"}</p>
                          <p className="text-xs text-slate-500 uppercase">EUR</p>
                          <p className="text-xs text-slate-400 mt-1">Estimated Fuel</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4 text-center">
                          <p className="text-2xl font-bold text-slate-900">€{routePlan?.estimatedTollCostEur ?? "-"}</p>
                          <p className="text-xs text-slate-500 uppercase">EUR</p>
                          <p className="text-xs text-slate-400 mt-1">Tolls</p>
                        </div>
                      </div>

                      {routePlan && (
                        <div className="rounded-xl border border-slate-200 p-4">
                          <p className="text-sm font-semibold text-slate-800 mb-3">Route Segments</p>
                          <div className="space-y-2">
                            {routePlan.legs.map((leg, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">{leg.fromName} → {leg.toName}</span>
                                <span className="text-slate-500">{leg.distanceKm} km • {leg.durationMin} min</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Map Style Selector */}
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-800 mb-3">Map Style</p>
                        <div className="flex gap-2 flex-wrap">
                          {(["default", "satellite", "retro", "terrain"] as const).map((style) => (
                            <button
                              key={style}
                              onClick={() => setMapStyle(style)}
                              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                                mapStyle === style ? "bg-emerald-100 text-emerald-700" : "border border-slate-200"
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stop Drawer - NEW COMPONENT */}
      {selectedStopForDrawer && (
        <StopDrawer
          stop={selectedStopForDrawer}
          onClose={handleCloseStopDrawer}
          onAddMemory={() => handleAddMemoryFromDrawer(selectedStopForDrawer)}
        />
      )}

      {/* Create Memory Modal - NEW COMPONENT */}
      <CreateMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        stopId={selectedStopForMemory?.id || ""}
        stopName={selectedStopForMemory?.name || ""}
      />
    </div>
  );
}

