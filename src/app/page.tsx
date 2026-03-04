"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/Supabase/browser-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import HotspotPanel from "@/components/HotspotPanel";
import Toast from "@/components/Toast";

const MapContainer = dynamic(
  () => import("@/components/Map/MapContainer"),
  { ssr: false }
);

export interface Hotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  province: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [viewMode, setViewMode] = useState<"markers" | "heatmap">("markers");
  const [mapStyle, setMapStyle] = useState<"default" | "satellite">("default");
  const [toast, setToast] = useState<string | null>(null);

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">

      {/* ================= HEADER ================= */}
      <header className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Discover Belgium
        </h1>

        <div className="flex gap-3">
          {user ? (
            <>
              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow hover:scale-105 transition"
              >
                Profile
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl shadow hover:scale-105 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl shadow hover:scale-105 transition"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* ================= GLASS CONTROL BAR ================= */}
      <div className="px-6 mb-4">
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl rounded-2xl p-4 flex flex-wrap gap-4 items-center">

          {/* Category */}
          <input
            type="text"
            placeholder="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-full border border-slate-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
          />

          {/* Province */}
          <input
            type="text"
            placeholder="Province"
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="px-4 py-2 rounded-full border border-slate-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
          />

          {/* View Mode Toggle */}
          <button
            onClick={() =>
              setViewMode((prev) =>
                prev === "markers" ? "heatmap" : "markers"
              )
            }
            className="px-4 py-2 rounded-full bg-emerald-600 text-white shadow hover:scale-105 transition"
          >
            {viewMode === "markers" ? "Heatmap Mode" : "Marker Mode"}
          </button>

          {/* Satellite Toggle */}
          <button
            onClick={() =>
              setMapStyle((prev) =>
                prev === "default" ? "satellite" : "default"
              )
            }
            className="px-4 py-2 rounded-full bg-slate-800 text-white shadow hover:scale-105 transition"
          >
            {mapStyle === "default" ? "Satellite View" : "Default View"}
          </button>
        </div>
      </div>

      {/* ================= MAP ================= */}
      <div className="flex-1 mx-6 mb-6 rounded-3xl overflow-hidden shadow-2xl border border-white/40">
        <MapContainer
          viewMode={viewMode}
          mapStyle={mapStyle}
          categoryFilter={categoryFilter}
          provinceFilter={provinceFilter}
          onSelect={setSelected}
          onToast={(msg) => {
            setToast(msg);
            setTimeout(() => setToast(null), 3000);
          }}
        />
      </div>

      {/* ================= HOTSPOT PANEL ================= */}
      <HotspotPanel
        hotspot={selected}
        onClose={() => setSelected(null)}
      />

      {/* ================= TOAST ================= */}
      {toast && <Toast message={toast} />}
    </div>
  );
}