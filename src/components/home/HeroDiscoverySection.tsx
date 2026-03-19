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
    <section className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-[55vh] overflow-hidden">
      {/* Adventure-themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900/90 to-indigo-900 rounded-lg">
        {/* Subtle map visualization overlay - reduced intensity for mobile */}
        <div className="absolute inset-0 opacity-30 sm:opacity-35">
          <div className="absolute top-16 left-8 w-24 h-24 bg-white/20 rounded-full blur-lg sm:blur-xl" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-emerald-400/30 rounded-full blur-xl sm:blur-2xl animate-pulse" />
          <div className="absolute bottom-16 right-8 w-20 h-20 bg-amber-400/30 rounded-full blur-lg sm:blur-xl animate-bounce [animation-delay:1s]" />
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl sm:blur-2xl" />
        </div>
      </div>

      {/* Floating elements - mobile optimized positions */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-16 left-8 w-2 h-2 bg-white/50 rounded-full animate-ping" />
        <div className="absolute top-1/2 left-12 w-1.5 h-1.5 bg-emerald-300/80 rounded-full animate-pulse [animation-delay:0.5s]" />
        <div className="absolute bottom-20 right-8 w-2.5 h-2.5 bg-amber-300/70 rounded-full animate-bounce [animation-delay:1.5s]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center text-white py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="max-w-xl sm:max-w-2xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Hi <span className="text-emerald-400 drop-shadow-md">{name}</span>, ready for your next
            <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg sm:drop-shadow-xl">
              adventure?
            </span>
          </h1>

<p className="text-sm sm:text-md md:text-lg italic text-white/95 max-w-md mx-auto leading-relaxed font-medium">
            Discover hidden gems near you, curated for true explorers.
          </p>

          {/* Visual cue pointing down to trending section */}
          <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/60 w-6 h-8 drop-shadow-lg">
              <path d="M3 10L12 20L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
            <button
              onClick={handleExploreMap}
              className="group flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:shadow-white/20 hover:-translate-y-1 transition-all duration-300 active:scale-[0.97] text-base sm:text-lg min-h-[52px] sm:min-h-[56px]"
            >
              <Map className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              Explore Map
            </button>

            <button
              onClick={handleSurpriseAdventure}
              className="group flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-emerald-500/30 hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.97] text-base sm:text-lg min-h-[52px] sm:min-h-[56px] relative overflow-hidden"
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-all duration-500" />
              Surprise Me
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

