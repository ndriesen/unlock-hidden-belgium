"use client"

import { useEffect, useCallback } from "react"
import { useMap } from "react-leaflet"

function SafeMobileMapFix() {
  const map = useMap()

  const fix = useCallback(() => {
    if (!map || !map.getSize) return;
    requestAnimationFrame(() => {
      if (map) {
        map.invalidateSize()
      }
    })
  }, [map])

  useEffect(() => {
    fix()

    window.addEventListener("resize", fix)
    window.addEventListener("orientationchange", fix)

    return () => {
      window.removeEventListener("resize", fix)
      window.removeEventListener("orientationchange", fix)
    }
  }, [fix])

  return null
}

export default function MobileMapFix() {
  return <SafeMobileMapFix />;
}

