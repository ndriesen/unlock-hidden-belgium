"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { Menu, ChevronDown } from "lucide-react";

export default function NavBar() {
  const { user } = useAuth();
  const router = useRouter();

  // persistent open state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hotspotsOpen, setHotspotsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const navLinks = [
    { name: "Home", href: "/" },
    {
      name: "Hotspots",
      submenu: [
        { name: "All Hotspots", href: "/hotspots" },
        { name: "Visited", href: "/hotspots/visited" },
        { name: "Favorites", href: "/hotspots/favorites" },
        { name: "Wishlist", href: "/hotspots/wishlist" },
      ],
    },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <>
      {/* Hamburger Icon */}
      <button
		  onClick={() => setSidebarOpen(!sidebarOpen)}
		  className="fixed top-4 left-4 z-50 p-2 bg-green-700 text-white rounded-md shadow-md"
		>
		  <Menu className="w-6 h-6" />
		</button>

		{/* Sidebar */}
		<aside
		  className={`
			fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40
			transform transition-transform duration-300
			${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
			md:translate-x-0 md:flex md:flex-col
		  `}
		>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h1 className="text-xl font-bold text-green-700">Unlock Hidden Belgium</h1>
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
            {navLinks.map((link) =>
              link.submenu ? (
                <div key={link.name} className="space-y-1">
                  <button
                    onClick={() => setHotspotsOpen(!hotspotsOpen)}
                    className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-green-100 text-gray-700"
                  >
                    <span>{link.name}</span>
                    <ChevronDown
                      className={`transition-transform ${hotspotsOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>
                  {hotspotsOpen && (
                    <div className="pl-4 flex flex-col space-y-1">
                      {link.submenu.map((s) => (
                        <Link
                          key={s.name}
                          href={s.href!}
                          className="block px-3 py-2 rounded hover:bg-green-100 text-gray-700"
                        >
                          {s.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.name}
                  href={link.href!}
                  className="block px-3 py-2 rounded hover:bg-green-100 text-gray-700"
                >
                  {link.name}
                </Link>
              )
            )}

            {user && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded text-white bg-red-500 hover:bg-red-600 transition"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}