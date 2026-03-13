import { Suspense } from "react";
import ExplorePageClient from "./ExplorePageClient";

export default function HotspotsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-600">Loading explore...</p>}>
      <ExplorePageClient />
    </Suspense>
  );
}
