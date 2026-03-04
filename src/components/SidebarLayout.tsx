"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col bg-brand-background">
        {/* Topbar */}
        <div className="h-20 bg-white flex items-center px-6 shadow-soft">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}