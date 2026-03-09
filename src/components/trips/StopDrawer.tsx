"use client";

import Image from "next/image";

interface StopDrawerProps {
  stop: {
    id: string;
    name: string;
    category: string;
    province: string;
    note: string;
    media: { id: string; signedUrl: string; caption: string }[];
  };
  onClose: () => void;
  onAddMemory: () => void;
}

export default function StopDrawer({ stop, onClose, onAddMemory }: StopDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-2xl shadow-xl z-50 overflow-hidden">
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{stop.name}</h3>
              <p className="text-sm text-slate-600">{stop.category} • {stop.province}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100"
            >
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Photos */}
          {stop.media.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {stop.media.slice(0, 6).map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <Image
                    src={photo.signedUrl}
                    alt={photo.caption || stop.name}
                    fill
                    loading="lazy"
                    className="object-cover"
                    sizes="150px"
                  />
                </div>
              ))}
              {stop.media.length > 6 && (
                <div className="relative aspect-square rounded-lg bg-slate-100 flex items-center justify-center">
                  <span className="text-sm text-slate-500">+{stop.media.length - 6} more</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-600 mb-3">No photos yet for this stop.</p>
              <button
                onClick={onAddMemory}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
              >
                📸 Add your photo
              </button>
            </div>
          )}

          {/* Community photos CTA */}
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-700 mb-2">See what other travelers have captured</p>
            <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">
              View community photos →
            </button>
          </div>

          {/* Note */}
          {stop.note && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500 uppercase mb-1">Your note</p>
              <p className="text-sm text-slate-700">{stop.note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onAddMemory}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
            >
              📸 Add memory
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

