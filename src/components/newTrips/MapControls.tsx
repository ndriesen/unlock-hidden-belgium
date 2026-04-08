"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, MapPin, Globe, Star } from 'lucide-react';
import { motion } from 'framer-motion';
// GeocoderControl import removed - optional feature
// import GeocoderControl from 'maplibre-gl-geocoder';
import type { Map } from 'maplibre-gl';
import type { Trip } from '@/types/trip';

interface Props {
  map?: Map | null;
  currentTrip?: Trip | null;
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export default function MapControls({
  map,
  currentTrip,
  currentStep,
  totalSteps,
  onStepChange,
  isPlaying,
  onPlayPause
}: Props) {
  const [legendOpen, setLegendOpen] = useState(false);

  const handleGeocoderLoad = (control: any) => {
    if (map) {
      map.addControl(control);
    }
  };

  return (
    <>
      {/* Top Navbar */}
      <motion.div 
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-slate-700/50 w-80 max-w-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-lg truncate">{currentTrip?.title || 'My Journey'}</h1>
              <p className="text-slate-400 text-xs">{totalSteps} stops</p>
            </div>
          </div>
        </div>

        {/* Journey Stepper */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <button 
              onClick={() => setLegendOpen(!legendOpen)}
              className="p-2 hover:bg-slate-800/50 rounded-xl transition-all flex items-center gap-1 text-xs"
            >
              <Star className="w-3 h-3" />
              Legend
            </button>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.button
                key={i}
                onClick={() => onStepChange(i)}
                className={`w-2 h-2 rounded-full transition-all shadow-md ${
                  i <= currentStep 
                    ? 'bg-indigo-400 shadow-indigo-500/50 scale-125' 
                    : 'bg-slate-600 hover:bg-slate-500 hover:scale-110'
                }`}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          {/* Play Controls */}
          <div className="flex items-center gap-2 pt-1">
            <button 
              onClick={() => onStepChange(currentStep - 1)}
              disabled={currentStep === 0}
              className="p-2 hover:bg-slate-800/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <motion.button 
              onClick={onPlayPause}
              className="flex-1 p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-medium text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 rotate-0" />}
              {isPlaying ? 'Pause Journey' : 'Play Journey'}
            </motion.button>
            <button 
              onClick={() => onStepChange(currentStep + 1)}
              disabled={currentStep === totalSteps - 1}
              className="p-2 hover:bg-slate-800/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {legendOpen && (
          <motion.div 
            className="mt-4 pt-4 border-t border-slate-800"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full shadow-md" />
                <span className="text-slate-300">Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-indigo-400 bg-indigo-500/20 rounded-full" />
                <span className="text-slate-300">Upcoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-orange-400 rounded-full bg-gradient-to-r from-orange-400/30 to-yellow-400/30" />
                <span className="text-slate-300">Wishlist</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Geocoder placeholder */}
      <div className="absolute top-4 left-4 z-40 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3 border border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <MapPin className="w-4 h-4" />
          <span>Geocoder ready (install maplibre-gl-geocoder)</span>
        </div>
      </div>
    </>
  );
}
