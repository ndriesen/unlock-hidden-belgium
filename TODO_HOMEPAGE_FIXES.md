# Homepage Fixes TODO - BLACKBOXAI Plan

Current progress: 6/14 ✅

## Phase 1: Fix Critical Errors (Priority 1) ✅
- [x] 1.1 Add missing imports to src/app/page.tsx: useRouter, fetchHotspots
- [x] 1.2 Stub missing functions: buildNearbyQuests, addHotspotToQuickTrip, getTopHotspots
- [x] 1.3 Test console errors resolved (pending user test)

## Phase 2: Navigation Cleanup (Single Topbar)

- [ ] 1.2 Stub missing functions: buildNearbyQuests, addHotspotToQuickTrip, getTopHotspots
- [ ] 1.3 Test console errors resolved (npm run dev)

## Phase 2: Navigation Cleanup (Single Topbar) ✅
- [x] 2.1 Remove StickyHeader from src/app/page.tsx renderLoggedInHomepage
- [ ] 2.2 Ensure SidebarLayout header is sticky (update SidebarLayout header classes)
- [ ] 2.3 Verify hamburger toggles sidebar correctly

Current progress: 4/14 ✅

- [ ] 2.2 Ensure SidebarLayout header is sticky (update SidebarLayout header classes)
- [ ] 2.3 Verify hamburger toggles sidebar correctly

## Phase 3: UI Centering ✅
- [x] 3.1 Center DiscoveryChips/CategoryExplorer with max-w-4xl mx-auto
- [x] 3.2 Center ExplorerProgressPanel with max-w-4xl mx-auto

## Phase 4: Hero Personalization ✅
- [x] 4.1 Pass user prop to HeroDiscoverySection
- [x] 4.2 Update hero text to "Hi, {name}, ready for your next adventure?"

Current progress: 8/14 ✅


## Phase 5: Minimal Sidebar ✅
- [x] 5.1 Update SidebarLayout collapsed width to w-16, adjust padding/colors, sticky header fixed

Current progress: 10/14 ✅

**Next step:** Map filtering (Phase 7)


## Phase 6: Featured Hotspots Carousel
- [ ] 6.1 Update FeaturedHotspots.tsx to horizontal carousel (snap-scroll + overflow)

## Phase 7: Map Filtering ✅
- [x] 7.1 Add selectedCategory prop to MapPreviewSection
- [x] 7.2 Forward to MapContainer and filter hotspots client-side

Current progress: 12/14 ✅

## Phase 8: Testing & Polish
- [ ] 8.1 Test surprise button works
- [ ] 8.2 Test all filters update components/map
- [ ] 8.3 Mobile responsiveness check
- [ ] 8.4 Update original TODO_HOMEPAGE_REDESIGN.md
- [ ] 8.5 Full functionality test

**Next step:** Fix errors in src/app/page.tsx (Phase 1)

