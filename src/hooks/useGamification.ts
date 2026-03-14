"use client";

import { useState, useCallback } from 'react';
import { awardXP, markVisited } from '@/lib/services/gamification';
import { useAuth } from '@/context/AuthContext';
import BadgeCelebration from '@/components/BadgeCelebration';
import LevelUpModal from '@/components/levelUpModal';
import BadgeUnlockModal from '@/components/badgeUnlockModal';
import { useToast } from '@/components/Toast'; // assume exists or use context

interface GamificationResult {
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  badges: any[];
  message: string;
}

export function useGamification() {
  const { user } = useAuth();
  const [showBadgeCeleb, setShowBadgeCeleb] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<any>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const addToast = useToast(); // or context

  const triggerAction = useCallback(async (actionKey: string, context = {}) => {
    if (!user) throw new Error('Login required');
    const result: GamificationResult = await awardXP(user.id!, actionKey, context);
    
    // Toast
    addToast(result.message, 'success');

    // Sound/Confetti
    setShowBadgeCeleb(true);
    setTimeout(() => setShowBadgeCeleb(false), 3000);

    // Level up
    if (result.leveledUp) {
      setCurrentLevel(result.newLevel);
      setShowLevelModal(true);
    }

    // Badges
    if (result.badges.length > 0) {
      setCurrentBadge(result.badges[0]);
      setShowBadgeModal(true);
    }

    return result;
  }, [user]);

  const handleVisit = useCallback(async (hotspotId: string) => {
    await triggerAction('visit_hotspot_xp', { hotspotId });
  }, [triggerAction]);

  return {
    triggerAction,
    handleVisit,
    showBadgeCeleb,
    showLevelModal,
    showBadgeModal,
    currentBadge,
    currentLevel,
    setShowLevelModal,
    setShowBadgeModal,
  };
}
