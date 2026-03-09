"use client";

import { useState, useRef } from "react";
import { MediaVisibility } from "@/lib/services/media";

interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stopId: string;
  stopName: string;
}

export default function CreateMemoryModal({ isOpen, onClose, stopId, stopName }: CreateMemoryModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<MediaVisibility>("friends");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // TODO: Implement actual submission to trip_memories / memory_media tables
    // For now, just simulate a delay and close
    setTimeout(() => {
      setIsSubmitting(false);
      setFiles([]);
      setCaption("");
      setVisibility("friends");
      onClose();
    }, 1000);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Memory</h2>
              <p className="text-sm text-slate-600">at {stopName}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Photos</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
              />
              
              {files.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {files.map((file, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-emerald-600 font-medium"
                  >
                    + Add more photos
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition flex flex-col items-center gap-2"
                >
                  <span className="text-3xl">📷</span>
                  <span className="text-sm">Click to upload photos</span>
                </button>
              )}
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write about your experience..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Visibility</label>
              <div className="flex gap-2">
                {(["private", "friends", "public"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setVisibility(option)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize ${
                      visibility === option
                        ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={files.length === 0 || isSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Posting..." : "Post Memory"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

