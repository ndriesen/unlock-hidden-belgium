import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Extract tripId from URL
    const url = new URL(req.url);
    const parts = url.pathname.split("/"); // ["", "api", "trip", "<id>", "view"]
    const tripId = parts[3];

    if (!tripId) {
      return NextResponse.json(
        { error: "Missing tripId" },
        { status: 400 }
      );
    }

    // Get IP for throttling
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Check if this IP viewed recently
    const { data: existingView } = await supabase
      .from("trip_views")
      .select("id")
      .eq("trip_id", tripId)
      .eq("ip_hash", ip)
      .gte("created_at", oneHourAgo)
      .maybeSingle();

    // If already viewed → skip
    if (existingView) {
      return NextResponse.json({ success: true, throttled: true });
    }

    // Log the view
    const { error: insertError } = await supabase
      .from("trip_views")
      .insert({
        trip_id: tripId,
        ip_hash: ip,
      });

    if (insertError) throw insertError;


  } catch (err) {
    console.error("View tracking error:", err);

    return NextResponse.json(
      {
        error: "Failed to log view",
        details: (err as any)?.message || err,
      },
      { status: 500 }
    );
  }
}