"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  BUDDY_INTEREST_OPTIONS,
  BuddyProfile, 
  BuddyRequest, 
  TravelStyle,
  fetchBuddyProfiles,
  fetchBuddyRequests,
  fetchFilteredBuddyProfiles,
  getOrCreateConversation,
  calculateBuddyMatchScore
} from "@/lib/services/buddies";
import { useToast } from '@/context/ToastContext';


import { BuddyFilters } from "@/components/buddies/BuddyFilters";
import { TopMatches } from "@/components/buddies/TopMatches";
import { NearbyExplorers } from "@/components/buddies/NearbyExplorers";
import { BuddyRequestsFeed } from "@/components/buddies/BuddyRequestsFeed";
import { TripCompanions } from "@/components/buddies/TripCompanions";
import { ExplorerCard } from "@/components/buddies/ExplorerCard";
import { ChatDrawer } from "@/components/buddies/ChatDrawer";
import { PlanTripModal } from "@/components/buddies/PlanTripModal";

export default function BuddiesPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<BuddyProfile[]>([]);
  const [requests, setRequests] = useState<BuddyRequest[]>([]);
  const [sourceWarning, setSourceWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: "",
    style: "balanced" as TravelStyle,
    interests: [] as string[],
    availability: "Flexible"
  });
  const [openChatWith, setOpenChatWith] = useState<string | null>(null);
  const addToast = useToast();

  // Load data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const profileData = await fetchBuddyProfiles(user.id);
        const requestData = await fetchBuddyRequests();

        setProfiles(profileData.profiles);
        setSourceWarning(profileData.warning);
        setRequests(requestData);
      } catch (error) {
        console.error("Failed to load buddies data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Refetch profiles on filter change
  useEffect(() => {
    if (!user || Object.keys(filters).every(key => !filters[key as keyof typeof filters])) return;

    const refetch = async () => {
      try {
        const { profiles: newProfiles } = await fetchFilteredBuddyProfiles(user.id, filters);
        setProfiles(newProfiles);
        addToast('Profiles updated based on your filters');
      } catch (error) {
        console.error('Refetch failed:', error);
        addToast('Failed to update profiles');
      }
    };

    refetch();
  }, [filters.city, filters.style, filters.interests, filters.availability, user, addToast]);

  // Filter profiles based on current filters
  const filteredProfiles = useMemo(() => {
    return profiles
      .map(profile => ({
        ...profile,
        score: calculateBuddyMatchScore(profile, {
          city: filters.city,
          interests: filters.interests,
          style: filters.style
        })
      }))
      .sort((a, b) => b.score - a.score);
  }, [profiles, filters]);

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    // Search handled in TopMatches component
  }, []);

  const handleOpenChat = useCallback(async (buddyUserId: string) => {
    if (!user) return;
    try {
      const { conversationId } = await getOrCreateConversation(user.id, buddyUserId);
      setOpenChatWith(buddyUserId);
      addToast('Chat opened');
    } catch (error) {
      console.error('Failed to open chat:', error);
      addToast('Failed to start chat');
    }
  }, [user, addToast]);

  const [openPlanWith, setOpenPlanWith] = useState<string | null>(null);

  const handlePlanTrip = useCallback((buddyUserId: string) => {
    setOpenPlanWith(buddyUserId);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Buddy Finder</h1>
          <p className="text-slate-600 mb-8">Log in to find travel companions</p>
          <button className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-lg">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 md:px-6 lg:px-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Buddy Finder</h1>
        <p className="text-xl font-semibold text-slate-700 max-w-2xl mx-auto leading-tight">
          Connect with explorers who share your travel style, interests, and availability
        </p>
        {sourceWarning && (
          <div className="mt-4 max-w-md mx-auto p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800">{sourceWarning}</p>
          </div>
        )}
      </header>

      <main className="space-y-6">
        {/* Filters */}
        <BuddyFilters 
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />

        {/* Top Matches */}
        <TopMatches 
          profiles={filteredProfiles} 
          onSearchChange={handleSearchChange}
          onChatOpen={handleOpenChat}
          onPlanTrip={handlePlanTrip}
        />

        {/* Nearby Explorers */}
        <NearbyExplorers 
          profiles={filteredProfiles} 
          cityFilter={filters.city}
          onChatOpen={handleOpenChat}
          onPlanTrip={handlePlanTrip}
        />

        {/* Buddy Requests */}
        <BuddyRequestsFeed requests={requests} onMessage={handleOpenChat} onJoinAdventure={(id) => addToast('Joined request ' + id.slice(0,8))} />

        {/* Trip Companions */}
        <TripCompanions profiles={filteredProfiles} />
      </main>

      {openChatWith && (
        <ChatDrawer 
          conversationPartnerId={openChatWith}
          onClose={() => setOpenChatWith(null)}
        />
      )}
      {openPlanWith && (
        <PlanTripModal 
          buddyUserId={openPlanWith}
          onClose={() => setOpenPlanWith(null)}
        />
      )}
    </div>
  );
}

