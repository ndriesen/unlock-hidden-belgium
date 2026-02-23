"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} />

      {/* Hamburger & Content */}
      <div className={`flex-1 transition-all duration-300`} style={{ marginLeft: sidebarOpen ? 256 : 0 }}>
        {/* Hamburger icon boven content */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-green-700 text-white rounded-md shadow-md"
        >
          <Menu className="w-6 h-6" />
        </button>

        <main className="pt-16">{children}</main>
      </div>
    </div>
  );
}