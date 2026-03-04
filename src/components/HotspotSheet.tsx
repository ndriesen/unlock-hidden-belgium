"use client";

import { motion, AnimatePresence } from "framer-motion";
import HotspotDetail from "./HotspotDetail";

export default function HotspotSheet(props: any) {
  if (!props.hotspot) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: "40%" }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="md:hidden fixed bottom-0 left-0 right-0 h-[75vh] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl z-[1000]"
      >
        <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto my-3" />
        <HotspotDetail {...props} />
      </motion.div>
    </AnimatePresence>
  );
}