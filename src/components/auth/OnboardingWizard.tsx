"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, Users, User, Globe, ArrowRight, AlertCircle } from 'lucide-react';
import { UserProfile, ExplorationStyle } from '@/types/user';

const INTERESTS: string[] = [
  'Hidden cafés',
  'Viewpoints',
  'Nature spots',
  'Street art',
  'Architecture',
  'Nightlife',
  'Photography spots',
  'Abandoned places',
  'Local food',
  'Secret bars'
];

interface OnboardingWizardProps {
  onComplete: (data: Pick<UserProfile, 'interests' | 'exploration_style' | 'city'>) => Promise<void>;
  onSkip?: () => void;
  userId: string;
}

export default function OnboardingWizard({ onComplete, onSkip, userId }: OnboardingWizardProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [explorationStyle, setExplorationStyle] = useState<ExplorationStyle>('solo');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');

  const getProgressWidth = () => {
    switch (activeStep) {
      case 1: return '33%';
      case 2: return '66%';
      case 3: return '100%';
    }
  };

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest].slice(0,5)
    );
  };

  const handleGeoLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setGeoLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await response.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || 'Unknown City';
          setCity(cityName);
          setError('');
        } catch {
          setCity('');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setError('Location access denied. Enter manually.');
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const handleNext = async () => {
    switch (activeStep) {
      case 1:
        if (interests.length === 0) {
          setError('Select at least one interest');
          return;
        }
        setActiveStep(2);
        setError('');
        return;
      case 2:
        setActiveStep(3);
        setError('');
        return;
      case 3:
        if (!city.trim()) {
          setError('City is required');
          return;
        }
        break;
    }

    setLoading(true);
    setError('');

    try {
      await onComplete({
        interests,
        exploration_style: explorationStyle,
        city: city.trim(),
      });
    } catch (e) {
      setError('Failed to save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <div className="w-full max-w-md p-6 space-y-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-6">Welcome Explorer!</h1>

      {/* Progress */}
      <div className="space-y-2">
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: getProgressWidth() }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Interests</span>
          <span>Style</span>
          <span>City</span>
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        {activeStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">What do you like discovering?</h2>
              <p className="text-slate-600 dark:text-slate-400">Select your interests</p>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-3 p-2">
              {INTERESTS.map((interest) => (
                <motion.button
                  key={interest}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleInterestToggle(interest)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    interests.includes(interest)
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-200'
                  }`}
                >
                  {interests.includes(interest) && (
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                  <span className="font-medium">{interest}</span>
                </motion.button>
              ))}
            </div>
            {interests.length >= 5 && (
              <p className="text-sm text-emerald-600">
                {interests.length} / 5 interests selected
              </p>
            )}
          </motion.div>
        )}

        {activeStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 text-center"
          >
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 dark:bg-teal-900/50 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your exploration style</h2>
              <p className="text-slate-600 dark:text-slate-400">How do you prefer to explore?</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'solo' as ExplorationStyle, label: 'Solo explorer', icon: '🧭', desc: 'Independent adventures' },
                { value: 'friends' as ExplorationStyle, label: 'Explore with friends', icon: '👫', desc: 'With buddies' },
                { value: 'meet_new' as ExplorationStyle, label: 'Meet new explorers', icon: '🤝', desc: 'Find companions' },
              ].map(({ value, label, icon, desc }) => (
                <motion.button
                  key={value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExplorationStyle(value)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                    explorationStyle === value
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-teal-200'
                  }`}
                >
                  <span className="text-2xl mt-1 flex-shrink-0">{icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {activeStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirm your city</h2>
              <p className="text-slate-600 dark:text-slate-400">We'll use this for local recommendations</p>
            </div>
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleGeoLocation}
                disabled={geoLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {geoLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5" />
                    Use my location
                  </>
                )}
              </motion.button>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Brussels, Antwerp..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {error && (
              <p className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSkip}
          disabled={loading}
          className="flex-1 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
        >
          Skip for now
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={loading || geoLoading}
          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? 'Saving...' : activeStep === 3 ? 'Complete Onboarding' : 'Next'}
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Summary */}
      <div className="text-xs text-slate-500 text-center">
        {interests.length} interests • {explorationStyle} • {city || 'City'}
      </div>
    </div>
  );
}

