"use client";

interface ExplorerProgressPanelProps {
  visitedCount: number;
  wishlistCount: number;
  streak: number;
}

export default function ExplorerProgressPanel({ 
  visitedCount, 
  wishlistCount, 
  streak 
}: ExplorerProgressPanelProps) {
  return (
    <section className="py-8 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-5 h-5 bg-white/20 rounded-lg animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            🔥 Your explorer progress
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md">
          {/* Visited Spots */}
          <div className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-xl transition-all duration-300 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <div className="w-6 h-6 bg-emerald-600 rounded-lg shadow-md" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Visited</p>
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">{visitedCount}</p>
            <p className="text-sm text-slate-500 mt-1">Spots discovered</p>
          </div>

          {/* Wishlist */}
          <div className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-rose-200 hover:shadow-xl transition-all duration-300 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                <div className="w-5 h-5 text-rose-500 animate-heart-bounce" style={{ fontVariationSettings: '"FILL" 1' }}>♡</div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Wishlist</p>
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">{wishlistCount}</p>
            <p className="text-sm text-slate-500 mt-1">Adventure dreams</p>
          </div>

          {/* Streak */}
          <div className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-orange-200 hover:shadow-xl transition-all duration-300 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-amber-500 rounded-lg shadow-md animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Streak</p>
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">{streak}</p>
            <p className="text-sm text-slate-500 mt-1">days exploring</p>
          </div>
        </div>
      </div>
    </section>
  );
}
