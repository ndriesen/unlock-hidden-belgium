"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import HotspotDetail from "./HotspotDetail";

export default function HotspotPanel({
  hotspot,
  onClose,
  onVisit,
  isVisited, 
  isWishlist,
  isFavorite,
  onWishlist,
  onFavorite
}: any) {
  return (
    <AnimatePresence>
      {hotspot && (
        <motion.div
          initial={{ x: 450 }}
          animate={{ x: 0 }}
          exit={{ x: 450 }}
          transition={{ duration: 0.3 }}
          className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-[1000] flex flex-col"
        >
          <div className="flex-1 overflow-hidden">
          <HotspotDetail
            hotspot={hotspot}
            onVisit={(id) => onVisit(id)}
            isVisited={isVisited}
            isWishlist={isWishlist}
            isFavorite={isFavorite}
            onWishlist={onWishlist}
            onFavorite={onFavorite}
            onClose={onClose}
          />
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}