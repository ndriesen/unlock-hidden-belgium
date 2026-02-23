"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [categoryFilter, setCategoryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  if (loading) return null;

  return (
    <main className="p-4 sm:p-6 flex flex-col min-h-screen">
    <header className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
      <h1 className="text-xl sm:text-2xl font-bold">Unlock Hidden Belgium 🚀</h1>

      <div className="flex gap-2">
        {user ? (
          <>
            <button
              onClick={() => router.push("/profile")}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm sm:text-base"
            >
              Profile
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.refresh(); }}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm sm:text-base"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push("/auth")}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm sm:text-base"
          >
            Login
          </button>
        )}
      </div>
    </header>

    {/* Filters */}
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <input
        type="text"
        placeholder="Category"
        className="border p-2 rounded flex-1"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
      />
      <input
        type="text"
        placeholder="Province"
        className="border p-2 rounded flex-1"
        value={provinceFilter}
        onChange={(e) => setProvinceFilter(e.target.value)}
      />
    </div>

    {/* Map */}
    <div className="flex-1 min-h-[60vh]">
      <Map categoryFilter={categoryFilter} provinceFilter={provinceFilter} />
    </div>
  </main>
  );
}