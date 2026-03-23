"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useDragControls,
  animate,
} from "framer-motion";
import HotspotDetail from "./HotspotDetail";
import { Hotspot } from "@/types/hotspot";
import { useEffect } from "react";

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
  isLiked: boolean;
  isSaved: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  positionLabel: string;
  showTripSelector?: boolean;
  onShowTripSelector?: (show: boolean) => void;
  onTripUpdated?: () => void;
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
  isLiked,
  isSaved,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  positionLabel,
  showTripSelector,
  onShowTripSelector,
  onTripUpdated,
}: HotspotSheetProps) {
  const y = useMotionValue(0);
  const controls = useDragControls();

  useEffect(() => {
    if (!hotspot) return;

    // Start iets hoger → voelt sneller
    animate(y, 0, {
      type: "spring",
      stiffness: 500,
      damping: 30,
      mass: 0.6,
    });
  }, [hotspot]);

  if (!hotspot) return null;

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-black md:hidden"
        />

        {/* Bottom Sheet */}
        <motion.div
          style={{ y }}
          drag="y"
          dragControls={controls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 500 }}
          dragElastic={0.35}
          onDragEnd={(e, info) => {
            const velocity = info.velocity.y;
            const offset = info.offset.y;

            // 🔥 Fast swipe down → close
            if (velocity > 800 || offset > 150) {
              animate(y, 600, {
                duration: 0.2,
              });
              setTimeout(onClose, 200);
              return;
            }

            // 🔥 Snap back
            animate(y, 0, {
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 0.6,
            });
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 0.6,
          }}
          className="fixed bottom-0 left-0 right-0 z-[10010] h-[80vh] rounded-t-3xl bg-white shadow-2xl md:hidden flex flex-col overflow-hidden"
        >
          {/* Drag Handle */}
          <div
            onPointerDown={(e) => controls.start(e)}
            className="py-2 cursor-grab active:cursor-grabbing"
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-200">
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
              <button
                onClick={onClose}
                className="ml-1 text-lg px-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
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
              showTripSelector={showTripSelector}
              onShowTripSelector={onShowTripSelector}
              onTripUpdated={onTripUpdated}
              showFavoriteInDetail={true}
            />
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}