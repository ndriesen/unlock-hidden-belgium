"use client";

import Link from "next/link";

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
            🔥
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Your explorer progress
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Visited - Circular Progress */}
          <Link 
            href="/hotspots/my?filter=visited"
            className="group flex flex-col h-full p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 hover:shadow-2xl transition-all duration-500 cursor-pointer no-underline text-inherit"
          >
            <div className="relative z-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Visited</p>
                </div>
              </div>
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="stroke-emerald-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="stroke-emerald-500" strokeLinecap="round" strokeWidth="3" fill="none" strokeDasharray="50, 50" strokeDashoffset="0" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{ strokeDashoffset: Math.max(0, 50 - (visitedCount / 50 * 50)) }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-2xl font-bold text-slate-900">{visitedCount}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium text-center">Hidden gems discovered</p>
            </div>
          </Link>
          

          {/* Wishlist */}
          <Link 
            href="/hotspots/my?filter=wishlist"
            className="group flex flex-col h-full p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 hover:shadow-2xl transition-all duration-500 cursor-pointer no-underline text-inherit"
          >
            <div className="relative z-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                  <div className="w-7 h-7 text-white" style={{ fontVariationSettings: '"FILL" 1' }}>♡</div>
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-700 uppercase tracking-wider">Wishlist</p>
                </div>
              </div>
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="stroke-rose-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="stroke-rose-500" strokeLinecap="round" strokeWidth="3" fill="none" strokeDasharray="50, 50" strokeDashoffset="0" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{ strokeDashoffset: Math.max(0, 50 - (wishlistCount / 50 * 50)) }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-2xl font-bold text-slate-900">{wishlistCount}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium text-center">Adventure dreams</p>
            </div>
          </Link>
          

          {/* Streak */}
          <Link 
            href="/hotspots/my"
            className="group flex flex-col h-full p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 hover:shadow-2xl transition-all duration-500 cursor-pointer no-underline text-inherit"
          >
            <div className="relative z-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                  <div className="w-6 h-6 bg-white/30 rounded-lg animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-700 uppercase tracking-wider">Streak</p>
                </div>
              </div>
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="stroke-orange-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="stroke-orange-500" strokeLinecap="round" strokeWidth="3" fill="none" strokeDasharray="50, 50" strokeDashoffset="0" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{ strokeDashoffset: Math.max(0, 50 - (streak / 50 * 50)) }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-2xl font-bold text-slate-900">{streak}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium text-center">Consecutive exploring days</p>
            </div>
          </Link>
          
        </div>
      </div>
    </section>
  );
}
