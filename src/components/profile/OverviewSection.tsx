 "use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { isFollowing, toggleFollow } from '@/lib/services/follows';
import { PublicProfileData } from '@/lib/services/publicProfiles';

interface OverviewSectionProps {
  data: PublicProfileData;
}

export function OverviewSection({ data }: OverviewSectionProps) {
  const profile = data.profile;
  const stats = data.stats;
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();

  const profileId = params.id as string;

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
  const xpForNext = 500;
  const xpProgress = (profile.xpPoints / xpForNext) * 100;

  const navigateTo = (section: string) => {
    router.push(`/profile/${profileId}/${section}`);
  };

  const statsData = [
    { label: 'Activity', value: stats.level, icon: '⭐', section: 'activity' },
    { label: 'Hotspots', value: stats.visitedCount, icon: '📍', section: 'hotspots' },
    { label: 'Photos', value: `${stats.provincesCount}/10`, icon: '🗺️', section: 'photos' },
    { label: 'Badges', value: stats.badgesCount, icon: '🏆', section: 'badges' },
    { label: 'Trips', value: stats.tripsCount, icon: '🛤️', section: 'trips' },
    { label: 'Followers', value: stats.buddiesCount, icon: '👥', section: 'followers' },
  ];

  return (
    <div className="space-y-4">
      {/* Hero - Smaller */}
      <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white overflow-hidden mb-6">
        {currentUser ? (
          showFollowButton ? (
            <button
              type="button"
              className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl shadow-xl cursor-pointer hover:shadow-2xl hover:bg-white transition-all flex items-center gap-1 text-xs font-bold border border-emerald-200/50 hover:border-emerald-300 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={followLoading}
              onClick={handleToggleFollow}
              title={isFollowingState ? 'Unfollow' : 'Follow'}
            >
              {followLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-emerald-500 rounded-full animate-spin" />
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
            className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl shadow-xl cursor-pointer hover:shadow-2xl hover:bg-white transition-all flex items-center gap-1 text-xs font-bold border border-slate-200/50 hover:border-slate-300 text-slate-900"
            title="Log in to follow"
          >
            + Follow
          </a>
        )}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10" />
        <div className="relative max-w-sm mx-auto text-center">
          <div className="relative w-24 h-24 mx-auto mb-4 shadow-2xl shadow-black/20 rounded-full overflow-hidden ring-4 ring-white/30">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
          <p className="text-base opacity-90 mb-1">{profile.city || 'Explorer'}</p>
          <p className="text-emerald-100 font-semibold text-sm mb-4">{profile.style}</p>
          
          {/* XP Progress - Smaller */}
          <div className="bg-white/20 backdrop-blur rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Level {level}</span>
              <span>{Math.floor(profile.xpPoints)} XP</span>
            </div>
            <div className="w-full bg-white/30 rounded-lg h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 shadow-inner" 
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats - Smaller, clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {statsData.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigateTo(stat.section)}
            className="group w-full p-3 bg-white rounded-xl shadow-sm text-center hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="text-xl mb-1 flex justify-center">{stat.icon}</div>
            <div className="font-bold text-base leading-tight">{stat.value}</div>
            <div className="text-xs text-slate-500 group-hover:text-emerald-600 transition-colors">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* About & Interests - Smaller */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <span>👋</span>
            About
          </h3>
          <p className="text-slate-700 leading-relaxed text-sm">
            {profile.bio || "Passionate explorer discovering Belgium's hidden gems."}
          </p>
          <p className="text-xs text-emerald-600 font-semibold">
            Availability: {profile.availability}
          </p>
        </div>
        <div className="space-y-2 p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <span>❤️</span>
            Interests
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.length > 0 ? (
              profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg"
                >
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic text-xs">No interests shared</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
