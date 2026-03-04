"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/Supabase/browser-client";

export default function ReviewsSection({ hotspotId }: { hotspotId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("hotspot_id", hotspotId)
        .order("created_at", { ascending: false });

      if (data) setReviews(data);
    };

    load();
  }, [hotspotId]);

  if (!reviews.length)
    return <p className="text-sm text-gray-500">No reviews yet.</p>;

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div
          key={r.id}
          className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800"
        >
          <p className="font-semibold">⭐ {r.rating}/5</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {r.comment}
          </p>
        </div>
      ))}
    </div>
  );
}