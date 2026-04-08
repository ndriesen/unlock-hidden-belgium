"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import GalleryCarousel from '@/components/GalleryCarousel';
import FloatingActionMenu from '@/components/ui/FloatingActionMenu';
import type { TripStop } from '@/types/trip';
import { useState } from 'react';
import { X, Heart, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { hotspotToStop } from '@/lib/services/tripPlanner';

interface Props {
  stop: TripStop | null;
  onClose: () => void;
  className?: string;
}

export default function TripStopDetail({ stop, onClose, className = '' }: Props) {
  const [showGallery, setShowGallery] = useState(false);

  if (!stop) return null;

  const previewImage = stop.photoUrl || stop.media[0]?.signedUrl || '/images/placeholder-image.jfif';

  return (
    <AnimatePresence>
      {stop && (
        <>
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div 
            className="fixed right-0 top-0 h-full w-96 max-w-full bg-gradient-to-b from-slate-900/95 to-slate-900/50 backdrop-blur-xl border-l border-slate-700/50 z-50 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={onClose} className="p-2 hover:bg-slate-800/50 rounded-xl transition-all">
                    <X className="w-5 h-5 text-slate-400 hover:text-white" />
                  </button>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                      {stop.name}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Preview Image */}
              <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl relative group">
                <Image 
                  src={previewImage} 
                  alt={stop.name}
                  width={400}
                  height={240}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105 cursor-pointer"
                  onClick={() => setShowGallery(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white font-medium">
                  {stop.province}
                </div>
                {showGallery && (
                  <div className="absolute top-2 right-2 p-1 bg-white/20 rounded-full">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Note */}
              {stop.note && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    Notes
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">{stop.note}</p>
                </div>
              )}

              {/* Gallery */}
              {stop.media.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-300">
                    📸 {stop.media.length} photo{stop.media.length > 1 ? 's' : ''}
                  </h3>
                  <GalleryCarousel 
                    images={stop.media.map(m => m.signedUrl)}
                    alt={stop.name}
                    className="max-h-64"
                    aspectRatio="16/9"
                    showCounter={true}
                    showArrows={true}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">

                <FloatingActionMenu 
                  actions={[
                    { 
                      icon: <Heart/>, 
                      label: 'Favorite', 
                      onClick: () => {}
                    }
                  ]}
                />
              </div>
            </div>
          </motion.div>

          {/* Full Gallery Overlay */}
          <AnimatePresence>
            {showGallery && (
              <motion.div 
                className="fixed inset-0 z-[60] bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowGallery(false)}
              >
                <GalleryCarousel 
                  images={stop.media.map(m => m.signedUrl)}
                  className="max-w-4xl mx-auto h-full"
                  alt={stop.name}
                  aspectRatio="16/9"
                  showCounter={true}
                  showArrows={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

