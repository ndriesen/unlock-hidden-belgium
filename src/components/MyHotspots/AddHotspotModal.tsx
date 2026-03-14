"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/Supabase/browser-client";
import Fuse from "fuse.js";
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
  const [categories, setCategories] = useState<string[]>([]);
  const [isOpenCombo, setIsOpenCombo] = useState(false);
  const [comboSearch, setComboSearch] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);
  const fuseRef = useRef<Fuse<string> | null>(null);

  // Fetch categories on open
  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const { data } = await supabase
            .from('hotspots')
            .select('category')
            .not('category', 'is', null)
            .not('category', 'eq', '')
            .limit(100);
          if (data) {
            const unique = Array.from(new Set(data.map((item: any) => item.category).filter(Boolean)));
            setCategories(unique);
            if (unique.length > 0) {
              fuseRef.current = new Fuse(unique, {
                threshold: 0.4,
                keys: ['item']
              });
            }
          }
        } catch (e) {
          console.error('Failed to fetch categories:', e);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setIsOpenCombo(false);
      }
    };
    if (isOpenCombo) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpenCombo]);

  const filteredCategories = useMemo(() => {
    if (!comboSearch || !fuseRef.current) return categories;
    return fuseRef.current.search(comboSearch).map((r: any) => r.item);
  }, [comboSearch, categories]);

  const showDropdown = isOpenCombo && filteredCategories.length > 0;

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

      // XP already triggered in addHotspot service

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
            <div ref={comboRef} className="relative">
              <input
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setComboSearch(e.target.value);
                  setIsOpenCombo(true);
                }}
                onFocus={() => setIsOpenCombo(true)}
                placeholder="Cafe, Museum, Viewpoint, or type new..."
                className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-8"
              />
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredCategories.slice(0, 10).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setComboSearch('');
                        setIsOpenCombo(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-900 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                  fallbackUrl="/images/placeholder-image.jfif"
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
