"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
}

export default function Sidebar({ sidebarOpen }: SidebarProps) {
  const navLinks = [
    { name: "Home", href: "/" },
    {
      name: "Hotspots",
      href: "/hotspots",
      submenu: [
        { name: "All Hotspots", href: "/hotspots" },
        { name: "Visited", href: "/hotspots/visited" },
        { name: "Favorites", href: "/hotspots/favorites" },
        { name: "Wishlist", href: "/hotspots/wishlist" },
      ],
    },
    { name: "Profile", href: "/profile" },
  ];

  const [hotspotsOpen, setHotspotsOpen] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-white shadow-lg z-40 w-64 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-4">
        <h1 className="text-xl font-bold text-green-700 mb-6">Unlock Hidden Belgium</h1>
        <nav className="flex flex-col space-y-2">
          {navLinks.map((link) =>
            link.submenu ? (
              <div key={link.name}>
                <button
                  className="flex justify-between items-center w-full px-3 py-2 rounded hover:bg-green-100"
                  onClick={() => setHotspotsOpen(!hotspotsOpen)}
                >
                  <span>{link.name}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      hotspotsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {hotspotsOpen && (
                  <div className="flex flex-col ml-4 mt-1 space-y-1">
                    {link.submenu.map((s) => (
                      <Link key={s.name} href={s.href} className="block px-3 py-1 rounded hover:bg-green-50">
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={link.name} href={link.href} className="block px-3 py-2 rounded hover:bg-green-100">
                {link.name}
              </Link>
            )
          )}
        </nav>
      </div>
    </aside>
  );
}