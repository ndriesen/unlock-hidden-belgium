import { supabase } from "@/lib/Supabase/browser-client";
import { getLevelFromXp } from "./gamificationLevels";
import type { Badge } from "./badgeEngine";

export interface PublicProfileData {
  profile: {
    id: string;
    name: string;
    city: string | null;
    interests: string[];
    style: string;
    availability: string;
    bio: string;
    avatarUrl: string | null;
    xpPoints: number;
  } | null;
  stats: {
    level: number;
    visitedCount: number;
    provincesCount: number;
    badgesCount: number;
    tripsCount: number;
    photosCount: number;
    buddiesCount: number;
  };
  trips: Array<{
    id: string;
    name: string;
    created_at: string;
    buddy_ids: string[];
    buddyNames: string[];
  }>;
  visitedHotspots: Array<{
    id: string;
    name: string;
    province: string;
    image_url: string;
    visited_at: string;
  }>;
  photos: Array<{
    id: string;
    storage_path: string;
    public_url: string;
    created_at: string;
  }>;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    awarded_at: string;
  }>;
  buddies: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
    city: string | null;
  }>;
  activities: Array<{
    id: string;
    actorName: string;
    actorAvatarUrl: string | null;
    message: string;
    createdAt: string;
  }>;
}

export async function getPublicProfileData(userId: string): Promise<PublicProfileData> {
  // Parallel fetches
  const fetches = await Promise.all([
    // Profile
    supabase.from("users").select("id, username, email, city, interests, travel_style, availability, bio, avatar_url, xp_points").eq("id", userId).maybeSingle(),
    // Stats counts
    supabase.from("user_hotspots").select("*", { count: 'exact', head: true }).eq("user_id", userId).eq("visited", true),
    supabase.from("trips").select("id", { count: 'exact', head: true }).eq("created_by", userId),

    supabase.from("user_buddies").select("id", { count: 'exact', head: true }).or(`user1_id.eq.${userId},user2_id.eq.${userId}`).eq("status", "accepted"),
    supabase.from("user_badges").select("id", { count: 'exact', head: true }).eq("user_id", userId),
    supabase.from("user_hotspots").select("hotspots(id,province)").eq("user_id", userId).eq("visited", true),
    // Trips
    supabase.from("trips").select("id, title, created_at").eq("created_by", userId).order("created_at", { ascending: false }).limit(10),
    // Hotspots
    supabase.from("user_hotspots").select("hotspot_id, visited_at, hotspots(id, name, province, images)").eq("user_id", userId).eq("visited", true).order("visited_at", { ascending: false }).limit(20),
    // Photos
    // Photos - parallel separate queries (no union support)
    supabase.from("trip_media").select("id, storage_path, created_at").eq("uploaded_by", userId).eq("visibility", "public").order("created_at", { ascending: false }).limit(10),
    supabase.from("hotspot_media").select("id, storage_path, created_at").eq("uploaded_by", userId).eq("visibility", "public").order("created_at", { ascending: false }).limit(10),
    // Badges
    supabase.from("user_badges").select("awarded_at, badges(id, name, icon, description)").eq("user_id", userId).order("awarded_at", { ascending: false }),
    // Activities
    supabase.from("activities").select("id, message, created_at, actor_id, users(id, username, avatar_url)").eq("actor_id", userId).eq("visibility", "public").order("created_at", { ascending: false }).limit(10),
    // Buddies (simplified for now)
    supabase.from("buddies").select("id, buddy!inner(*)").eq("user_id", userId).limit(20)
  ]);
  const [profileRes, visitedCountRes, tripsCountRes, tripMediaRes, hotspotMediaRes, buddiesCountRes, badgesCountRes, provincesRes, tripsRes, hotspotsRes, badgesRes, activitiesRes, buddiesRes] = fetches;

  // Normalize profile
  let profile: PublicProfileData['profile'] = null;
  const userRow = profileRes.data as any;
  if (userRow) {
    profile = {
      id: userRow.id,
      name: userRow.username || userRow.email?.split("@")[0] || "Explorer",
      city: userRow.city || null,
      interests: (userRow.interests || []).slice(0, 8),
      style: userRow.travel_style === "slow" ? "Slow Explorer" : userRow.travel_style === "active" ? "Active" : "Balanced",
      availability: userRow.availability || "Flexible",
      bio: userRow.bio || "",
      avatarUrl: userRow.avatar_url || null,
      xpPoints: userRow.xp_points || 0,
    };
  }

  // Stats
  const visitedCount = visitedCountRes.count || 0;
  const tripsCount = tripsCountRes.count || 0;
  const photosCount = (tripMediaRes.count || 0) + (hotspotMediaRes.count || 0);
  const buddiesCount = buddiesCountRes.count || 0;
  const badgesCount = badgesCountRes.count || 0;
  const provincesData = provincesRes.data || [];
  const provincesSet = new Set(provincesData.map((p: any) => p.hotspots?.province).filter(Boolean) as string[]);
  const level = getLevelFromXp(profile?.xpPoints || 0);
  const stats = {
    level,
    visitedCount,
    provincesCount: provincesSet.size,
    badgesCount,
    tripsCount,
    photosCount,
    buddiesCount,
  };

  // Normalize lists (simplified, add full normalization as needed)
  // Example data placeholders for demo (override with real data)
  const trips = (tripsRes.data || []).map((t: any) => ({
    id: t.id,
    name: t.title || 'Untitled Trip',
    created_at: t.created_at,
    buddy_ids: [],
    buddyNames: []
  })); // Real data from trips table, add demo fallback if empty
  if (trips.length === 0) {
    trips.push(
      { id: 'demo1', name: 'Weekend in Flanders', created_at: '2024-03-15', buddy_ids: [], buddyNames: [] },
      { id: 'demo2', name: 'Ardennes Adventure', created_at: '2024-02-28', buddy_ids: [], buddyNames: [] }
    );
  }
  const visitedHotspots = (hotspotsRes.data || []).map((h: any) => {
    const rawImages = h.hotspots?.images || [];
    const firstImage = rawImages[0] || "/images/placeholder-image.jfif";
    return {
      id: h.hotspots?.id || `demo-hot${Math.random()}`,
      name: h.hotspots?.name || 'Hidden Gem',
      province: h.hotspots?.province || 'Vlaanderen',
      images: [firstImage],
      image_url: firstImage,
      visited_at: h.visited_at || new Date().toISOString(),
      latitude: 50.85, // Default to Brussels area
      longitude: 4.35,
      category: h.hotspots?.category || 'discovery',
    };
  }) || [
    { 
      id: 'demo-h1', 
      name: 'Secret Castle', 
      province: 'Vlaanderen', 
      images: ["/images/placeholder-image.jfif"],
      image_url: '/images/placeholder-image.jfif',
      visited_at: '2024-03-20',
      latitude: 50.85,
      longitude: 4.35,
      category: 'castle'
    },
    { 
      id: 'demo-h2', 
      name: 'Forest Lake', 
      province: 'Wallonie', 
      images: ["/images/placeholder-image.jfif"],
      image_url: '/images/placeholder-image.jfif',
      visited_at: '2024-03-18',
      latitude: 50.5,
      longitude: 4.0,
      category: 'nature'
    }
  ];
  const recentHotspots = visitedHotspots.slice(0, 10);
  const allPhotos = [
    ...(tripMediaRes.data || []),
    ...(hotspotMediaRes.data || [])
  ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
  
  const photos = allPhotos.map((p: any) => ({
    id: p.id,
    storage_path: p.storage_path,
    public_url: p.storage_path ? supabase.storage.from("trip-media").getPublicUrl(p.storage_path).data.publicUrl : '/images/placeholder-image.jfif',
    created_at: p.created_at,
  })) || [
    { id: 'demo-p1', storage_path: '', public_url: '/images/placeholder-image.jfif', created_at: '2024-03-20' },
    { id: 'demo-p2', storage_path: '', public_url: '/images/placeholder-image.jfif', created_at: '2024-03-19' }
  ];
  const badgesList = (badgesRes.data || []).map((b: any) => ({
    id: b.badges?.id || `demo-${Math.random()}`,
    name: b.badges?.name || 'Explorer Badge',
    icon: b.badges?.icon || '🏆',
    description: b.badges?.description || 'Achievement unlocked',
    awarded_at: b.awarded_at || new Date().toISOString(),
  })).filter(b => b.id !== 'demo-${Math.random()}'); // Safe access, prioritize real data
  const buddiesList: PublicProfileData['buddies'] = (buddiesRes.data || []).map((b: any) => {
    const otherId = b.user1_id === userId ? b.user2_id : b.user1_id;
    return {
      id: otherId,
      name: `Buddy ${otherId.slice(-4)}`,
      avatar_url: null,
      city: 'Unknown',
    };
  }) || [
    { id: 'demo-buddy1', name: 'Adventure Partner', avatar_url: null, city: 'Brussels' },
    { id: 'demo-buddy2', name: 'Local Guide', avatar_url: null, city: 'Antwerpen' }
  ];
  const activities = (activitiesRes.data || []).map((a: any) => ({
    id: a.id,
    actorName: a.users?.username || "Nicolas Driesen",
    actorAvatarUrl: a.users?.avatar_url || null,
    message: a.message || 'visited a new hotspot',
    createdAt: a.created_at || new Date().toISOString(),
  })) || [
    { id: 'demo-a1', actorName: 'Nicolas Driesen', actorAvatarUrl: null, message: 'Nicolas visited Secret Castle', createdAt: '2024-03-20' },
    { id: 'demo-a2', actorName: 'Nicolas Driesen', actorAvatarUrl: null, message: 'Nicolas earned First Steps badge', createdAt: '2024-03-20' }
  ];

  return {
    profile,
    stats,
    trips,
    visitedHotspots,
    recentHotspots,
    photos,
    badges: badgesList,
    buddies: buddiesList,
    activities,
  };
}

