"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, animate, useDragControls } from "framer-motion";
import HotspotDetail from "./HotspotDetail";
import { Hotspot } from "@/types/hotspot";
import { useEffect, useState } from "react";

interface HotspotPanelProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  onVisit: (id: string) => void;
  onAddToTrip: (hotspot: Hotspot) => void;
  onWishlist: (id: string) => void;
  onFavorite: (id: string) => void;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  isVisited: boolean;
  isWishlist: boolean;
  isFavorite: boolean;
  isLiked: boolean;
  isSaved: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: (id: string) => void;
  onNext: (id: string) => void;
  positionLabel: string;
  showTripSelector?: boolean;
  onShowTripSelector?: (show: boolean) => void;
  onTripUpdated?: () => void;
}

export default function HotspotPanel({
  hotspot,
  onClose,
  onVisit,
  onAddToTrip,
  onWishlist,
  onFavorite,
  onLike,
  onSave,
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
}: HotspotPanelProps) {

  type SheetState = "collapsed" | "half" | "full";
  const [viewportHeight, setViewportHeight] = useState(0);
  const [sheetState, setSheetState] = useState<SheetState>("half");

  const y = useMotionValue(0);
  const controls = useDragControls();

  // Dynamische snap-points gebaseerd op viewport height
  const SNAP_POINTS = {
    collapsed: viewportHeight * 0.85,
    half: viewportHeight * 0.35,
    full: viewportHeight * 0.05,
  };

  const backdropOpacity = useTransform(
    y,
    [SNAP_POINTS.collapsed, SNAP_POINTS.full],
    [0, 0.4]
  );

  const scale = useTransform(
    y,
    [SNAP_POINTS.full, SNAP_POINTS.collapsed],
    [1, 0.96]
  );

  // Update viewportHeight bij mount of hotspot change
  useEffect(() => {
    const height = window.innerHeight;
    setViewportHeight(height);
    y.set(SNAP_POINTS.half);
    setSheetState("half");
  }, [hotspot]);

  // Animatie bij sheetState change
  useEffect(() => {
    if (!viewportHeight) return;
    animate(y, SNAP_POINTS[sheetState], { type: "spring", stiffness: 650, damping: 28, mass: 0.6 });
  }, [sheetState, viewportHeight]);

  if (!hotspot) return null;

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          onClick={onClose}
          style={{ opacity: backdropOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[990] bg-black"
        />

        {/* Desktop Side Panel */}
        <motion.aside
          initial={{ x: 460 }}
          animate={{ x: 0 }}
          exit={{ x: 460 }}
          transition={{ type: "spring", stiffness: 650, damping: 28, mass: 0.6 }}
          className="hidden md:flex fixed right-0 top-0 z-[10010] h-full w-[430px] flex-col border-l border-slate-200 bg-white shadow-xl rounded-l-[28px] overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button onClick={() => onPrevious(hotspot.id)} disabled={!canGoPrevious} className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30">
                &larr;
              </button>
              <button onClick={() => onNext(hotspot.id)} disabled={!canGoNext} className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30">
                &rarr;
              </button>
            </div>
            <span className="text-sm text-gray-500">{positionLabel}</span>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">&times;</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-4">
            <HotspotDetail
              hotspot={hotspot}
              onVisit={onVisit}
              onWishlist={onWishlist}
              onFavorite={onFavorite}
              onLike={onLike}
              onSave={onSave}
              onAddToTrip={onAddToTrip}
              isVisited={isVisited}
              isWishlist={isWishlist}
              isFavorite={isFavorite}
              isLiked={isLiked}
              isSaved={isSaved}
              showTripSelector={showTripSelector}
              onShowTripSelector={onShowTripSelector}
              onTripUpdated={onTripUpdated}
              showFavoriteInDetail={false}
              onClose={onClose}
            />
          </div>
        </motion.aside>

        {/* Mobile Bottom Sheet */}
        <motion.div
          style={{ y, scale }}
          drag="y"
          dragControls={controls}
          dragListener={false}
          dragMomentum={false}
          dragConstraints={{ top: SNAP_POINTS.full, bottom: SNAP_POINTS.collapsed }}
          onDrag={(e, info) => {
            const clamped = Math.min(Math.max(y.get() + info.delta.y, SNAP_POINTS.full), SNAP_POINTS.collapsed);
            y.set(clamped);
          }}
          onDragEnd={(e, info) => {
            const velocity = info.velocity.y;
            const currentY = y.get();

            // Swipe down to close
            if (currentY > SNAP_POINTS.collapsed - 50 || velocity > 600) {
              onClose();
              return;
            }

            // Snap logic
            const distances = Object.entries(SNAP_POINTS).map(([key, value]) => ({
              key,
              distance: Math.abs(currentY - value),
            }));
            const closest = distances.reduce((prev, curr) => (curr.distance < prev.distance ? curr : prev));
            setSheetState(closest.key as SheetState);
          }}
          initial={{ y: "100%" }}
          animate={{ y: SNAP_POINTS[sheetState] }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 650, damping: 28, mass: 0.6 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-[10010] bg-white shadow-xl rounded-t-[28px] overflow-hidden flex flex-col"
        >
          {/* Drag handle */}
          <div onPointerDown={(e) => controls.start(e)} className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2 cursor-grab active:cursor-grabbing" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button onClick={() => onPrevious(hotspot.id)} disabled={!canGoPrevious} className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30">&larr;</button>
              <button onClick={() => onNext(hotspot.id)} disabled={!canGoNext} className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30">&rarr;</button>
            </div>
            <span className="text-sm text-gray-500">{positionLabel}</span>
              
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close detail panel"
              className="rounded-full bg-black/50 text-white px-3 py-1.5 text-sm"
            >
              Close
            </button>
          )}
      
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-4">
            <HotspotDetail
              hotspot={hotspot}
              onClose={onClose}
              onVisit={onVisit}
              onWishlist={onWishlist}
              onFavorite={onFavorite}
              onLike={onLike}
              onSave={onSave}
              onAddToTrip={onAddToTrip}
              isVisited={isVisited}
              isWishlist={isWishlist}
              isFavorite={isFavorite}
              isLiked={isLiked}
              isSaved={isSaved}
              showTripSelector={showTripSelector}
              onShowTripSelector={onShowTripSelector}
              onTripUpdated={onTripUpdated}
              showFavoriteInDetail={false}
            />
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}