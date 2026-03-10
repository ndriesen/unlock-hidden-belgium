"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Hotspot } from "@/types/hotspot";
import { fetchHotspots } from "@/lib/services/hotspots";
import { Trip, fetchTrips, removeStopFromTrip, updateStopNote, updateStopVisitedAt, toggleTripLike, toggleTripSave, addHotspotToTrip, updateTripMeta, setTripCoverImage, toggleTripMediaHighlight } from "@/lib/services/tripBuilder";
import { getTripLocations, startLocationTracking, stopLocationTracking, isLocationTracking, LocationUpdate, calculateDistance, isWithinRadius } from "@/lib/services/tripLocationTracking";
import TripHero from "@/components/trips/TripHero";
import TripHighlights from "@/components/trips/TripHighlights";
import TripRouteMap from "@/components/trips/TripRouteMap";
import CreateMemoryModal from "@/components/trips/CreateMemoryModal";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

type TripTab = "route" | "memories" | "timeline" | "insights";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TripTab>("route");
  const [showAddStop, setShowAddStop] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Hotspot[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  
  // Edit mode for trip details
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Memory modal state
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState("");
  const [selectedStopName, setSelectedStopName] = useState("");
  const [selectedHotspotId, setSelectedHotspotId] = useState("");
  
  // Editing visited date state
  const [editingVisitedAt, setEditingVisitedAt] = useState<string | null>(null);
  const [visitedAtValue, setVisitedAtValue] = useState("");

  // Refresh trip when page becomes visible (e.g., after adding stop from another page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTrip();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Also refresh when page regains focus
  useEffect(() => {
    const handleFocus = () => {
      refreshTrip();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Initial load
  useEffect(() => {
    const loadTrip = async () => {
      if (!user?.id) { setLoading(false); return; }
      const trips = await fetchTrips(user.id);
      const found = trips.find(t => t.id === tripId);
      setTrip(found ?? null);
      if (found) {
        setEditTitle(found.title);
        setEditDescription(found.description);
        setEditStartDate(found.startDate ? found.startDate.split('T')[0] : "");
        setEditEndDate(found.endDate ? found.endDate.split('T')[0] : "");
      }
      setLoading(false);
    };
    loadTrip();
  }, [tripId, user?.id]);

  useEffect(() => {
    const search = async () => {
      if (!searchTerm.trim()) { setSearchResults([]); return; }
      const results = await fetchHotspots();
      const filtered = (results as Hotspot[] | null)?.filter(h => 
        h.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ?? [];
      setSearchResults(filtered.slice(0, 8));
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  useEffect(() => {
    if (!isTracking || !trip) return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const nearby = trip.stops.filter(stop => {
          // Use Haversine formula for accurate distance in kilometers
          return isWithinRadius(
            position.coords.latitude,
            position.coords.longitude,
            stop.lat,
            stop.lng,
            0.5 // 500 meters radius
          );
        });
        if (nearby.length > 0) {
          // Show a toast notification instead of alert
          const stopNames = nearby.map(s => s.name).join(", ");
          console.log(`You are near: ${stopNames}`);
        }
      }, (error) => {
        console.error("Geolocation error:", error);
      });
    }
  }, [isTracking, trip]);

  const refreshTrip = async () => {
    if (!user?.id) return;
    const trips = await fetchTrips(user.id);
    const found = trips.find(t => t.id === tripId);
    setTrip(found ?? null);
  };

  const allTripPhotos = useMemo(() => {
    if (!trip) return [];
    return trip.stops.flatMap(stop => stop.media);
  }, [trip]);

  // Sort stops by visited_at for timeline
  const sortedStopsByTime = useMemo(() => {
    if (!trip) return [];
    return [...trip.stops].sort((a, b) => {
      if (!a.visitedAt && !b.visitedAt) return 0;
      if (!a.visitedAt) return 1;
      if (!b.visitedAt) return -1;
      return new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime();
    });
  }, [trip]);

  const handleRemoveStop = async (stopId: string) => {
    if (!trip || !user) return;
    await removeStopFromTrip(trip.id, stopId);
    await refreshTrip();
  };

  const handleStopNoteChange = async (stopId: string, note: string) => {
    if (!trip) return;
    setTrip(prev => prev ? { ...prev, stops: prev.stops.map(s => s.id === stopId ? { ...s, note } : s) } : null);
    await updateStopNote(trip.id, stopId, note);
  };

  const handleAddStop = async (hotspot: Hotspot) => {
    if (!trip || !user) return;
    await addHotspotToTrip({ tripId: trip.id, hotspot });
    await refreshTrip();
    setShowAddStop(false);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleToggleLike = async () => {
    if (!trip || !user) return;
    await toggleTripLike({ tripId: trip.id, userId: user.id, tripTitle: trip.title });
    await refreshTrip();
  };

  const handleToggleSave = async () => {
    if (!trip || !user) return;
    await toggleTripSave({ tripId: trip.id, userId: user.id, tripTitle: trip.title });
    await refreshTrip();
  };

  const handleSaveTripEdit = async () => {
    if (!trip || !user) return;
    setIsSaving(true);
    await updateTripMeta({
      tripId: trip.id,
      userId: user.id,
      title: editTitle,
      description: editDescription,
      startDate: editStartDate || undefined,
      endDate: editEndDate || undefined,
    });
    await refreshTrip();
    setIsSaving(false);
    setIsEditingTrip(false);
  };

  const handleOpenMemoryModal = (stopId: string, stopName: string, hotspotId: string) => {
    setSelectedStopId(stopId);
    setSelectedStopName(stopName);
    setSelectedHotspotId(hotspotId);
    setShowMemoryModal(true);
  };

  const handleOpenVisitedAtEdit = (stopId: string, currentVisitedAt: string | null) => {
    setEditingVisitedAt(stopId);
    if (currentVisitedAt) {
      setVisitedAtValue(currentVisitedAt.split('T')[0]);
    } else {
      setVisitedAtValue(new Date().toISOString().split('T')[0]);
    }
  };

  const handleSaveVisitedAt = async (stopId: string) => {
    if (!trip) return;
    await updateStopVisitedAt(trip.id, stopId, visitedAtValue || null);
    await refreshTrip();
    setEditingVisitedAt(null);
  };

  if (loading) {
    return <div className="min-h-screen p-4" style={{ backgroundColor: "#F7F7F7" }}><Skeleton className="h-48 w-full rounded-2xl mb-4" /><Skeleton className="h-64 w-full rounded-2xl" /></div>;
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F7F7" }}>
        <div className="text-center p-8">
          <div className="text-5xl mb-4">🗺️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Trip not found</h1>
          <Link href="/trips" className="px-4 py-2 bg-[#2A7FFF] text-white rounded-full font-medium">Back to Trips</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F7F7F7" }}>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push("/trips")} className="text-slate-600 hover:text-slate-900">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          {isEditingTrip ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="font-semibold text-slate-900 bg-transparent border-b border-[#2A7FFF] focus:outline-none max-w-[180px]"
            />
          ) : (
            <h1 className="font-semibold text-slate-900 truncate max-w-[180px]">{trip.title}</h1>
          )}
          
          <div className="flex gap-1">
            {isEditingTrip ? (
              <>
                <button 
                  onClick={() => setIsEditingTrip(false)} 
                  className="p-2 rounded-full bg-slate-100 text-slate-600"
                >
                  ✕
                </button>
                <button 
                  onClick={handleSaveTripEdit} 
                  disabled={isSaving}
                  className="p-2 rounded-full bg-emerald-100 text-emerald-600 disabled:opacity-50"
                >
                  {isSaving ? "..." : "✓"}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleToggleLike} className={`p-2 rounded-full ${trip.likedByMe ? "bg-rose-100 text-rose-500" : "bg-slate-100"}`}>{trip.likedByMe ? "❤️" : "🤍"}</button>
                <button onClick={handleToggleSave} className={`p-2 rounded-full ${trip.savedByMe ? "bg-amber-100 text-amber-500" : "bg-slate-100"}`}>{trip.savedByMe ? "⭐" : "☆"}</button>
                <button onClick={() => setIsEditingTrip(true)} className="p-2 rounded-full bg-slate-100 text-slate-600">
                  ✏️
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Trip Details (editable) */}
        {isEditingTrip && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add a description..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2A7FFF]/20 to-purple-500/10" />
          <TripHero trip={trip} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button onClick={() => setActiveTab("route")} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === "route" ? "bg-[#2A7FFF] text-white" : "bg-white border border-slate-200"}`}>🗺️ Route</button>
          <button onClick={() => setActiveTab("timeline")} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === "timeline" ? "bg-[#2A7FFF] text-white" : "bg-white border border-slate-200"}`}>📅 Timeline</button>
          <button onClick={() => setActiveTab("memories")} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === "memories" ? "bg-[#2A7FFF] text-white" : "bg-white border border-slate-200"}`}>📸 Memories</button>
          <button onClick={() => setActiveTab("insights")} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === "insights" ? "bg-[#2A7FFF] text-white" : "bg-white border border-slate-200"}`}>📊 Insights</button>
        </div>

        {activeTab === "route" && (
          <div className="space-y-4">
            {/* Location tracking button */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Track Location</p>
                  <p className="text-xs text-slate-500">Get accurate route and nearby suggestions</p>
                </div>
                <button
                  onClick={() => setIsTracking(!isTracking)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    isTracking 
                      ? "bg-red-100 text-red-600" 
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {isTracking ? "⏹ Stop" : "▶️ Start"}
                </button>
              </div>
            </div>

            {/* Route Map */}
            {trip.stops.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="font-medium text-slate-900 mb-3">Route Overview</p>
                <TripRouteMap stops={trip.stops} height="250px" />
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {!showAddStop ? (
                <button onClick={() => setShowAddStop(true)} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-[#2A7FFF] hover:text-[#2A7FFF]">+ Add Stop</button>
              ) : (
                <div className="space-y-3">
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search places..." className="w-full px-3 py-2 rounded-xl border border-slate-200" autoFocus />
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {searchResults.map(hotspot => (
                        <button key={hotspot.id} onClick={() => handleAddStop(hotspot)} className="w-full p-2 rounded-lg border border-slate-100 hover:border-[#2A7FFF] flex items-center gap-2 text-left">
                          {hotspot.images?.[0] && <div className="relative w-10 h-10 rounded overflow-hidden"><Image src={hotspot.images[0]} alt={hotspot.name} fill className="object-cover" /></div>}
                          <div><p className="font-medium text-sm">{hotspot.name}</p><p className="text-xs text-slate-500">{hotspot.category}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { setShowAddStop(false); setSearchTerm(""); }} className="text-sm text-slate-500">Cancel</button>
                </div>
              )}
            </div>

            {trip.stops.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No stops yet. Add your first stop!</div>
            ) : (
              <div className="space-y-3">
                {trip.stops.map((stop, index) => {
                  const img = stop.media[0]?.signedUrl || stop.photoUrl || "https://images.unsplash.com/photo-1469474968028-56623f02e42e";
                  return (
                    <div key={stop.id} className="bg-white rounded-2xl p-3 shadow-sm flex gap-3">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={img} alt={stop.name} fill className="object-cover" />
                        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#2A7FFF] text-white text-xs flex items-center justify-center">{index + 1}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{stop.name}</p>
                        <p className="text-xs text-slate-500">{stop.category} • {stop.province}</p>
                        <textarea value={stop.note} onChange={(e) => handleStopNoteChange(stop.id, e.target.value)} placeholder="Add note..." className="w-full text-xs mt-1 p-1 bg-slate-50 rounded border-0" rows={1} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => handleOpenMemoryModal(stop.id, stop.name, stop.hotspotId)} className="text-emerald-600 text-xs p-1">📷</button>
                        <button onClick={() => handleRemoveStop(stop.id)} className="text-red-500 text-xs p-1">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Set the date you visited each stop to see your timeline</p>
            {sortedStopsByTime.map((stop, index) => {
              const img = stop.media[0]?.signedUrl || stop.photoUrl || "https://images.unsplash.com/photo-1469474968028-56623f02e42e";
              return (
                <div key={stop.id} className="relative pl-8">
                  {/* Timeline connector */}
                  {index < sortedStopsByTime.length - 1 && (
                    <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-slate-200" />
                  )}
                  {/* Timeline dot */}
                  <div className="absolute left-2 top-4 w-5 h-5 rounded-full bg-[#2A7FFF] border-2 border-white" />
                  
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={img} alt={stop.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{stop.name}</p>
                        <p className="text-xs text-slate-500">{stop.category} • {stop.province}</p>
                        
                        {/* Visited date picker */}
                        <div className="mt-2">
                          {editingVisitedAt === stop.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={visitedAtValue}
                                onChange={(e) => setVisitedAtValue(e.target.value)}
                                className="text-xs px-2 py-1 rounded border border-slate-200"
                              />
                              <button
                                onClick={() => handleSaveVisitedAt(stop.id)}
                                className="text-xs text-emerald-600 font-medium"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingVisitedAt(null)}
                                className="text-xs text-slate-500"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenVisitedAtEdit(stop.id, stop.visitedAt)}
                              className="text-xs text-[#2A7FFF] hover:underline"
                            >
                              {stop.visitedAt 
                                ? `Visited: ${new Date(stop.visitedAt).toLocaleDateString()}`
                                : "+ Add visit date"
                              }
                            </button>
                          )}
                        </div>
                        
                        {/* Photo count */}
                        {stop.media.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1">{stop.media.length} photos</p>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleOpenMemoryModal(stop.id, stop.name, stop.hotspotId)}
                        className="text-emerald-600 p-2"
                      >
                        📷
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {trip.stops.length === 0 && (
              <div className="text-center py-8 text-slate-500">No stops yet. Add stops in the Route tab!</div>
            )}
          </div>
        )}

        {activeTab === "memories" && (
          <div className="space-y-4">
            <TripHighlights photos={allTripPhotos} />
            {trip.stops.map((stop, index) => {
              const hasMemory = stop.media.length > 0 || (stop.note && stop.note.trim().length > 0);
              return (
                <div key={stop.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#2A7FFF]/10 text-[#2A7FFF] text-xs flex items-center justify-center">{index + 1}</span>
                    <p className="font-semibold">📍 {stop.name}</p>
                  </div>
                  {hasMemory ? (
                    <>
                      {stop.media.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {stop.media.map((m, photoIndex) => {
                            const isCover = trip.coverImage === m.storagePath;
                            return (
                              <div key={m.id} className="relative group">
                                <div className="relative aspect-square rounded-lg overflow-hidden">
                                  <Image src={m.signedUrl} alt={m.caption || ""} fill className="object-cover" />
                                  {/* Overlay with actions */}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <button
                                      onClick={async () => {
                                        if (!user) return;
                                        await setTripCoverImage({
                                          tripId: trip.id,
                                          userId: user.id,
                                          storagePath: m.storagePath,
                                        });
                                        await refreshTrip();
                                      }}
                                      className={`p-1.5 rounded-full text-white text-xs ${isCover ? 'bg-emerald-500' : 'bg-white/20 hover:bg-white/40'}`}
                                      title={isCover ? "Cover photo" : "Set as cover"}
                                    >
                                      {isCover ? '✓' : '📷'}
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!user) return;
                                        await toggleTripMediaHighlight({
                                          mediaId: m.id,
                                          userId: user.id,
                                          isHighlight: !m.isHighlight,
                                        });
                                        await refreshTrip();
                                      }}
                                      className={`p-1.5 rounded-full text-white text-xs ${m.isHighlight ? 'bg-amber-500' : 'bg-white/20 hover:bg-white/40'}`}
                                      title={m.isHighlight ? "Remove from highlights" : "Add to highlights"}
                                    >
                                      {m.isHighlight ? '⭐' : '☆'}
                                    </button>
                                  </div>
                                  {/* Highlight badge */}
                                  {m.isHighlight && (
                                    <div className="absolute top-1 right-1">
                                      <span className="text-xs">⭐</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {stop.note && <p className="text-sm text-slate-600 italic">"{stop.note}"</p>}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <button 
                        onClick={() => handleOpenMemoryModal(stop.id, stop.name, stop.hotspotId)}
                        className="text-sm text-emerald-600 font-medium"
                      >
                        + Add memories
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "insights" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 text-center"><p className="text-2xl font-bold text-[#2A7FFF]">{trip.stops.length}</p><p className="text-sm text-slate-500">Stops</p></div>
            <div className="bg-white rounded-2xl p-4 text-center"><p className="text-2xl font-bold text-[#2A7FFF]">{allTripPhotos.length}</p><p className="text-sm text-slate-500">Photos</p></div>
            {trip.startDate && (
              <div className="bg-white rounded-2xl p-4 text-center col-span-2">
                <p className="text-sm text-slate-500">Trip Date</p>
                <p className="font-semibold text-slate-900">
                  {new Date(trip.startDate).toLocaleDateString()}
                  {trip.endDate && ` - ${new Date(trip.endDate).toLocaleDateString()}`}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Memory Modal */}
      <CreateMemoryModal
        isOpen={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        onSuccess={refreshTrip}
        stopId={selectedStopId}
        stopName={selectedStopName}
        tripId={trip.id}
        userId={user?.id || ""}
        hotspotId={selectedHotspotId}
      />
    </div>
  );
}

