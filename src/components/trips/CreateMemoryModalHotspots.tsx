"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/Supabase/browser-client";
import { GlassButton } from "@/components/ui/glass-button";

export type MediaVisibility = "public" | "friends" | "private";

interface Props {
  hotspotId: string;
  hotspotName: string;
  userId: string;
  onUploaded: () => void;
  onClose: () => void;
}

export const CreateMemoryModalHotspot: React.FC<Props> = ({
  hotspotId,
  hotspotName,
  userId,
  onUploaded,
  onClose,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<MediaVisibility>("public");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload functie
  const uploadHotspotPhoto = async (file: File) => {
    try {
      const bucket = "spotly-media";
      const path = `${userId}/hotspots/${hotspotId}/${Date.now()}_${file.name}`;

      // Upload naar Supabase Storage
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
      if (uploadError) throw uploadError;

      // Signed URL ophalen (1 uur geldig)
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60);
      if (signedError) throw signedError;

      return { success: true, url: signedData.signedUrl };
    } catch (err) {
      console.error(err);
      return { success: false, message: (err as Error).message };
    }
  };

  const handleUpload = async () => {
    if (!files.length) {
      setMessage("Select at least one file first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Alle foto's parallel uploaden
      const results = await Promise.all(files.map(uploadHotspotPhoto));

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        setMessage(`Error uploading ${failed.length} file(s).`);
      } else {
        setMessage("All photos uploaded successfully!");
        setFiles([]);
        setCaption("");
        onUploaded();
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Add Memories / Photos
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5 text-slate-500 dark:text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1" style={{ WebkitOverflowScrolling: "touch" }}>
          {message && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-700">{message}</p>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">📸 Photos</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && setFiles([...files, ...Array.from(e.target.files)])}
              className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-slate-100"
            />
            {files.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {files.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
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

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Caption
            </label>
            <input
              type="text"
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Visibility</label>
            <div className="flex gap-3">
              {["public", "friends", "private"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setVisibility(option as MediaVisibility)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    visibility === option
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <GlassButton onClick={onClose} color="secondary">
            Cancel
          </GlassButton>
          <GlassButton onClick={handleUpload} disabled={loading} color="primary">
            {loading ? "Uploading..." : "Upload"}
          </GlassButton>
        </div>
      </div>
    </div>
  );
};