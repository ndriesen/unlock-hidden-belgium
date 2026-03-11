"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Hotspot } from "@/types/hotspot";

interface HeroSectionProps {
  hotspots: Hotspot[];
}

interface GemMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  category: string;
}

export default function HeroSection({ hotspots }: HeroSectionProps) {
  const [gems, setGems] = useState<GemMarker[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug: log when hotspots change
  useEffect(() => {
    console.log("HeroSection received hotspots:", hotspots.length);
  }, [hotspots]);

  useEffect(() => {
    if (!hotspots || hotspots.length === 0) {
      // Still show the section even with no hotspots
      setGems([]);
      setIsLoaded(true);
      return;
    }

    const transformedGems: GemMarker[] = hotspots.slice(0, 12).map((hotspot, index) => {
      const phi = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (index / (12 - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * index;
      
      return {
        id: hotspot.id,
        name: hotspot.name,
        x: Math.cos(theta) * radius,
        y: y,
        z: Math.sin(theta) * radius,
        category: hotspot.category,
      };
    });
    
    setGems(transformedGems);
    setIsLoaded(true);
  }, [hotspots]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Culture: "bg-rose-500",
      Nature: "bg-emerald-500",
      Food: "bg-amber-500",
      Activity: "bg-blue-500",
      Unknown: "bg-slate-400",
    };
    return colors[category] || colors.Unknown;
  };

  const bgParallax = scrollY * 0.3;
  const textParallax = scrollY * 0.15;
  const globeParallax = scrollY * -0.1;

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900"
    >

      <div 
        className="absolute inset-0 opacity-30"
        style={{ 
          transform: `translateY(${bgParallax}px)`,
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.2) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 70%)`
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.2 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-16 pb-4">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 items-center">
          <div 
            className="text-center lg:text-left space-y-2"
            style={{
              transform: `translateY(${textParallax}px)`,
              opacity: Math.max(0, 1 - scrollY / 500),
            }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-300 text-xs font-medium">Discover Belgium's Hidden Gems</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
              Unlock
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Hidden Gems
              </span>
            </h1>
            
            <p className="text-sm text-slate-300 max-w-xl mx-auto lg:mx-0">
              Explore the best-kept secrets of Belgium.
            </p>

            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <Link 
                href="/hotspots"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
              >
                Explore Now
              </Link>
              <Link 
                href="/trips"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-300 text-sm"
              >
                Plan a Trip
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-3 pt-1">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{hotspots.length}+</p>
                <p className="text-slate-400 text-[10px]">Hidden Gems</p>
              </div>
              <div className="w-px h-6 bg-slate-600" />
              <div className="text-center">
                <p className="text-lg font-bold text-white">50+</p>
                <p className="text-slate-400 text-[10px]">Locations</p>
              </div>
              <div className="w-px h-6 bg-slate-600" />
              <div className="text-center">
                <p className="text-lg font-bold text-white">100%</p>
                <p className="text-slate-400 text-[10px]">Free</p>
              </div>
            </div>
          </div>

          <div 
            className="relative h-[180px] md:h-[220px] flex items-center justify-center"
            style={{
              transform: `translateY(${globeParallax}px)`,
            }}
          >
            <div className="relative w-[140px] h-[140px] md:w-[180px] md:h-[180px]">
              <div 
                className="absolute inset-0 rounded-full opacity-20"
                style={{
                  background: `radial-gradient(circle at 30% 30%, 
                    rgba(16, 185, 129, 0.8) 0%, 
                    rgba(5, 150, 105, 0.4) 30%, 
                    rgba(2, 64, 55, 0.8) 60%,
                    rgba(2, 64, 55, 1) 100%)`,
                  boxShadow: `inset 0 0 60px rgba(16, 185, 129, 0.3),
                              0 0 80px rgba(16, 185, 129, 0.2)`,
                }}
              />
              
              <div 
                className="absolute inset-0"
                style={{
                  animation: "rotate 20s linear infinite",
                  transformStyle: "preserve-3d",
                  perspective: "1000px",
                }}
              >
                <div 
                  className="absolute inset-0 rounded-full border border-emerald-500/20"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(16, 185, 129, 0.1) 100%)`,
                  }}
                />
                
                {isLoaded && gems.map((gem, index) => (
                  <div
                    key={gem.id}
                    className="absolute w-2 h-2 md:w-3 md:h-3"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `
                        translate3d(
                          ${gem.x * 50 + (index % 3) * 4}px,
                          ${gem.y * 50 + Math.floor(index / 3) * 4}px,
                          ${gem.z * 20}px
                        )
                      `,
                      animation: `pulse-gem ${2 + (index % 3) * 0.5}s ease-in-out infinite`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                  >
                    <div className={`w-full h-full rounded-full ${getCategoryColor(gem.category)} 
                      shadow-lg cursor-pointer transform hover:scale-150 transition-transform duration-300
                      flex items-center justify-center`}>
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap 
                      text-[2px] text-slate-300 opacity-0 hover:opacity-100 transition-opacity">
                      {gem.name}
                    </div>
                  </div>
                ))}
              </div>

              <div 
                className="absolute top-1/2 left-1/2 w-6 h-10 bg-amber-400/30 rounded-full blur-xl"
                style={{
                  transform: "translate(-50%, -50%)",
                  animation: "glow 3s ease-in-out infinite",
                }}
              />
            </div>

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-6 border border-emerald-500/10 rounded-full animate-spin" 
                style={{ animationDuration: "30s" }} />
              <div className="absolute inset-12 border border-teal-500/10 rounded-full animate-spin"
                style={{ animationDuration: "25s", animationDirection: "reverse" }} />
            </div>
          </div>
        </div>
      </div>

      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{
          opacity: Math.max(0, 1 - scrollY / 150),
        }}
      >
        <span className="text-slate-400 text-xs">Scroll to explore</span>
        <div className="w-5 h-8 border-2 border-slate-500 rounded-full flex justify-center pt-1.5">
          <div className="w-1 h-1.5 bg-slate-400 rounded-full animate-bounce" />
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes rotate {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        @keyframes pulse-gem {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.9); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </section>
  );
}

