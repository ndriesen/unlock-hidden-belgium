"use client";

interface EmptyMemoriesProps {
  onAddMemory: () => void;
}

export default function EmptyMemories({ onAddMemory }: EmptyMemoriesProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <span className="text-3xl">📸</span>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        You haven't added memories yet
      </h3>
      
      <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
        Start documenting your adventure by adding photos and notes to your trip stops.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onAddMemory}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
        >
          📸 Add memory
        </button>
        
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition">
          👀 See community photos
        </button>
      </div>
    </div>
  );
}

