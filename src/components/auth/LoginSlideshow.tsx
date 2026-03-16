"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IMAGES = [
  "/images/loginPage/1.jpg",
  "/images/loginPage/2.jpg",
  "/images/loginPage/3.jpg",
  "/images/loginPage/4.jpg",
  "/images/loginPage/5.jpg",
];

export default function LoginSlideshow() {
  const [index, setIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    const shuffled = [...IMAGES].sort(() => Math.random() - 0.5);
    const imagePromises = shuffled.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
      });
    });

    Promise.all(imagePromises).then(() => {
      setImages(shuffled);
      setLoaded(true); // First image ready immediately
    });
  }, []);

  // Cycle images every 13s
  useEffect(() => {
    if (!loaded) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 13000);

    return () => clearInterval(interval);
  }, [images, loaded]);

  if (!loaded) return null; // Optional: placeholder while loading

  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden -z-10">
          {/* Static logo overlay outside slideshow animation */}
          <img 
            src="/branding/Spotly-white-text-nobg.png"
            alt="Spotly"
            className="absolute top-8 left-8 w-32 md:w-85 lg:w-100 opacity-85 pointer-events-none z-20 drop-shadow-2xl"
          />
          
          <AnimatePresence mode="wait">
        <motion.div
          key={images[index]}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 50, scale: 1.1 }}
          exit={{ opacity: 1, scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <motion.img
            src={images[index]}
            alt="Travel inspiration"
            className="w-full h-full object-cover"
            initial={{ x: -10, y: -10 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: 10, y: 10 }}
            transition={{ duration: 10, ease: "easeOut" }}
          />

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
