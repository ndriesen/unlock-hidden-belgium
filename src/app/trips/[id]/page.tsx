"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Hotspot, getCategoryDisplay } from "@/types/hotspot";
import { fetchHotspots } from "@/lib/services/hotspots";
import { fetchTrips, removeStopFromTrip, updateStopNote, updateStopVisitedAt, toggleTripLike, toggleTripSave, addHotspotToTrip, updateTripMeta, setTripCoverImage, toggleTripMediaHighlight } from "@/lib/services/tripBuilder";
import type { Trip } from "@/types/trip";
import { getTripLocations, startLocationTracking, stopLocationTracking, isLocationTracking, LocationUpdate, calculateDistance, isWithinRadius } from "@/lib/services/tripLocationTracking";
import TripHero from "@/components/trips/TripHero";
import TripHighlights from "@/components/trips/TripHighlights";
import TripTimeline from "@/components/trips/TripTimeline";
import CreateMemoryModal from "@/components/trips/CreateMemoryModal";
import { GlassButton } from "@/components/ui/glass-button";
import dynamic from "next/dynamic";

  const TripRouteMap = dynamic(
    () => import("@/components/trips/TripRouteMap"),
    { ssr: false }
  );


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
  const [editVisibility, setEditVisibility] = useState<'private' | 'friends' | 'public'>('private');
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
        setEditVisibility(found.visibility);
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
      visibility: editVisibility,
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
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="font-semibold text-slate-900 bg-transparent border-b border-[#2A7FFF] focus:outline-none max-w-[120px]"
              />
              {/* Visibility Toggle */}
              <div className="flex items-center gap-1 text-sm bg-slate-100 px-2 py-1 rounded-lg">
                <span className={`inline-block w-3 h-3 rounded-full ${
                  editVisibility === 'public' ? 'bg-emerald-400' : 
                  editVisibility === 'friends' ? 'bg-amber-400' : 'bg-slate-400'
                }`} />
                <span className="font-medium capitalize">{editVisibility}</span>
                <select 
                  value={editVisibility} 
                  onChange={(e) => setEditVisibility(e.target.value as 'private' | 'friends' | 'public')}
                  className="bg-transparent border-0 text-xs font-medium focus:outline-none"
                >
                  <option value="private">🔒 Private</option>
                  <option value="friends">👥 Friends</option>
                  <option value="public">🌐 Public</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-slate-900 truncate max-w-[150px]">{trip.title}</h1>
              {/* Visibility Badge */}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                trip.visibility === 'public' ? 'bg-emerald-100 text-emerald-800' :
                trip.visibility === 'friends' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-600'
              }`}>
                {trip.visibility === 'public' ? '🌐 Public' : 
                 trip.visibility === 'friends' ? '👥 Friends' : '🔒 Private'}
              </span>
            </div>
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
                <button onClick={() => setShowAddStop(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all font-medium text-lg">+ Add Stop</button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-2 block">Search hotspots or enter custom location</label>
                    <input 
                      type="text" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      placeholder="e.g. 'Eiffel Tower' or 'Custom location name'" 
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none bg-white" 
                      autoFocus 
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-2xl border-slate-200 bg-white shadow-sm">
                      {searchResults.map(hotspot => (
                        <button 
                          key={hotspot.id} 
                          onClick={() => handleAddStop(hotspot)} 
                          className="w-full p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 flex items-center gap-3 text-left transition-all"
                        >
                          {hotspot.images?.[0] && (
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                              <Image src={hotspot.images[0]} alt={hotspot.name} fill className="object-cover" sizes="48px" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{hotspot.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <span>{getCategoryDisplay(hotspot.category)}</span>
                              {hotspot.province && <span>• {hotspot.province}</span>}
                            </p>
                          </div>
                          <div className="text-emerald-500 text-xs font-medium">Select</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={async () => {
                        if (searchTerm.trim() && trip && user) {
                          // Add custom stop - creates hotspot-less stop for manual entry
                          await addHotspotToTrip({
                            tripId: trip.id,
                            hotspot: {
                              id: 'custom-' + Date.now(),
                              name: searchTerm.trim(),
                              category: 'custom',
                              province: '',
                              images: [],
                              latitude: 0,
                              longitude: 0,
                            } as any
                          });
                          await refreshTrip();
                          setShowAddStop(false);
                          setSearchTerm('');
                        }
                      }}
                      disabled={!searchTerm.trim()}
                      className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      ➕ Add '{searchTerm}' (Custom)
                    </button>
                    <button 
                      onClick={() => { setShowAddStop(false); setSearchTerm(''); }} 
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-2xl transition-all text-sm"
                    >
                      Cancel
                    </button>
                  </div>
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
                    <div key={stop.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={img} alt={stop.name} fill className="object-cover" sizes="80px" />
                        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#2A7FFF] text-white text-xs flex items-center justify-center font-bold shadow-lg">{index + 1}</div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-tight">{stop.name}</p>
                            <p className="text-xs text-slate-500">{stop.category} • {stop.province}</p>
                          </div>
                          <div className="flex flex-col gap-1 ml-2">
                            <button 
                              onClick={() => handleOpenMemoryModal(stop.id, stop.name, stop.hotspotId)} 
                              className="text-emerald-600 hover:text-emerald-700 text-sm p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                              title="Add photos/memory"
                            >
                              📷
                            </button>
                            <button 
                              onClick={() => handleRemoveStop(stop.id)} 
                              className="text-red-500 hover:text-red-600 text-sm p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remove stop"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        
                        {/* Note textarea */}
                        <textarea 
                          value={stop.note} 
                          onChange={(e) => handleStopNoteChange(stop.id, e.target.value)} 
                          placeholder="Add note or memory..." 
                          className="w-full text-xs p-2 bg-slate-50 rounded-lg border border-slate-200 focus:border-slate-300 focus:ring-1 focus:ring-slate-300 resize-none h-12" 
                        />
                        
                        {/* Visit date editor */}
                        <div className="flex items-center gap-2 pt-1">
                          {editingVisitedAt === stop.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={visitedAtValue}
                                onChange={(e) => setVisitedAtValue(e.target.value)}
                                className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white focus:ring-1 focus:ring-slate-300 h-8"
                              />
                              <button
                                onClick={() => handleSaveVisitedAt(stop.id)}
                                className="text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-medium transition-colors h-8"
                              >
                                ✓ Save
                              </button>
                              <button
                                onClick={() => setEditingVisitedAt(null)}
                                className="text-xs px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors h-8"
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenVisitedAtEdit(stop.id, stop.visitedAt)}
                              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 hover:underline bg-slate-100 px-3 py-1.5 rounded-md transition-colors text-left w-full"
                            >
                              {stop.visitedAt 
                                ? <span>📅 {new Date(stop.visitedAt).toLocaleDateString('en-CA')}</span>
                                : <span>➕ Add visit date</span>
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

{activeTab === "timeline" && <TripTimeline stops={sortedStopsByTime} />}

        {activeTab === "memories" && (
          <div className="space-y-4">
            <TripHighlights photos={allTripPhotos} />
            {trip.stops.map((stop, index) => {
              return (
                <div key={stop.id} className="group relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  {/* Persistent hover button in top-right */}
                  <div className="flex justify-end">
                  <GlassButton 
                    size="sm"
                    contentClassName="text-slate-800"
                    onClick={() => handleOpenMemoryModal(stop.id, stop.name, stop.hotspotId)}
                    title="Add/edit memories & photos"
                  >
                    📷
                  </GlassButton>
                  </div>

                  <div className="flex items-center gap-2 mb-3 pl-2">
                    <span className="w-7 h-7 rounded-full bg-[#2A7FFF]/10 text-[#2A7FFF] text-xs flex items-center justify-center font-semibold shadow-sm">{index + 1}</span>
                    <p className="font-semibold text-lg flex-1">{stop.name}</p>
                  </div>
                  
                  {stop.media.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                      {stop.media.slice(0, 8).map((m, photoIndex) => {
                        const isCover = trip.coverImage === m.storagePath;
                        return (
                          <div key={m.id} className="relative group/photo">
                            <div className="relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                              <Image src={m.signedUrl} alt={m.caption || ""} fill className="object-cover" />
                              {/* Photo overlay actions */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
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
                                  className={`p-2 rounded-xl text-white text-xs font-semibold shadow-lg ${isCover ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                                  title={isCover ? "Cover photo ✓" : "Set as cover"}
                                >
                                  {isCover ? '⭐ Cover' : '📷 Cover'}
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
                                  className={`p-2 rounded-xl text-white text-xs font-semibold shadow-lg ${m.isHighlight ? 'bg-amber-500 hover:bg-amber-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                                  title={m.isHighlight ? "Remove highlight" : "Add highlight"}
                                >
                                  {m.isHighlight ? '⭐ Featured' : '⭐ Feature'}
                                </button>
                              </div>
                              {/* Highlight badge */}
                              {m.isHighlight && (
                                <div className="absolute top-1 right-1 z-10">
                                  <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold shadow-md">★</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {stop.media.length > 8 && (
                        <div className="col-span-1 aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-500 font-medium hover:bg-slate-200 transition-colors">
                          +{stop.media.length - 8} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 md:h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-500 text-sm font-medium group-hover/parent:text-emerald-600 transition-colors">
                      No photos yet
                    </div>
                  )}
                  
                  {stop.note && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-sm text-slate-700 italic bg-slate-50 p-3 rounded-xl border-l-4 border-emerald-400">
                        "{stop.note}"
                      </p>
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

