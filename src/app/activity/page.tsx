"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ActivityItem,
  NotificationItem,
  fetchActivityFeed,
  fetchNotifications,
  markNotificationAsRead,
} from "@/lib/services/activity";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("nl-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getNotificationText(activity: ActivityItem) {
  switch (activity.type) {
    case "trip_liked":
      return "liked your trip";
    case "buddy_request_sent":
      return "sent you a buddy request";
    case "buddy_request_accepted":
      return "accepted your buddy request";
    case "badge_earned":
      return activity.message;
    case "new_follower":
      return "started following you";
    default:
      return activity.message;
  }
}

export default function ActivityPage() {
  const { user } = useAuth();

  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"notifications" | "feed">("notifications");

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      void (async () => {
        if (!active) return;

        if (!user?.id) {
          setFeed([]);
          setNotifications([]);
          setLoading(false);
          return;
        }

        setLoading(true);

        const [feedData, notificationData] = await Promise.all([
          fetchActivityFeed(40),
          fetchNotifications(user.id, 40),
        ]);

        if (!active) return;

        setFeed(feedData);
        setNotifications(notificationData);
        setLoading(false);
      })();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user?.id]);

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const handleMarkRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              readAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications
      .filter((item) => !item.readAt)
      .map((item) => item.id);

    await Promise.all(unreadIds.map((id) => markNotificationAsRead(id)));

    setNotifications((prev) =>
      prev.map((item) =>
        !item.readAt
          ? {
              ...item,
              readAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  // Filter out excluded types
  const filteredNotifications = notifications.filter(
    (n) =>
      !n.activity.type.includes('viewed_hotspot') &&
      !n.activity.type.includes('viewed_trip') &&
      n.activity.type !== 'feed_item'
  );

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
        Please log in to view activity and notifications.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Activity</p>
        <h1 className="text-2xl font-bold text-slate-900">Updates from your network</h1>
        <p className="text-sm text-slate-600">
          Track new wishlist and favorite updates, trips and photo updates from people you follow.
        </p>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              activeTab === "notifications" ? "bg-white text-slate-900" : "text-slate-600"
            }`}
          >
            Notifications ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              activeTab === "feed" ? "bg-white text-slate-900" : "text-slate-600"
            }`}
          >
            Feed
          </button>
        </div>

        {unreadCount > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Mark all as read
            </button>
          </div>
        )}
      </section>

      {loading && <p className="text-sm text-slate-600">Loading activity...</p>}

      {!loading && activeTab === "notifications" && (
        <section className="space-y-3">
          {filteredNotifications.length === 0 && (
            <p className="text-sm text-slate-600">No notifications yet.</p>
          )}

          {filteredNotifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-xl border p-3 shadow-sm ${
                notification.readAt
                  ? "border-slate-200 bg-white"
                  : "border-emerald-200 bg-emerald-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-200">
                    {notification.activity.actorAvatarUrl ? (
                      <Image
                        src={notification.activity.actorAvatarUrl}
                        alt={notification.activity.actorName}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {notification.activity.actorName}
                    </p>
                    <p className="text-sm text-slate-700">{getNotificationText(notification.activity)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>

                {!notification.readAt && (
                  <button
                    onClick={() => {
                      void handleMarkRead(notification.id);
                    }}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && activeTab === "feed" && (
        <section className="space-y-3">
          {feed.length === 0 && <p className="text-sm text-slate-600">No feed items yet.</p>}

          {feed.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-200">
                  {item.actorAvatarUrl ? (
                    <Image
                      src={item.actorAvatarUrl}
                      alt={item.actorName}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.actorName}</p>
                  <p className="text-sm text-slate-700">{item.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}


