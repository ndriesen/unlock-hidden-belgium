import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Extract tripId from URL
  const url = new URL(req.url);
  const parts = url.pathname.split("/"); // ["", "api", "trip", "<id>", "save"]
  const tripId = parts[3]; // index 3 = the ID
  const { userId } = await req.json();

  console.log("DEBUG backend:", { tripId, userId });

  if (!tripId || !userId) {
    return NextResponse.json(
      { error: "Missing tripId or userId" },
      { status: 400 }
    );
  }

  try {
    // Check existing save
    const { data: existing, error: fetchErr } = await supabase
      .from("trip_saves")
      .select("*")
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;

    if (existing) {
      const { error: delErr } = await supabase
        .from("trip_saves")
        .delete()
        .eq("trip_id", tripId)
        .eq("user_id", userId);
      if (delErr) throw delErr;
    } else {
      const { error: addErr } = await supabase
        .from("trip_saves")
        .insert([{ trip_id: tripId, user_id: userId }]);
      if (addErr) throw addErr;
    }

    const { count: savesCount } = await supabase
      .from("trip_saves")
      .select("*", { count: "exact", head: true })
      .eq("trip_id", tripId);

    return NextResponse.json({ saved: !existing, savesCount });
  } catch (err) {
    console.error("Save toggle error:", err);
    return NextResponse.json(
      { error: "Failed to toggle save", details: (err as any)?.message || err },
      { status: 500 }
    );
  }
}