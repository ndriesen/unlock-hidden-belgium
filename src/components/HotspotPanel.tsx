"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function HotspotPanel({
  hotspot,
  onClose,
  onVisit,
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
          <div className="p-6 flex justify-between items-center border-b">
            <h2 className="text-xl font-semibold">{hotspot.name}</h2>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div className="h-48 bg-gray-200 rounded-xl mb-4" />

            <p className="text-gray-600 mb-4">
              Explore this hidden gem and earn XP.
            </p>

            <button
              onClick={() => onVisit(hotspot)}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition"
            >
              Visit & Earn 50 XP
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}