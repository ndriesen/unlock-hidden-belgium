"use client";

import { motion } from "framer-motion";

export default function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-6 right-6 bg-black text-white px-6 py-3 rounded-xl shadow-lg z-50"
    >
      {message}
    </motion.div>
  );
}