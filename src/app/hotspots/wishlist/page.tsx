"use client";

import HotspotCollectionPage from "@/components/hotspots/HotspotCollectionPage";

export default function WishlistPage() {
  return (
    <HotspotCollectionPage
      collection="wishlist"
      title="Wishlist"
      emptyMessage="No hotspots in your wishlist yet."
    />
  );
}