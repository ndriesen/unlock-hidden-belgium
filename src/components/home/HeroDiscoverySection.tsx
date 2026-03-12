"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Map, Sparkles } from "lucide-react";
import { Hotspot } from "@/types/hotspot";

interface HeroDiscoverySectionProps {
  hotspots: Hotspot[];
  user?: any;
  onSurpriseMe?: () => void;
}

export default function HeroDiscoverySection({ 
  hotspots, 
  user,
  onSurpriseMe 
}: HeroDiscoverySectionProps) {
  const router = useRouter();

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Explorer';

  const handleSurpriseAdventure = () => {
    onSurpriseMe?.();
  };

  const handleExploreMap = () => {
    router.push("/hotspots");
  };

  return (
    <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
      {/* Adventure-themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-900">
        {/* Subtle map visualization overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-amber-400/20 rounded-full blur-xl animate-bounce" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-white/40 rounded-full animate-ping" />
        <div className="absolute top-1/2 left-20 w-1.5 h-1.5 bg-emerald-300/70 rounded-full animate-pulse" />
        <div className="absolute bottom-32 right-16 w-3 h-3 bg-amber-300/60 rounded-full animate-bounce slow-bounce" />
      </div>

      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center text-white pt-16 md:pt-24 pb-12">
        <div className="max-w-2xl mx-auto space-y-6">
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Hi <span className="text-emerald-400">{name}</span>, ready for your next
            <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg">
              adventure?
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-200/90 max-w-md mx-auto leading-relaxed">
            Discover hidden gems near you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <button
              onClick={handleExploreMap}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.97] text-lg min-h-[56px]"
            >
              <Map className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Explore Map
            </button>

            <button
              onClick={handleSurpriseAdventure}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.97] text-lg min-h-[56px] relative overflow-hidden"
            >
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-all animate-sparkle" />
              Surprise Adventure
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

