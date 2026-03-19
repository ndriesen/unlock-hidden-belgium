"use client";

import { useEffect, useState, use } from 'react';
import { getPublicProfileData, type PublicProfileData } from '@/lib/services/publicProfiles';
import { OverviewSection } from '@/components/profile/OverviewSection';

export default function PublicProfilePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const id = use(params).id;
  const [data, setData] = useState<PublicProfileData | null>(null);
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

  const profile = data?.profile;

  if (error || !profile) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <OverviewSection data={data} />
        </div>
      </main>
    </div>
  );
}
