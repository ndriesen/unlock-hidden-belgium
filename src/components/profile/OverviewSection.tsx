"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isFollowing, toggleFollow } from '@/lib/services/follows';
import { PublicProfileData } from '@/lib/services/publicProfiles';

interface OverviewSectionProps {
  data: PublicProfileData;
}

export function OverviewSection({ data }: OverviewSectionProps) {
  const profile = data.profile;
  const stats = data.stats;
  const { user: currentUser } = useAuth();

  const [isFollowingState, setIsFollowingState] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  if (!profile) {
    return <div className="text-center py-12 text-slate-500">Profile not found</div>;
  }

  const showFollowButton = Boolean(
  currentUser?.id && profile?.id && currentUser.id !== profile.id
);

  useEffect(() => {
    async function checkFollowing() {
      if (currentUser?.id && profile?.id && currentUser.id !== profile.id) {
        try {
          const following = await isFollowing(currentUser.id, profile.id);
          setIsFollowingState(following);
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
    }
    checkFollowing();
  }, [currentUser?.id, profile.id]);

  const handleToggleFollow = async () => {
    console.log(currentUser?.id && profile.id)
    if (!currentUser?.id || currentUser.id === profile.id || followLoading) return;

    setFollowLoading(true);
    try {
      const newStatus = await toggleFollow(currentUser.id, profile.id);
      setIsFollowingState(newStatus);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const level = stats.level;
  const xpForNext = 500; // From gamification service
  const xpProgress = (profile.xpPoints / xpForNext) * 100;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white overflow-hidden mb-8">
        {/* Follow button */}
        {currentUser ? (
          showFollowButton ? (
            <button
              type="button"
              className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-2xl cursor-pointer hover:shadow-3xl hover:bg-white transition-all flex items-center gap-1.5 text-sm font-bold border border-emerald-200/50 hover:border-emerald-300 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl"
              disabled={followLoading}
              onClick={handleToggleFollow}
              title={isFollowingState ? 'Unfollow' : 'Follow'}
              
            >
              {followLoading ? (
                <div className="w-4 h-4 border-2 border-slate-500 border-t-emerald-500 rounded-full animate-spin" />
              ) : isFollowingState ? (
                <span className="text-emerald-600">✓ Following</span>
              ) : (
                <span>+ Follow</span>
              )}
            </button>
          ) : null
        ) : (
          <a
            href="/auth/signin"
            className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-2xl cursor-pointer hover:shadow-3xl hover:bg-white transition-all flex items-center gap-1.5 text-sm font-bold border border-slate-200/50 hover:border-slate-300 text-slate-900"
            title="Log in to follow"
          >
            + Follow
          </a>
        )}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10" />
        <div className="relative max-w-md mx-auto text-center">
          <div className="relative w-28 h-28 mx-auto mb-6 shadow-2xl shadow-black/20 rounded-full overflow-hidden ring-4 ring-white/30">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
          <p className="text-lg opacity-90 mb-1">{profile.city || 'Explorer'}</p>
          <p className="text-emerald-100 font-semibold mb-6">{profile.style}</p>
          
          {/* XP Progress */}
          <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Level {level}</span>
              <span>{Math.floor(profile.xpPoints)} XP</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 shadow-inner" 
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Level', value: stats.level, icon: '⭐' },
          { label: 'Hotspots', value: stats.visitedCount, icon: '📍' },
          { label: 'Provinces', value: stats.provincesCount + '/10', icon: '🗺️' },
          { label: 'Badges', value: stats.badgesCount, icon: '🏆' },
          { label: 'Trips', value: stats.tripsCount, icon: '🛤️' },
          { label: 'Buddies', value: stats.buddiesCount, icon: '👥' },
        ].map((stat) => (
          <div key={stat.label} className="group p-4 bg-white rounded-2xl shadow-sm text-center hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="font-bold text-lg">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* About & Interests */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3 p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>👋</span>
            About
          </h3>
          <p className="text-slate-700 leading-relaxed">
            {profile.bio || "Passionate explorer discovering Belgium's hidden gems."}
          </p>
          <p className="text-sm text-emerald-600 font-semibold">
            Availability: {profile.availability}
          </p>
        </div>
        <div className="space-y-3 p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>❤️</span>
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.length > 0 ? (
              profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full"
                >
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic text-sm">No interests shared</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
