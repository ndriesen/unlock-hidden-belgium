"use client"

import { useEffect } from "react"
import { useMap } from "react-leaflet"

export default function MobileMapFix() {
  const map = useMap()

  useEffect(() => {

    const fix = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 200)
    }

    fix()

    window.addEventListener("resize", fix)
    window.addEventListener("orientationchange", fix)

    return () => {
      window.removeEventListener("resize", fix)
      window.removeEventListener("orientationchange", fix)
    }

  }, [map])

  return null
}

