import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params;
  const { userId } = await req.json();

  if (!userId) return NextResponse.json({ error: "No user ID provided" }, { status: 400 });

  try {
    // Check if like exists
    const { data: existing, error: fetchErr } = await supabase
      .from("trip_likes")
      .select("*")
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;

    if (existing) {
      // Remove like
      const { error: delErr } = await supabase
        .from("trip_likes")
        .delete()
.eq("trip_id", existing.trip_id).eq("user_id", existing.user_id);
      if (delErr) throw delErr;
    } else {
      // Add like
      const { error: addErr } = await supabase
        .from("trip_likes")
        .insert([{ trip_id: tripId, user_id: userId }]);
      if (addErr) throw addErr;
    }

    // Fetch fresh count
    const { count: likesCount } = await supabase
      .from("trip_likes")
      .select("*", { count: "exact", head: true })
      .eq("trip_id", tripId);

    return NextResponse.json({ liked: !existing, likesCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
