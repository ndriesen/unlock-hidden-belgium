"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/Supabase/browser-client";
import { awardXP } from "@/lib/services/gamification";
import { useAuth } from "@/context/AuthContext";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at?: string | null;
  user_id: string;
  user_avatar: string;
  users?: {
    username: string | null;
  } | null;
}

type SortMode = "recent" | "rating";

export default function ReviewsSection({ hotspotId }: { hotspotId: string }) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("* , users:users(username)")
        .eq("hotspot_id", hotspotId)
        .order("created_at", { ascending: false })

      if (active && data) {
        setReviews(data as Review[]);
      }
    };

    const timer = setTimeout(() => {
      void load();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [hotspotId]);

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];

    if (sortMode === "rating") {
      return copy.sort((a, b) => b.rating - a.rating);
    }

    return copy.sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  }, [reviews, sortMode]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  const reloadReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, users:users(username)")
        .eq("hotspot_id", hotspotId)
        .order("created_at", { ascending: false });

      if (data) {
        setReviews(data as Review[]);
      }
    };

  const submitReview = async () => {
    if (!user) {
      setMessage("Login required to post a review.");
      return;
    }

    if (!comment.trim()) {
      setMessage("Add a short comment first.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const payload: {
      hotspot_id: string;
      rating: number;
      comment: string;
      user_id?: string;
      user_avatar: string;
    } = {
      hotspot_id: hotspotId,
      rating,
      comment: comment.trim(),
      user_id: user?.id,
      user_avatar: user?.user_metadata?.avatar_url || '',
    };

    const { error } = await supabase.from("reviews").insert(payload);

    if (error) {
      console.error("Review submit error:", error);
      setMessage("Could not save review right now.");
      setSubmitting(false);
      return;
    }

    // Award XP for review
    await awardXP(user!.id, 'xp_writing_review');

    setComment("");
    setRating(5);
    setSubmitting(false);
    setMessage("Review posted. +XP earned!");
    await reloadReviews();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-3 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Community score</p>
            <p className="text-xs text-slate-600">
              {reviews.length ? `${averageRating}/5 from ${reviews.length} review(s)` : "No reviews yet"}
            </p>
          </div>

          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
          >
            <option value="recent">Most recent</option>
            <option value="rating">Highest rating</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
        <p className="text-sm font-semibold text-slate-900">Write a review</p>

        <div className="flex items-center gap-2">
          <label htmlFor="rating" className="text-xs text-slate-600">Rating</label>
          <select
            id="rating"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>{value}/5</option>
            ))}
          </select>
        </div>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          placeholder="Share what made this spot worth the trip"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />

        <button
          onClick={submitReview}
          disabled={submitting}
          className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post review"}
        </button>

        {message && <p className="text-xs text-slate-600">{message}</p>}
      </div>

      <div className="space-y-3">
        {sortedReviews.length === 0 && (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        )}

        {sortedReviews.map((review) => (
          <article
            key={review.id}
            className="p-3 rounded-xl border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                  <img
                      src={review.user_avatar}
                      alt={review.users?.username || "Anonymous User"}
                      className="w-full h-full object-cover"
                    />
                </div>
                <p className="font-semibold text-slate-900 text-sm truncate min-w-0 flex-1">
                  {review.users?.username || "Anonymous User"}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="font-semibold text-slate-900 text-sm">{review.rating}/5</p>
                <p className="text-xs text-slate-500">
                  {review.created_at
                    ? new Date(review.created_at).toLocaleDateString("nl-BE")
                    : ""}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-700">{review.comment || "No comment."}</p>
          </article>
        ))}
      </div>
    </div>
  );
}