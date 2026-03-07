"use client";

import HotspotCollectionPage from "@/components/hotspots/HotspotCollectionPage";

export default function FavoritesPage() {
  return (
    <HotspotCollectionPage
      collection="favorite"
      title="Favorite Hotspots"
      emptyMessage="No favorites yet."
    />
  );
}