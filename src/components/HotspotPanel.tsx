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
  isFavorite: boolean;
  isWishlist: boolean;
  onFavorite: (id: string) => void;
  onWishlist: (id: string) => void;
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
  isVisited,
  isFavorite,
  isWishlist,
  onFavorite,
  onWishlist,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  positionLabel,
  showTripSelector,
  onShowTripSelector,
  onTripUpdated,
}: HotspotPanelProps) {
  if (!hotspot) return null;

  return (
    <AnimatePresence>
      {hotspot && (
        <>
          {/* Subtle backdrop */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[990] bg-black"
          />

          {/* Side panel */}
          <motion.aside
            initial={{ x: 460 }}
            animate={{ x: 0 }}
            exit={{ x: 460 }}
            transition={{ duration: 0.25 }}
            className="hidden md:flex fixed right-0 top-0 z-[1000] h-full w-[430px] flex-col border-l border-slate-200 bg-white shadow-xl rounded-l-[28px] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">

              <div className="flex items-center gap-2">

                <button
                  onClick={() => onPrevious(hotspot.id)}
                  disabled={!canGoPrevious}
                  className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30"
                >
                  <span aria-hidden="true">&larr;</span>
                </button>

                <button
                  onClick={ () => onNext(hotspot.id)}
                  disabled={!canGoNext}
                  className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30"
                >
                  <span aria-hidden="true">&rarr;</span>
                </button>

              </div>

              <span className="text-sm text-gray-500">{positionLabel}</span>

              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <span aria-hidden="true">&times;</span>
              </button>

            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {/* Only display hotspot info; remove action buttons from here */}
              <HotspotDetail
                hotspot={hotspot}
                onVisit={onVisit}
                onWishlist={onWishlist}
                onFavorite={onFavorite}
                isVisited={isVisited}
                isWishlist={isWishlist}
                isFavorite={isFavorite}
                showTripSelector={showTripSelector}
                onShowTripSelector={onShowTripSelector}
                onTripUpdated={onTripUpdated}
                showFavoriteInDetail={false}
              />
            </div>

            {/* Sticky Footer with primary actions 
            <div className="border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-2"> */}
              {/* Visit 
              <button
                onClick={() => onVisit(hotspot.id)}
                className={`w-full py-2 rounded-lg text-white font-semibold ${
                  isVisited ? "bg-gray-400 cursor-default" : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={isVisited}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <span aria-hidden="true" className="text-[18px] leading-none">✓</span>
                  {isVisited ? "Visited" : "Mark as Visited"}
                </span>
              </button>*/}

              {/* Add to Trip 
              <button
                onClick={() => onAddToTrip(hotspot)}
                className="w-full py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200"
              >
                Add to Trip
              </button>*/}

              {/* Favorite
              <button
                onClick={() => onFavorite(hotspot.id)}
                className={`w-full py-2 rounded-lg border border-gray-200 font-medium flex justify-center items-center ${
                  isFavorite ? "text-red-500" : "text-gray-700"
                }`} 
              >
                {isFavorite ? (
                  <>
                    <span aria-hidden="true" className="text-[18px] leading-none">♡</span> Favorited
                  </>
                ) : (
                  <>
                    <span aria-hidden="true" className="text-[18px] leading-none">♡</span> Favorite
                  </>
                )}
              </button>
            </div>*/}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

