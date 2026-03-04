"use client";

import React from "react";
import { useState, useEffect } from "react";
import { isValidElement, cloneElement } from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/Supabase/browser-client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import { useSearch } from "@/context/SearchContext";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <div className="h-16 sticky top-0 z-30 backdrop-blur-xl bg-white/60 border-b border-white/30 flex items-center justify-between px-6">

          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <Menu size={20} />
            </button>

            <h1 className="text-lg font-semibold">
              Unlock Hidden Belgium
            </h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">

            <input
              type="text"
              placeholder="Search hotspots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 w-64 hidden md:block"
            />

            {user ? (
              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.email?.charAt(0).toUpperCase()
                  )}
                </button>

                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => router.push("/profile")}
                    className="block w-full text-left px-4 py-3 hover:bg-slate-50"
                  >
                    Profile
                  </button>

                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.refresh();
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-slate-50 text-red-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}