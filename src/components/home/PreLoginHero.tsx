"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Map, Compass, Users, ArrowRight, Sparkles } from "lucide-react";

interface PreLoginHeroProps {
  hotspotCount?: number;
  explorerCount?: number;
}

interface FloatingGem {
  id: number;
  x: number;
  y: number;
  delay: number;
  size: number;
}

export default function PreLoginHero({ 
  hotspotCount = 150, 
  explorerCount = 12000 
}: PreLoginHeroProps) {
  const [scrollY, setScrollY] = useState(0);
  const [floatingGems, setFloatingGems] = useState<FloatingGem[]>([]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    { name: "Emma L.", text: "Found the most amazing hidden chapel!" },
    { name: "Thomas V.", text: "Best way to explore Belgium's secrets." },
    { name: "Sophie M.", text: "Discovered spots I never knew existed." },
  ];

  useEffect(() => {
    // Generate floating gem positions
    const gems: FloatingGem[] = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      size: 8 + Math.random() * 12,
    }));
    setFloatingGems(gems);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const parallaxOffset = scrollY * 0.3;

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden min-h-[60vh] md:min-h-[70vh] flex flex-col"
      style={{ 
        background: `linear-gradient(135deg, 
          #0f172a 0%, 
          #1e3a5f 50%, 
          #134e4a 100%)`
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Gems */}
        {floatingGems.map((gem) => (
          <div
            key={gem.id}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              left: `${gem.x}%`,
              top: `${gem.y}%`,
              width: gem.size,
              height: gem.size,
              background: `radial-gradient(circle at 30% 30%, 
                rgba(16, 185, 129, 0.8) 0%, 
                rgba(5, 150, 105, 0.4) 100%)`,
              animationDelay: `${gem.delay}s`,
              transform: `translateY(${parallaxOffset * (gem.y / 100)}px)`,
            }}
          />
        ))}
        
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-200 text-sm font-medium">
              Discover Belgium's Best-Kept Secrets
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Unlock 
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Hidden Gems
            </span>
          </h1>

          {/* Value Proposition Subline */}
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Find unique spots, plan adventures, and share stories with fellow explorers.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/hotspots"
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:scale-105 active:scale-95 min-h-[56px]"
            >
              <Compass className="w-5 h-5" />
              Explore Map
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 transition-all duration-300 backdrop-blur-sm min-h-[56px]"
            >
              Get Started
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="flex items-center justify-center gap-6 pt-6 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Map className="w-4 h-4" />
              <span>{hotspotCount}+ Hidden Gems</span>
            </div>
            <div className="w-px h-4 bg-slate-600" />
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4" />
              <span>{explorerCount.toLocaleString()}+ Explorers</span>
            </div>
          </div>

          {/* Rotating Testimonial */}
          <div className="pt-6 max-w-xl mx-auto">
            <div className="relative h-16 overflow-hidden">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                    index === testimonialIndex
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <p className="text-slate-300 italic text-sm md:text-base">
                    "{testimonial.text}" — <span className="text-emerald-400 font-medium">{testimonial.name}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-slate-400 text-xs">Scroll to learn more</span>
          <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-2.5 bg-slate-400 rounded-full" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) scale(1); 
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-20px) scale(1.1); 
            opacity: 0.4;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

