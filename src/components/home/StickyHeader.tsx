"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, User, Menu, MapPin, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
import {
  NotificationItem,
  fetchNotifications,
  fetchUnreadNotificationCount,
} from "@/lib/services/activity";

interface StickyHeaderProps {
  onMenuToggle?: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function StickyHeader({ onMenuToggle }: StickyHeaderProps) {
  const { user } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      if (!user?.id) {
        if (active) setNotificationsCount(0);
        return;
      }

      const count = await fetchUnreadNotificationCount(user.id);
      if (active) {
        setNotificationsCount(count);
      }
    };

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!showNotifications) return;

    let active = true;

    const loadLatest = async () => {
      if (!user?.id) {
        if (active) setNotifications([]);
        return;
      }

      const data = await fetchNotifications(user.id, 5);
      if (active) {
        setNotifications(data);
      }
    };

    void loadLatest();

    return () => {
      active = false;
    };
  }, [showNotifications, user?.id]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const handleNotificationClick = useCallback(() => {
    setShowNotifications((prev) => !prev);
  }, []);

  const handleOpenActivity = useCallback(() => {
    setShowNotifications(false);
    router.push("/activity");
  }, [router]);

  if (!user || pathname !== "/") return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={onMenuToggle}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg hidden sm:block">Spotly</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search hidden gems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 hover:bg-slate-100 border-0 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-slate-600" />
            </button>

            {/* Notification Bell */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notificationsCount > 99 ? "99+" : notificationsCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                    <span className="text-sm font-semibold text-slate-900">Notifications</span>
                    <button
                      onClick={handleOpenActivity}
                      className="text-xs font-semibold text-emerald-700"
                    >
                      Open Activity
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto px-3 py-2 space-y-2">
                    {notifications.length === 0 && (
                      <p className="text-xs text-slate-500">No notifications yet.</p>
                    )}
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex gap-2 rounded-lg border border-slate-100 px-2 py-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                          {notification.activity.actorAvatarUrl ? (
                            <img
                              src={notification.activity.actorAvatarUrl}
                              alt={notification.activity.actorName}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800">
                            {notification.activity.actorName}
                          </p>
                          <p className="text-xs text-slate-600 truncate">
                            {notification.activity.message}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Link */}
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.email || "User"}
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-3 animate-in slide-in-from-top-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search hidden gems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-0 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
