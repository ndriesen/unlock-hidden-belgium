import { supabase } from "@/lib/Supabase/browser-client";

export async function fetchHotspots() {
  const { data, error } = await supabase.from("hotspots").select("*");
  if (error) throw error;
  return data;
}