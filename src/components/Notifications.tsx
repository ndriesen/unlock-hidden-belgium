"use client";

import { motion, AnimatePresence } from "framer-motion";

export interface Notification {
  id: number;
  message: string;
  type: "xp" | "badge";
}

export default function Notifications({
  notifications,
}: {
  notifications: Notification[];
}) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className={`px-4 py-2 rounded shadow-lg text-white ${
              notification.type === "xp"
                ? "bg-green-500"
                : "bg-yellow-400 text-black"
            }`}
          >
            {notification.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}