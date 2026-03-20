"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/Supabase/browser-client";
import Fuse from "fuse.js";
import { Hotspot } from "@/types/hotspot";
import { addHotspot } from "@/lib/services/addHotspot";
import { awardXP } from "@/lib/services/gamification";
import { useAuth } from "@/context/AuthContext";
import OptimizedImage from "@/components/ui/OptimizedImage";
import MapPickerModal from './MapPickerModal'; 

interface AddHotspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (hotspot: Hotspot) => void;
}

export default function AddHotspotModal({ isOpen, onClose, onAdded }: AddHotspotModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState(""); 
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | undefined>();
  const [selectedLng, setSelectedLng] = useState<number | undefined>(); 
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [photoVisibility, setPhotoVisibility] = useState<'private' | 'shared'>('shared');
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [latitude, setLatitude] = useState(""); 
  const [longitude, setLongitude] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared">("shared");
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
      setAddress("");
      setShowMapPicker(false);
      setSelectedLat(undefined);
      setSelectedLng(undefined);
      setDescription("");
      setFiles([]);
      setCaption("");
      setPhotoVisibility('shared');
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
      const result = await addHotspot({
        userId: user.id,
        name: name.trim(),
        category: category.trim(),
        province: address.trim() || undefined,
        description: description.trim() || undefined,
        // imageUrl: imageUrl.trim() || undefined, // Removed stale
        latitude: selectedLat,
        longitude: selectedLng,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      
    >
      
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
       <div className="overflow-y-auto p-6 space-y-4 flex-1" style={{WebkitOverflowScrolling: "touch"}}>
        <div className="flex items-center justify-between sticky top-0 bg-white z-10">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Address / Location</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Grand Place, Brussels or update via map"
              className="w-full border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {selectedLat && selectedLng && (
              <p className="mt-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                📍 {selectedLat.toFixed(4)}, {selectedLng.toFixed(4)} selected
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mt-1"
            >
              🗺️ Set location on map
            </button>
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
            <label className="block text-sm font-semibold text-slate-700 mb-3">📸 Photos <span className="text-emerald-600">(Optional)</span></label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                multiple
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(Array.from(e.target.files));
                  }
                }}
                className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-20 object-cover rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {files.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">{files.length} photo{files.length !== 1 ? 's' : ''} selected</p>
              )}
            </div>
          </div>

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

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
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
      <MapPickerModal 
        isOpen={showMapPicker} 
        onClose={() => setShowMapPicker(false)} 
        onConfirm={(lat, lng, addr) => {
          setAddress(addr);
          setSelectedLat(lat);
          setSelectedLng(lng);
          setShowMapPicker(false);
        }} 
      />
    </div>
  );
}
