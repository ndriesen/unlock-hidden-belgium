"use client";

import HotspotCollectionPage from "@/components/hotspots/HotspotCollectionPage";

export default function HotspotsPage() {
  return (
    <HotspotCollectionPage
      collection="all"
      title="My Hotspots"
      emptyMessage="No saved hotspots yet. Start exploring on the map."
    />
  );
}