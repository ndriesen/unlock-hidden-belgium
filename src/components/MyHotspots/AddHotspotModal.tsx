"use client";

import { useState, useEffect, useRef } from "react";
import { Hotspot } from "@/types/hotspot";
import { addHotspot } from "@/lib/services/addHotspot";
import { awardXP } from "@/lib/services/gamification";
import { useAuth } from "@/context/AuthContext";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface AddHotspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (hotspot: Hotspot) => void;
}

export default function AddHotspotModal({ isOpen, onClose, onAdded }: AddHotspotModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared">("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setCategory("");
      setProvince("");
      setDescription("");
      setImageUrl("");
      setLatitude("");
      setLongitude("");
      setVisibility("private");
      setError("");
      setSuccessMessage("");
      setIsPending(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user) {
      setError("You must be logged in to add a hotspot");
      return;
    }
    if (!name.trim() || !category.trim()) {
      setError("Name and category are required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const parsedLat = latitude ? parseFloat(latitude) : undefined;
      const parsedLng = longitude ? parseFloat(longitude) : undefined;

      const result = await addHotspot({
        userId: user.id,
        name: name.trim(),
        category: category.trim(),
        province: province.trim() || undefined,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        latitude: parsedLat,
        longitude: parsedLng,
        visibility,
      });

      // Award XP for adding hotspot
      await awardXP(user.id, 'xp_adding_hotspot');

      // Show appropriate feedback
      if (result.approved) {
        setSuccessMessage("✅ Your hotspot was added and is live!");
        setTimeout(() => {
          onAdded({
            id: result.id,
            name: result.name,
            category: result.category,
            province: result.province,
            latitude: result.latitude,
            longitude: result.longitude,
            description: result.description,
            images: result.images,
          });
          onClose();
        }, 1500);
      } else {
        setIsPending(true);
        setSuccessMessage("⏳ Your hotspot is pending review by an admin.");
        // Still add to user's list but mark as pending
        onAdded({
          id: result.id,
          name: result.name,
          category: result.category,
          province: result.province,
          latitude: result.latitude,
          longitude: result.longitude,
          description: result.description,
          images: result.images,
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError("Could not add hotspot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 mx-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Add a Hotspot</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className={`p-3 rounded-lg border ${isPending ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
            <p className={`text-sm ${isPending ? "text-amber-700" : "text-green-700"}`}>{successMessage}</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hotspot name"
              className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Cafe, Museum, Viewpoint"
              className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Province / Location</label>
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Brussels, Antwerp"
              className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this place special?"
              rows={3}
              className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {imageUrl && (
              <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden bg-slate-100">
                <OptimizedImage
                  src={imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  fallbackUrl="/branding/spotly-logo.svg"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="50.85"
                className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="4.35"
                className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">Optional: Leave empty for automatic geocoding via OpenStreetMap</p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${visibility === "private" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Private
              </button>
              <button
                type="button"
                onClick={() => setVisibility("shared")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${visibility === "shared" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Hotspot"}
          </button>
        </div>
      </div>
    </div>
  );
}
