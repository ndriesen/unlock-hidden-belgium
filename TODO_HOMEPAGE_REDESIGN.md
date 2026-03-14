# Homepage Redesign - Implementation Plan

## Task Overview
Improve the homepage as a Senior UX Developer and Product Architect with 10 specific requirements.

## Current State Analysis
- ✅ Most sections already exist in correct order
- ⚠️ Two topbars exist (SidebarLayout header + StickyHeader) - needs consolidation
- ⚠️ DiscoveryChips category filtering not connected to sections
- ⚠️ /hotspots page lacks interactive map
- ⚠️ HotspotCard already has distance/popularity
- ⚠️ CommunityActivity needs Like/share

## Implementation Steps

### Phase 1: Navigation (Task 1)
- [ ] 1.1 Remove StickyHeader duplicate - integrate hamburger into SidebarLayout
- [ ] 1.2 Make notification count conditional (show only when > 0)
- [ ] 1.3 Connect StickyHeader menu toggle to sidebar

### Phase 2: Section Order (Task 2)
- [ ] 2.1 Verify/order: StickyHeader → DiscoveryChips → AdventuresNearYou → QuickActions → FeaturedHotspots → TrendingThisWeek → MapPreview → NatureDiscoveries → MissionDeck → LeaguePanel → CommunityActivity → NearbyQuests

### Phase 3: Filter Functionality (Task 3)
- [ ] 3.1 Connect DiscoveryChips selectedCategory to filter all carousel sections
- [ ] 3.2 Update FeaturedHotspots, TrendingHotspots, NatureDiscoveries to accept filtered data

### Phase 4: Map Integration (Task 4)
- [ ] 4.1 Add MapPreview to /hotspots page (use same component as homepage)

### Phase 5: HotspotCard Enhancements (Task 5)
- [ ] 5.1 Verify distance display (already exists)
- [ ] 5.2 Verify popularity indicator (already exists)
- [ ] 5.3 Add consistent hover/active animations (softer shadow, light lift)

### Phase 6: Discovery Sections (Task 6)
- [ ] 6.1 Add emoji icons to carousel titles (🔥, 🏞, 🎉)
- [ ] 6.2 Add compelling subtitles that invite clicking

### Phase 7: Social Interaction (Task 7)
- [ ] 7.1 Add Like button to CommunityActivity posts
- [ ] 7.2 Add share options to CommunityActivity
- [ ] 7.3 Display photos prominently in activity cards

### Phase 8: Micro-interactions (Task 8)
- [ ] 8.1 Add skeleton loaders for dynamic sections (verify existing)
- [ ] 8.2 Add confetti animation for Surprise Me
- [ ] 8.3 Add button click feedback (scale effect)

### Phase 9: Performance (Task 9)
- [ ] 9.1 Verify next/image usage
- [ ] 9.2 Add IntersectionObserver for lazy loading
- [ ] 9.3 Remove unused CSS/JS

### Phase 10: Mobile UX (Task 10)
- [ ] 10.1 Ensure all interactive elements are touch-friendly
- [ ] 10.2 Test and verify mobile performance

## Start Implementation

