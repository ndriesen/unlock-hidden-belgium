"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function SafeGlobe() {
  const globeRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="w-full h-screen bg-black">
      <Globe
        ref={globeRef}
        width={1000}
        height={800}
        globeImageUrl="/images/Map/earth-blue-marble.jpg"
        bumpImageUrl="/images/Map/earth-topology.png"
          enablePointerInteraction={true}
        onGlobeReady={() => {
            globeRef.current.controls().enableZoom = true;
            globeRef.current.controls().autoRotate = false;
            }}
      />
    </div>
  );
}