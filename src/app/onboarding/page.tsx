"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/Supabase/browser-client';
import { useAuth } from '@/context/AuthContext';
import OnboardingWizard from '@/components/auth/OnboardingWizard';
import type { UserProfile } from '@/types/user';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      setNeedsOnboarding(!data?.onboarding_completed);
      setLoading(false);
    };

    checkOnboarding();
  }, [user, router]);

  const handleComplete = async (data: Pick<UserProfile, 'interests' | 'exploration_style' | 'city'>) => {
    if (!user) return;

    await supabase.from('users').update({
      interests: data.interests,
      exploration_style: data.exploration_style,
      city: data.city,
      onboarding_completed: true,
    }).eq('id', user.id);

    router.push('/hotspots');
  };

  const handleSkip = async () => {
    if (!user) return;

    await supabase.from('users').update({
      onboarding_completed: false,
    }).eq('id', user.id);

    router.push('/hotspots');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!needsOnboarding || !user) router.push('/hotspots');

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-emerald-50">
      {user && (
        <OnboardingWizard 
          userId={user.id}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}
    </main>
  );
}

