"use client";

import { useEffect, useState, use } from 'react';
import { getPublicProfileData, type PublicProfileData } from '@/lib/services/publicProfiles';
import { type Hotspot } from '@/types/hotspot';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { OverviewSection } from '@/components/profile/OverviewSection';
import { HotspotGrid } from '@/components/profile/HotspotGrid';
import { PhotosGallery } from '@/components/profile/PhotosGallery';
import { BadgesGrid } from '@/components/profile/BadgesGrid';
import { BuddiesList } from '@/components/profile/BuddiesList';
import { ActivityFeed } from '@/components/profile/ActivityFeed';
import { TripsList } from '@/components/profile/TripsList';

export default function PublicProfilePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const id = use(params).id;
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const profileData = await getPublicProfileData(id);
        setData(profileData);
      } catch (err) {
        setError('Failed to load profile data');
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">
            👤
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile not found</h1>
          <p className="text-slate-600 mb-6">The user may have changed their privacy settings or the profile doesn't exist.</p>
        </div>
      </div>
    );
  }

  const stats = data.stats;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection data={data} />;
      case 'trips':
        return <TripsList trips={data.trips} />;
      case 'hotspots':
        return (
          <div className="space-y-8">
            <HotspotGrid 
              hotspots={data.recentHotspots} 
              title="Recent Visits" 
              limit={6} 
            />
            <HotspotGrid 
              hotspots={data.visitedHotspots} 
              title="All Visited" 
            />
          </div>
        );
      case 'photos':
        return <PhotosGallery photos={data.photos} />;
      case 'badges':
        return <BadgesGrid badges={data.badges} />;
      case 'buddies':
        return <BuddiesList buddies={data.buddies} />;
      case 'activity':
        return <ActivityFeed activities={data.activities} />;
      default:
        return <OverviewSection data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <ProfileTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}

