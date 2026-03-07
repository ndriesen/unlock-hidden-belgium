"use client";

import HotspotCollectionPage from "@/components/hotspots/HotspotCollectionPage";

export default function VisitedPage() {
  return (
    <HotspotCollectionPage
      collection="visited"
      title="Visited Hotspots"
      emptyMessage="You have not visited any hotspots yet."
    />
  );
}