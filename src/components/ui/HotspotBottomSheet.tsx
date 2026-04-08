"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import GalleryCarousel from '@/components/GalleryCarousel';
import FloatingActionMenu from '@/components/ui/FloatingActionMenu';
import { X, Heart, MapPin, ChevronLeft, ChevronRight, CheckCircle, Bookmark } from 'lucide-react';
import type { ExploreHotspot } from '@/lib/services/explore';
import { getCategoryDisplay } from '@/types/hotspot';

interface Props {
  gem: ExploreHotspot | null;
  onClose: () => void;
  onVisit?: (id: string) => void;
  onLike?: (id: string) => void;
  onWishlist?: (id: string) => void;
  className?: string;
  index?: number;
  total?: number;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function HotspotBottomSheet({ 
  gem, 
  onClose, 
  onVisit, 
  onLike, 
  onWishlist, 
  className = '', 
  index = 0, 
  total = 0,
  onPrev,
  onNext 
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'plan'>('overview');

  if (!gem) return null;

  const images = [gem.imageUrl || '/images/placeholder-image.jfif'];

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div 
          className="flex-1 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Sheet */}
        <motion.div 
          className={`bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl relative w-full max-h-[90vh] overflow-hidden flex flex-col ${className}`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="p-4 pt-6 flex items-center justify-between">
            <div className="w-8 h-1 bg-slate-300 rounded-full mx-auto" />
            <div className="absolute left-4 top-6">
              <button onClick={onClose} className="p-2 rounded-full bg-slate-100/50 hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
              {onPrev && (
                <button onClick={onPrev} className="p-2 rounded-full bg-slate-100/50 hover:bg-slate-200">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <span>{index + 1} / {total}</span>
              {onNext && (
                <button onClick={onNext} className="p-2 rounded-full bg-slate-100/50 hover:bg-slate-200">
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Hero Gallery */}
          <div className="h-64 relative overflow-hidden">
            <GalleryCarousel 
              images={images} 
              alt={gem.name}
              aspectRatio="16/9"
              className="h-full"
              showArrows={false}
              showCounter={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">{gem.name}</h1>
              <p className="text-white/90 text-sm">{getCategoryDisplay(gem.category)} • {gem.province}</p>
            </div>
          </div>

          {/* Toggle Expand */}
          {!expanded ? (
            <div className="p-6 space-y-4 flex-1">
              <p className="text-slate-700 leading-relaxed text-sm">{gem.description}</p>
              <button 
                onClick={() => setExpanded(true)}
                className="w-full bg-navy-600 text-white py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Expand Details
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tabs */}
              <div className="flex bg-slate-100 rounded-2xl p-1">
                {(['overview', 'plan'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition ${
                      activeTab === tab 
                        ? 'bg-white shadow-sm text-navy-600' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {tab === 'overview' ? 'Overview' : 'Plan'}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Category</span>
                      <p className="font-semibold">{getCategoryDisplay(gem.category)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Province</span>
                      <p className="font-semibold">{gem.province}</p>
                    </div>
                  </div>
                  <div className="text-sm leading-relaxed text-slate-700 max-h-32 overflow-y-auto">
                    {gem.description}
                  </div>
                </div>
              )}

              {activeTab === 'plan' && (
                <div className="space-y-4 text-sm">
                  <div className="bg-emerald-50 p-4 rounded-2xl">
                    <h3 className="font-bold text-emerald-800 mb-2">Tip</h3>
                    <p>Visit at golden hour for best photos. Combine with nearby {gem.province} gems.</p>
                  </div>
                  <button className="w-full bg-teal-600 text-white py-3 rounded-2xl font-semibold">
                    Get Directions
                  </button>
                </div>
              )}

              {/* Actions */}
              <FloatingActionMenu 
                actions={[
                  {
                    icon: <CheckCircle className="text-emerald-600" />,
                    label: 'Mark Visited',
                    onClick: () => onVisit?.(gem.id)
                  },
                  {
                    icon: <Heart className="text-red-500" />,
                    label: 'Like',
                    onClick: () => onLike?.(gem.id)
                  },
                  {
                    icon: <Bookmark className="text-amber-500" />,
                    label: 'Wishlist',
                    onClick: () => onWishlist?.(gem.id)
                  }
                ]}
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

