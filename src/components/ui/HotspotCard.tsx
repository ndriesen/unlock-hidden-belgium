"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AnimatedButton from "@/components/ui/hover-button"
import FloatingActionMenu from "@/components/ui/FloatingActionMenu"
import { Clover, CheckCircle, Heart, Share2, MapPin, ExternalLink, Bookmark, MapPinned, Save, SaveOff, Share } from "lucide-react"


export interface Hotspot {
  id: string
  name: string
  description?: string
  category: string
  province: string
  latitude?: number
  longitude?: number
  imageUrl?: string
  visitCount?: number
  likesCount?: number
  savesCount?: number
  viewsCount?: number
  visited?: boolean
  wishlist?: boolean
  favorite?: boolean
  likedByMe?: boolean
  savedByMe?: boolean
}

export interface HotspotCardProps {
  hotspot: Hotspot
  onVisit: (hotspot: Hotspot) => void;
  onLike: (hotspot: Hotspot) => void
  onSave: (hotspot: Hotspot) => void
  onWishlist: (hotspotId: string) => void
  onFavorite: (hotspotId: string) => void
  onMap: (hotspotId: string) => void
}

const handleShare = async (hotspot: Hotspot) => {
  const url = `${window.location.origin}/hotspots/${hotspot.id}`

  try {
    if (navigator.share) {
      await navigator.share({
        title: hotspot.name,
        text: hotspot.description || "Check this hidden gem!",
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
      alert("Link copied to clipboard!")
    }
  } catch (error) {
    console.error("Error sharing:", error)
  }
}


export default function HotspotCard({
  hotspot,
  onVisit,
  onLike,
  onSave,
  onWishlist,
  onFavorite,
  onMap,
}: HotspotCardProps) {
  const router = useRouter();
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${hotspot.latitude},${hotspot.longitude}`;
  const detailUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/hotspots/${hotspot.id}`
      : `/hotspots/${hotspot.id}`;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300">
      <div className="relative h-40 w-full">
        <Link href={`/hotspots/${hotspot.id}`} className="block h-full w-full">
          <Image
            src={hotspot.imageUrl ?? "/images/placeholder-image.png"}
            alt={hotspot.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="text-sm font-semibold text-white">{hotspot.name}</p>
            <p className="text-[11px] text-white/85">
              {hotspot.category} - {hotspot.province}
            </p>
          </div>
        </Link>

        {/* Favorite corner button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onLike(hotspot)
          }}
          className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/90 shadow-sm ${
            hotspot.likedByMe ? "text-rose-600" : "text-slate-600"
          }`}
          aria-label={hotspot.likedByMe ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={hotspot.likedByMe ? "text-rose-600 fill-red-500 px-1.25" : "text-slate-600 px-1.25"} />
        </button>
      </div>

      {/* Status badges */}
      <div className="absolute left-1 top-3 gap-2 flex-wrap text-[10px]">
        {hotspot.visited && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
            <span aria-hidden="true">✓</span> Visited
          </span>
        )}
        {hotspot.wishlist && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-700">
            <span aria-hidden="true">⟟</span> Wishlist
          </span>
        )}
        {hotspot.likedByMe && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-rose-700">
            <span aria-hidden="true">♡</span> Liked
          </span>
        )}
      </div>
      {/* Description */}
      <div className="p-2 space-y-2">
        <p className="line-clamp-2 text-xs text-slate-700">{hotspot.description}</p>

        {/* Hover buttons */}
        
        <div className="absolute top-25 right-1 mt-4 flex justify-end z-40">
          <FloatingActionMenu
            actions={[
              {
                icon: <CheckCircle className={hotspot.visited ? "text-emerald-600" : "text-slate-600"} />,
                label: hotspot.visited ? "Visited" : "Visit",
                onClick: () => onVisit?.(hotspot),
              },
              {
                icon: <Bookmark className={hotspot.wishlist ? "text-amber-600" : "text-slate-600"} />,
                label: hotspot.wishlist ? "Wishlisted" : "Wishlist", 
                onClick: () => onWishlist?.(hotspot.id),
              },
              {
                icon: <Heart className={hotspot.likedByMe ? "text-rose-600 fill-red-500" : "text-slate-600"} />,
                label:  hotspot.likedByMe ? "Liked" : "Like",
                onClick: () => onLike?.(hotspot),
              },
              {
                icon: <MapPin className="text-slate-600" />,
                label: "Route",
                onClick: () => window.open(routeUrl, "_blank", "noopener,noreferrer"),
              },
              {
                icon: <Share2 className="text-slate-600" />,
                label: "Share",
                onClick: () => handleShare(hotspot),
              },
              {
                icon: <ExternalLink className="text-slate-600" />,
                label: "Details",
                onClick: () => router.push(`/hotspots/${hotspot.id}`),
              },
            ]}
          />
        </div>

        


        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-center text-xs">
          <div className="rounded-lg border border-slate-200 p-2">
            <p className="text-slate-500">Visits</p>
            <p className="font-semibold text-slate-900">{hotspot.visitCount ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-2">
            <p className="text-slate-500">Likes</p>
            <p className="font-semibold text-slate-900">{hotspot.likesCount ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-2">
            <p className="text-slate-500">Saves</p>
            <p className="font-semibold text-slate-900">{hotspot.savesCount ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-2">
            <p className="text-slate-500">Views</p>
            <p className="font-semibold text-slate-900">{hotspot.viewsCount ?? 0}</p>
          </div>
        </div>




      </div>
    </article>
  )
}