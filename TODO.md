# Badge & Gamification Full Implementation TODO

Status: In Progress

## Checklist (from approved plan):

- [x] 1. Seed DB with badges_rows (1).sql and app_rules_rows.sql (ready, user run in Supabase)
- [x] 2. Extended src/lib/services/badgeEngine.ts: computeUserStats async with all counts/queries (reviews/photos/buddies/invites/hotspots/shares/trips/daily/cities/countries), added cases for review_count/photo/buddy/friend_invite/hotspot_added/share/trip_with_buddy/daily/city/country/region_full (core 45 covered, specials approx)
- [ ] 3. Extend src/lib/services/gamification.ts: add trigger fns for missing actions (addReview, uploadPhoto, toggleBuddy, sendInvite, addHotspot, createTripWithBuddy, createShare, etc.), integrate awardXP
- [x] 4. Created missing services: reviews.ts, userPhotos.ts, invites.ts, shares.ts, userBuddies.ts, trips.ts with getCount/triggers
- [x] 5. Updated ReviewsSection.tsx (use addReview), AddHotspotModal.tsx (service trigger), services integrated
- [ ] 6. Enhance src/lib/services/activity.ts (badge-specific messages), src/hooks/useGamification.ts (multi-badge), src/components/badgeUnlockModal.tsx (full badge info)
- [ ] 7. Test all 45 badges: trigger actions → unlocks/XP/toasts/feed/notifs, anti-abuse
- [ ] 8. Update TODO_BADGES.md, TODO_GAMIFICATION.md, attempt_completion

**Next step marked after each completion.**

