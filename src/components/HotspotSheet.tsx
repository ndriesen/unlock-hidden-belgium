"use client";

import { motion, AnimatePresence } from "framer-motion";
import HotspotDetail from "./HotspotDetail";
import { Hotspot } from "@/types/hotspot";

interface HotspotSheetProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  onVisit: (id: string) => void;
  onAddToTrip: (hotspot: Hotspot) => void;
  onWishlist: (id: string) => void;
  onFavorite: (id: string) => void;
  isVisited: boolean;
  isWishlist: boolean;
  isFavorite: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  positionLabel: string;
}

export default function HotspotSheet({
  hotspot,
  onClose,
  onVisit,
  onAddToTrip,
  onWishlist,
  onFavorite,
  isVisited,
  isWishlist,
  isFavorite,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  positionLabel,
}: HotspotSheetProps) {
  if (!hotspot) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed bottom-0 left-0 right-0 z-[1000] h-[80vh] rounded-t-3xl bg-white shadow-2xl md:hidden"
      >
        <div className="space-y-2 border-b border-slate-200 px-4 pb-3 pt-2">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-300" />

          <div className="flex items-center justify-between gap-2">
            <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
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
        </div>

        <HotspotDetail
          hotspot={hotspot}
          onClose={onClose}
          onVisit={onVisit}
          onAddToTrip={onAddToTrip}
          onWishlist={onWishlist}
          onFavorite={onFavorite}
          isVisited={isVisited}
          isWishlist={isWishlist}
          isFavorite={isFavorite}
        />
      </motion.div>
    </AnimatePresence>
  );
}
