import { supabase } from "@/lib/Supabase/browser-client";

interface MentionRow {
  id: string;
  source: string;
  author_handle: string;
  content: string;
  post_url: string;
  hotspot_id: string | null;
  trip_id: string | null;
  sentiment_score: number | null;
  is_featured: boolean;
  created_at: string;
}

export interface InfluencerMention {
  id: string;
  source: string;
  authorHandle: string;
  content: string;
  postUrl: string;
  hotspotId: string | null;
  tripId: string | null;
  sentimentScore: number | null;
  isFeatured: boolean;
  createdAt: string;
}

export async function fetchInfluencerMentions(limit = 8): Promise<InfluencerMention[]> {
  const { data, error } = await supabase
    .from("influencer_mentions")
    .select("id,source,author_handle,content,post_url,hotspot_id,trip_id,sentiment_score,is_featured,created_at")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as MentionRow[]).map((row) => ({
    id: row.id,
    source: row.source,
    authorHandle: row.author_handle,
    content: row.content,
    postUrl: row.post_url,
    hotspotId: row.hotspot_id,
    tripId: row.trip_id,
    sentimentScore: row.sentiment_score,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  }));
}

