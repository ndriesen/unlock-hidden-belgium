"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BuddiesList } from '@/components/profile/BuddiesList';
import { getFollowers, getFollowing, type Follower } from '@/lib/services/follows';

export default function FollowingPage() {
  const params = useParams();
  const profileId = params.id as string;
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fetchedFollowers, fetchedFollowing] = await Promise.all([
          getFollowers(profileId),
          getFollowing(profileId),
        ]);
        setFollowers(fetchedFollowers);
        setFollowing(fetchedFollowing);
      } catch (error) {
        console.error('Error loading follows:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const currentList = activeTab === 'followers' ? followers : following;
  const title = activeTab === 'followers' ? 'Followers' : 'Following';

  const buddyList = currentList.map(follower => ({
    id: follower.id,
    name: follower.name,
    avatar_url: follower.avatarUrl,
    city: follower.city,
  }));

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-12 space-y-6">
      <button
        onClick={() => window.history.back()}
        className="absolute -left-12 top-4 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="Back to profile"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('followers')}
          className={`pb-4 px-1 border-b-2 font-semibold text-sm ml-6 ${
            activeTab === 'followers' 
              ? 'border-emerald-500 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Followers ({followers.length})
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`pb-4 px-1 border-b-2 font-semibold text-sm ml-6 ${
            activeTab === 'following' 
              ? 'border-emerald-500 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Following ({following.length})
        </button>

      </div>
      <BuddiesList buddies={buddyList} title={title} />
    </div>
  );
}

