"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";

export default function BottomSheet({ selected }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const constraintsRef = useRef(null);

  if (!selected) return null;

  return (
    <motion.div
      ref={constraintsRef}
      className="fixed bottom-0 left-0 right-0 z-[999]"
      initial={{ y: "70%" }}
      animate={{ y: isOpen ? "0%" : "60%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="bg-white rounded-t-3xl shadow-2xl p-6 min-h-[40vh]">
        <div
          onClick={() => setIsOpen((p) => !p)}
          className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 cursor-pointer"
        />

        <h2 className="text-xl font-bold">{selected.name}</h2>
        <p className="text-gray-500">{selected.category}</p>

        <button
          onClick={() =>
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`,
              "_blank"
            )
          }
          className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-xl"
        >
          🚗 Navigate
        </button>
      </div>
    </motion.div>
  );
}