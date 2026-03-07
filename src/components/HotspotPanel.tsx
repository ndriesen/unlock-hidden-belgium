"use client";

import { motion, AnimatePresence } from "framer-motion";
import HotspotDetail from "./HotspotDetail";
import { Hotspot } from "@/types/hotspot";

interface HotspotPanelProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  onVisit: (id: string) => void;
  onAddToTrip: (hotspot: Hotspot) => void;
  isVisited: boolean;
  isWishlist: boolean;
  isFavorite: boolean;
  onWishlist: (id: string) => void;
  onFavorite: (id: string) => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  positionLabel: string;
}

export default function HotspotPanel({
  hotspot,
  onClose,
  onVisit,
  onAddToTrip,
  isVisited,
  isWishlist,
  isFavorite,
  onWishlist,
  onFavorite,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  positionLabel,
}: HotspotPanelProps) {
  return (
    <AnimatePresence>
      {hotspot && (
        <>
          <motion.button
            type="button"
            aria-label="Close hotspot panel"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:block fixed inset-0 z-[990] bg-slate-900/25"
          />

          <motion.aside
            initial={{ x: 460 }}
            animate={{ x: 0 }}
            exit={{ x: 460 }}
            transition={{ duration: 0.25 }}
            className="hidden md:flex fixed right-0 top-0 z-[1000] h-full w-[430px] flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {positionLabel}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPrevious}
                  disabled={!canGoPrevious}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={onNext}
                  disabled={!canGoNext}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <HotspotDetail
                hotspot={hotspot}
                onVisit={onVisit}
                onAddToTrip={onAddToTrip}
                isVisited={isVisited}
                isWishlist={isWishlist}
                isFavorite={isFavorite}
                onWishlist={onWishlist}
                onFavorite={onFavorite}
                onClose={onClose}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
