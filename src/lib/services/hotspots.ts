import { supabase } from "@/lib/supabase/browser-client";

export async function fetchHotspots() {
  const { data, error } = await supabase.from("hotspots").select("*");
  if (error) throw error;
  return data;
}