"use client";

import { useState, useCallback } from 'react';
import PremiumTripMap from './PremiumTripMap';
import TripStopDetail from './TripStopDetail';
import MapControls from './MapControls';
import { useTripData } from '@/hooks/useTripData';
import type { TripStop } from '@/types/trip';

export default function NewTripsPage() {
  const [selectedStop, setSelectedStop] = useState<TripStop | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const { currentTrip, loading } = useTripData();

  const totalSteps = currentTrip?.stops.length || 0;

  const handleStopSelect = useCallback((stop: TripStop | null) => {
    setSelectedStop(stop);
    if (stop) {
      const stepIndex = currentTrip?.stops.findIndex(s => s.id === stop.id) || 0;
      setCurrentStep(stepIndex);
    }
  }, [currentTrip]);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    setIsPlaying(false);
    // Fly to stop (map instance needed)
    const stop = currentTrip?.stops[step];
    if (stop && mapInstance) {
      mapInstance.flyTo({
        center: [stop.lng, stop.lat],
        zoom: 14,
        duration: 1000
      });
    }
  }, [currentTrip, mapInstance]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // TODO: Animate through steps
  };

  const closePanel = useCallback(() => {
    setSelectedStop(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Discovering your journey</h2>
          <p className="text-slate-400">Loading premium travel map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      <PremiumTripMap 
        onStopSelect={handleStopSelect}
        className="w-full h-full"
      />
      
      <MapControls 
        map={mapInstance}
        currentTrip={currentTrip}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepChange={handleStepChange}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
      />

      <TripStopDetail 
        stop={selectedStop}
        onClose={closePanel}
      />
    </div>
  );
}

