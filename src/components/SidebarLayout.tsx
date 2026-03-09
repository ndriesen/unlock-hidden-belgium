"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Bell, Compass, Home, Menu, Route, User, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/Supabase/browser-client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import { useSearch } from "@/context/SearchContext";
import { fetchUnreadNotificationCount } from "@/lib/services/activity";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { searchQuery, setSearchQuery } = useSearch();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/auth";

  useEffect(() => {
    let active = true;

    const loadUnread = async () => {
      if (!user?.id) {
        if (active) setUnreadCount(0);
        return;
      }

      const count = await fetchUnreadNotificationCount(user.id);
      if (active) {
        setUnreadCount(count);
      }
    };

    void loadUnread();

    return () => {
      active = false;
    };
  }, [user?.id, pathname]);

  if (isAuthPage) {
    return <div className="h-full">{children}</div>;
  }

  const mobileTabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/hotspots", label: "Explore", icon: Compass },
    { href: "/trips", label: "Trips", icon: Route },
    { href: "/activity", label: "Activity", icon: Bell, badge: unreadCount },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div
        className="fixed inset-0 z-40 bg-slate-900/45 md:hidden"
        hidden={!mobileMenuOpen}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar collapsed={false} onNavigate={() => setMobileMenuOpen(false)} />
      </aside>

      <div
        className={`hidden md:block transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <Sidebar collapsed={collapsed} />
      </div>

      <div className="flex-1 flex min-w-0 flex-col overflow-hidden">
        <header className="h-16 sticky top-0 z-30 backdrop-blur-xl bg-white/75 border-b border-white/30 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className="hidden md:inline-flex p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <Image
                src="/branding/spotly-logo.svg"
                alt="Spotly logo"
                width={30}
                height={30}
                className="rounded-lg"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate text-slate-900">Spotly</p>
                <p className="text-[11px] text-slate-500 truncate">Unlock hidden gems</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <input
              type="text"
              placeholder="Search hotspots..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="hidden md:block px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 w-72"
            />

            <button
              onClick={() => router.push("/activity")}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
              aria-label="Open activity"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className="relative w-10 h-10 rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center overflow-hidden"
                  aria-label="Open account menu"
                >
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Profile avatar"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    user.email?.charAt(0).toUpperCase()
                  )}
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        router.push("/hotspots");
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50"
                    >
                      Explore
                    </button>

                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        router.push("/hotspots/my");
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50"
                    >
                      My Hotspots
                    </button>

                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        router.push("/trips");
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50"
                    >
                      Trips
                    </button>

                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        router.push("/activity");
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50"
                    >
                      Activity
                    </button>

                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        router.push("/pricing");
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50"
                    >
                      Pricing
                    </button>

                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        router.push("/profile");
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50"
                    >
                      Profile
                    </button>

                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setAccountMenuOpen(false);
                        router.refresh();
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50 text-red-500"
                    >
                      Logout
                    </button>
                  </div>
                )}
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
        </header>

        <div className="border-b border-slate-200/70 bg-white/70 px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search hotspots..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {mobileMenuOpen && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg border border-slate-200 bg-white"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <main className="flex-1 overflow-auto px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">
          {children}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="grid grid-cols-5">
            {mobileTabs.map((tab) => {
              const active = isActive(pathname, tab.href);
              const Icon = tab.icon;

              return (
                <button
                  key={tab.href}
                  onClick={() => router.push(tab.href)}
                  className={`relative flex flex-col items-center justify-center gap-1 py-2 ${
                    active ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] font-medium">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute right-2 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

