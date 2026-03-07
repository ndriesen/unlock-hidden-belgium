"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Hotspot } from "@/types/hotspot";

interface BottomSheetProps {
  selected: Hotspot | null;
}

export default function BottomSheet({ selected }: BottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!selected) return null;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-[999]"
      initial={{ y: "70%" }}
      animate={{ y: isOpen ? "0%" : "60%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="bg-white rounded-t-3xl shadow-2xl p-6 min-h-[40vh]">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 cursor-pointer"
        />

        <h2 className="text-xl font-bold">{selected.name}</h2>
        <p className="text-gray-500">{selected.category}</p>

        <button
          onClick={() =>
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`,
              "_blank",
              "noopener,noreferrer"
            )
          }
          className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-xl"
        >
          Open navigation
        </button>
      </div>
    </motion.div>
  );
}