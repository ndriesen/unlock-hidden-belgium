"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { fetchTrips, addHotspotToTrip, createTrip, Trip } from "@/lib/services/tripBuilder";
import { Hotspot, getCategoryDisplay } from "@/types/hotspot";

interface TripSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotspot: Hotspot | null;
  onSuccess?: () => void;
}

export default function TripSelectorModal({
  isOpen,
  onClose,
  hotspot,
  onSuccess,
}: TripSelectorModalProps) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const loadTrips = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const loaded = await fetchTrips(user.id);
    setTrips(loaded);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadTrips();
      setShowCreateNew(false);
      setNewTripTitle("");
      setMessage("");
    }
  }, [isOpen, user?.id, loadTrips]);

  const handleAddToTrip = async (tripId: string) => {
    if (!hotspot || !user) return;
    setAdding(tripId);
    setMessage("");

    try {
      await addHotspotToTrip({ tripId, hotspot });
      setMessage(`Added to "${trips.find(t => t.id === tripId)?.title}"`);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      setMessage("Failed to add. Try again.");
    } finally {
      setAdding(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!hotspot || !user || !newTripTitle.trim()) return;
    setCreating(true);
    setMessage("");

    try {
      const newTrip = await createTrip({
        userId: user.id,
        title: newTripTitle.trim(),
        visibility: "private",
      });

      if (newTrip) {
        await addHotspotToTrip({ tripId: newTrip.id, hotspot });
        setMessage(`Created "${newTripTitle}" and added hotspot`);
        onSuccess?.();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage("Failed to create trip.");
      }
    } catch (error) {
      setMessage("Failed to create trip.");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  const getTripCover = (trip: Trip): string => {
    // Only use coverImage if it's a valid URL
    if (trip.coverImage && trip.coverImage.startsWith('http')) {
      return trip.coverImage;
    }
    // Check stop photoUrl
    if (trip.stops[0]?.photoUrl) {
      return trip.stops[0].photoUrl;
    }
    return "https://images.unsplash.com/photo-1469474968028-56623f02e42e";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Add to Trip</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Hotspot Info */}
        {hotspot && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <p className="font-medium text-slate-900">{hotspot.name}</p>
{getCategoryDisplay(hotspot.category)} • {hotspot.province}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading trips...</div>
          ) : trips.length === 0 && !showCreateNew ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No trips yet</p>
              <button
                onClick={() => setShowCreateNew(true)}
                className="px-4 py-2 bg-[#2A7FFF] text-white rounded-lg font-medium"
              >
                Create your first trip
              </button>
            </div>
          ) : (
            <>
              {/* Trip List */}
              <div className="space-y-2 mb-4">
                {trips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => handleAddToTrip(trip.id)}
                    disabled={adding !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#2A7FFF] hover:bg-slate-50 transition-all text-left disabled:opacity-50"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={getTripCover(trip)}
                        alt={trip.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{trip.title}</p>
                      <p className="text-sm text-slate-500">{trip.stops.length} stops</p>
                    </div>
                    {adding === trip.id && (
                      <div className="w-5 h-5 border-2 border-[#2A7FFF] border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                ))}
              </div>

              {/* Create New Trip */}
              {showCreateNew ? (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <input
                    type="text"
                    value={newTripTitle}
                    onChange={(e) => setNewTripTitle(e.target.value)}
                    placeholder="New trip name..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2A7FFF] focus:border-transparent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateNew(false)}
                      className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateAndAdd}
                      disabled={creating || !newTripTitle.trim()}
                      className="flex-1 py-2 bg-[#2A7FFF] text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Create & Add"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateNew(true)}
                  className="w-full py-2 text-[#2A7FFF] font-medium text-sm"
                >
                  + Create new trip
                </button>
              )}
            </>
          )}

          {/* Message */}
          {message && (
            <p className={`mt-3 text-sm text-center ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

