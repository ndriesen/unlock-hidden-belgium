# Unused Code and Files Analysis

This document lists all unused code, files, and potential dead code in the Unlock Hidden Belgium project.

---

## 1. Unused Service Files (`src/lib/services/`)

These service files exist but are **never imported** anywhere in the codebase:

| File | Description | Status |
|------|-------------|--------|
| `achievements.ts` | Badge/achievement system | **UNUSED** |
| `activityTracking.ts` | Activity tracking service | **UNUSED** |
| `badgeEngine.ts` | Badge unlock engine | **UNUSED** |
| `influencers.ts` | Influencer mentions | Only used in hotspots/page.tsx for display |
| `monetization.ts` | Subscription plans | Only used in pricing/page.tsx |
| `routePlanner.ts` | Route planning utility | **UNUSED** |
| `tripPlanner.ts` | Trip planning service | **UNUSED** |
| `xpEngine.ts` | XP/gamification engine | **UNUSED** |

### Partially Used Services:
- **`gamification.ts`** - Only `fetchUserProgress` is used in Sidebar.tsx
- **`gamificationLevels.ts`** - Only used in Sidebar.tsx and profile/page.tsx
- **`leagues.ts`** - Only used in LeaguePanel.tsx
- **`quests.ts`** - Only used in NearbyQuests.tsx and page.tsx
- **`ranking.ts`** - Only used in GlobeHero.tsx, page.tsx, and hotspots/page.tsx
- **`engagement.ts`** - Only `fetchVisitStatsForUser` is used
- **`activity.ts`** - Only `fetchUnreadNotificationCount` and `recordActivity` are used
- **`hotspots.ts`** - Used in several places
- **`media.ts`** - Used for signed URLs
- **`buddies.ts`** - Used in buddies/page.tsx
- **`myHotspots.ts`** - Used in hotspots/my/page.tsx
- **`hotspotSocial.ts`** - Used for like/save functionality
- **`hotspotMedia.ts`** - Used for media operations
- **`addHotspot.ts`** - Used in AddHotspotModal.tsx
- **`explore.ts`** - Used in hotspots/page.tsx
- **`tripBuilder.ts`** - Used extensively for trips
- **`tripLocationTracking.ts`** - Used in trips/[id]/page.tsx
- **`userHotspots.ts`** - Used in HotspotCollectionPage.tsx

---

## 2. Unused Hooks (`src/lib/hooks/`)

| File | Description | Status |
|------|-------------|--------|
| `useViewportPreloader.ts` | Viewport preloading hook | **UNUSED** |

---

## 3. Unused Components (`src/components/`)

### Completely Unused Components:

| File | Description | Status |
|------|-------------|--------|
| `Notifications.tsx` | Notifications component | **UNUSED** |
| `badgeUnlockModal.tsx` | Badge unlock modal | **UNUSED** |
| `levelUpModal.tsx` | Level up celebration modal | **UNUSED** |
| `StopDrawer.tsx` | Trip stop drawer | **UNUSED** |

### Partially Used Components:
- **`BottomSheet.tsx`** - **UNUSED**
- **`HotspotPanel.tsx`** - Used in page.tsx
- **`HotspotSheet.tsx`** - Used in page.tsx
- **`BadgeCelebration.tsx`** - Imported in page.tsx but conditionally rendered
- **`MissionDeck.tsx`** - Imported in page.tsx but conditionally rendered
- **`MapView.tsx`** - Used via dynamic import in hotspots/[id] and hotspots/my pages

---

## 4. Unused Context Providers (`src/context/`)

Both contexts are used:
- `AuthContext.tsx` ✅
- `SearchContext.tsx` ✅

---

## 5. Unused Library Files

### Root Level (`lib/` folder - outside src/):

| File | Description | Status |
|------|-------------|--------|
| `lib/services/hotspotImageEnrichment.ts` | Standalone image enrichment script | **UNUSED** (likely a script meant to be run separately) |

### `src/lib/constants/`:

