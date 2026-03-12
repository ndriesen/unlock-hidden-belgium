"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Footprints, Trophy, Users, ChevronRight, Sparkles, Image } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "visit" | "wishlist" | "achievement" | "new_hotspot" | "milestone";
  user: {
    name: string;
    avatar?: string;
  };
  hotspot?: {
    name: string;
    province: string;
    imageUrl?: string;
    distance?: number; // in km
  };
  timestamp: string;
  details?: string;
  reactions?: number;
  photoUrl?: string;
}

interface CommunityActivityProps {
  limit?: number;
}

// Mock data for community activity - in production this would come from an API
const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "visit",
    user: { name: "Emma L." },
    hotspot: { name: "Abbaye de Villers", province: "Walloon Brabant", distance: 8 },
    timestamp: "2 min ago",
    reactions: 14,
  },
  {
    id: "2",
    type: "achievement",
    user: { name: "Thomas V." },
    details: "Unlocked 'Explorer' badge",
    timestamp: "15 min ago",
    reactions: 23,
  },
  {
    id: "3",
    type: "wishlist",
    user: { name: "Sophie M." },
    hotspot: { name: "Château de la Hulpe", province: "Walloon Brabant", distance: 12 },
    timestamp: "32 min ago",
    reactions: 8,
  },
  {
    id: "4",
    type: "visit",
    user: { name: "Lucas D." },
    hotspot: { name: "Atomium", province: "Brussels", distance: 5 },
    timestamp: "1 hour ago",
    reactions: 45,
  },
  {
    id: "5",
    type: "milestone",
    user: { name: "Marie K." },
    details: "Reached 50 visits!",
    timestamp: "2 hours ago",
    reactions: 67,
  },
  {
    id: "6",
    type: "new_hotspot",
    user: { name: "Admin" },
    hotspot: { name: "Caves of Han", province: "Luxembourg", distance: 45 },
    timestamp: "3 hours ago",
    reactions: 89,
  },
];

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "visit":
      return Footprints;
    case "wishlist":
      return Heart;
    case "achievement":
      return Trophy;
    case "milestone":
      return Sparkles;
    case "new_hotspot":
      return MapPin;
    default:
      return MapPin;
  }
}

function getActivityColor(type: ActivityItem["type"]) {
  switch (type) {
    case "visit":
      return "bg-emerald-500";
    case "wishlist":
      return "bg-rose-500";
    case "achievement":
      return "bg-amber-500";
    case "milestone":
      return "bg-purple-500";
    case "new_hotspot":
      return "bg-blue-500";
    default:
      return "bg-slate-500";
  }
}

function getActivityText(item: ActivityItem) {
  switch (item.type) {
    case "visit":
      return `visited ${item.hotspot?.name}`;
    case "wishlist":
      return `added ${item.hotspot?.name} to wishlist`;
    case "achievement":
      return item.details;
    case "milestone":
      return item.details;
    case "new_hotspot":
      return `discovered new spot: ${item.hotspot?.name}`;
    default:
      return "did something";
  }
}

function formatDistance(distanceKm: number | undefined): string {
  if (distanceKm === undefined) return "";
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(0)}km`;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CommunityActivity({ limit = 5 }: CommunityActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading - in production, fetch from API
    const timer = setTimeout(() => {
      setActivities(mockActivities.slice(0, limit));
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [limit]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Community</p>
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>
        </div>
        <Link
          href="/activity"
          className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            const initials = getInitials(activity.user.name);

            return (
              <article
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors -mx-2 group"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {activity.user.avatar ? (
                    <img
                      src={activity.user.avatar}
                      alt={activity.user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                      {initials}
                    </div>
                  )}
                  {/* Activity type indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${colorClass} flex items-center justify-center border-2 border-white`}>
                    <Icon className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

              {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">
                    <span className="font-semibold">{activity.user.name}</span>{" "}
                    <span className="text-slate-600">{getActivityText(activity)}</span>
                  </p>
                  
                  {activity.hotspot && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{activity.hotspot.province}</span>
                      {activity.hotspot.distance !== undefined && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">
                            {formatDistance(activity.hotspot.distance)} away
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs text-slate-400">{activity.timestamp}</p>
                    
                    {/* Like Button */}
                    <button 
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 transition-colors"
                      onClick={() => {
                        // Toggle like functionality would go here
                      }}
                    >
                      <Heart className={`w-3.5 h-3.5 ${activity.reactions && activity.reactions > 0 ? 'fill-current text-rose-500' : ''}`} />
                      <span>{activity.reactions || 0}</span>
                    </button>
                    
                    {/* Share Button */}
                    <button 
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-500 transition-colors"
                      onClick={() => {
                        // Share functionality would go here
                        if (navigator.share) {
                          navigator.share({
                            title: `${activity.user.name} discovered a hotspot`,
                            text: `Check out this hidden gem!`,
                          }).catch(() => {});
                        }
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Photo thumbnail if available */}
                {activity.photoUrl && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={activity.photoUrl}
                      alt="Activity photo"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Join CTA */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <Link
          href="/buddies"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors"
        >
          <Users className="w-4 h-4" />
          Find explorers nearby
        </Link>
      </div>
    </section>
  );
}