| File | Description | Status |
|------|-------------|--------|
| `ranking.ts` | Ranking constants | **UNUSED** (only ranking.ts service is used, not this file) |

---

## 6. Unused Utility Files (`src/lib/`)

| File | Description | Status |
|------|-------------|--------|
| `src/lib/cache/imageRequestCache.ts` | Image request deduplication cache | **UNUSED** |
| `src/lib/network/concurrencyLimiter.ts` | Concurrency limiter for images | **UNUSED** |
| `src/lib/security/passwordValidation.ts` | Password validation utility | **UNUSED** |
| `src/lib/Supabase/client.ts` | Server-side Supabase client | **UNUSED** (only browser-client.ts is used) |

---

## 7. Unused Home Page Components (`src/components/home/`)

These components exist but may be orphaned or conditionally rendered:

| File | Status | Notes |
|------|--------|-------|
| `HeroSection.tsx` | Used in page.tsx | |
| `SkeletonCard.tsx` | Likely used for loading states | |

---

## 8. Unused Documentation Files

| File | Description | Status |
|------|-------------|--------|
| `TODO_HOMEPAGE.md` | Homepage TODO | **ORPHANED** |
| `TODO_HOMEPAGE_REDESIGN.md` | Homepage redesign TODO | **ORPHANED** |
| `TODO_RANKING.md` | Ranking TODO | **ORPHANED** |
| `TODO_ONBOARDING.md` | Onboarding TODO | **ORPHANED** |
| `HOMEPAGE_REDESIGN_PLAN.md` | Homepage redesign plan | **ORPHANED** |
| `HOMEPAGE_REDESIGN_TODO.md` | Homepage redesign TODO | **ORPHANED** |
| `docs/backend-migration-checklist.md` | Migration checklist | **ORPHANED** |
| `docs/security-review.md` | Security review | **ORPHANED** |

---

## 9. Unused Scripts/Configuration

| File | Description | Status |
|------|-------------|--------|
| `fix-modal.ps1` | PowerShell script | **ORPHANED** |
| `fix-myhotspots.ps1` | PowerShell script | **ORPHANED** |
| `test.txt` | Test file | **ORPHANED** |
| `test-tool.txt` | Test file | **ORPHANED** |
| `scripts/enrich-hotspots.mjs` | Image enrichment script | **ORPHANED** (standalone script) |
| `e` | Unnamed file in root | **ORPHANED** |

---

## 10. Suspicious/Incomplete Files

| File | Description | Status |
|------|-------------|--------|
| `database/migrations/20260330_fix` | Migration file without `.sql` extension | **INCOMPLETE** |
| `c:/Users/Gebruiker/Downloads/client_secret_...json` | Google credentials file in project | **SECURITY RISK** - Should not be in repo |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Completely unused service files | 5 |
| Partially used service files | 13 |
| Unused hooks | 1 |
| Completely unused components | 4 |
| Unused utility/library files | 5 |
| Orphaned documentation files | 8 |
| Orphaned scripts/config | 6 |

---

## Recommendations

1. **Remove unused services**: `achievements.ts`, `activityTracking.ts`, `badgeEngine.ts`, `routePlanner.ts`, `tripPlanner.ts`, `xpEngine.ts`

2. **Remove unused hooks**: `useViewportPreloader.ts`

3. **Remove unused components**: `Notifications.tsx`, `badgeUnlockModal.tsx`, `levelUpModal.tsx`, `StopDrawer.tsx`, `BottomSheet.tsx`

4. **Clean up unused utilities**: `imageRequestCache.ts`, `concurrencyLimiter.ts`, `passwordValidation.ts`, `client.ts`

5. **Remove orphaned docs**: All `TODO_*.md` and `HOMEPAGE_REDESIGN_*.md` files

6. **Remove orphaned scripts**: PowerShell scripts and test files

7. **Fix security issue**: Remove Google credentials file from repository

8. **Investigate constants**: Check if `src/lib/constants/ranking.ts` should be used

---

*Generated on: Analysis of codebase import patterns*

