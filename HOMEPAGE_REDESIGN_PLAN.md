# Homepage Redesign Implementation Plan

## Executive Summary
Transform the homepage into a world-class discovery experience comparable to Airbnb, Spotify, and Instagram. Focus on content-first discovery, playful exploration, and premium UX.

---

## Phase 1: Content Hierarchy Restructuring (Priority 1)

### 1.1 Remove Full Map from Homepage
- **Current**: Full map takes up 50vh on logged-in homepage
- **Target**: Remove full map, keep only MapPreview (compact)
- **Action**: Remove `<MapContainer>` section from `page.tsx`
- **File**: `src/app/page.tsx`

### 1.2 Create Dedicated /explore Page
- **Current**: `/hotspots` page exists but serves as explore
- **Target**: Create `/explore` page with full map experience
- **Action**: Create new page or enhance existing `/hotspots`
- **File**: `src/app/explore/page.tsx` (or enhance existing hotspots page)

### 1.3 Reorder Homepage Sections
**New Order:**
1. StickyHeader ✅
2. Discovery Chips (NEW)
3. FeaturedHotspots (Featured Gems)
4. TrendingHotspots (NEW - horizontal scroll)
5. QuickActions
6. MapPreview (compact)
7. NatureDiscoveries (NEW - horizontal scroll)
8. SunsetSpots (NEW - horizontal scroll)
9. MissionDeck
10. LeaguePanel
11. CommunityActivity
12. NearbyQuests
13. Pricing Card

---

## Phase 2: Discovery Sections (Priority 2)

### 2.1 Create Discovery Carousel Component
Create reusable carousel component for all discovery sections:
- Horizontal scroll with scroll-snap
- Scroll indicators (left/right arrows)
- Skeleton loading state
- Category header with "View all" link

### 2.2 Add Multiple Discovery Sections
**Section 1: Featured Gems** (already exists as FeaturedHotspots)
- Use ranking service to get top-rated hotspots
- Add distance from user

**Section 2: Trending This Week** (NEW)
- Fetch hotspots with most visits this week
- Add "Trending" badge with fire icon
- Use horizontal carousel

**Section 3: Nature Discoveries** (NEW)
- Filter hotspots by category = "Nature"
- Use horizontal carousel
- Nature-themed styling (green tones)

**Section 4: Best Sunset Spots** (NEW)
- Filter hotspots with "sunset" or "viewpoint" tags
- Use horizontal carousel
- Golden hour styling

### 2.3 Update FeaturedHotspots Component
- Add distance from user
- Add skeleton loading state
- Enhance hover/tap animations
- Add "View all" link

---

## Phase 3: Premium Card Design (Priority 2)

### 3.1 Enhance Hotspot Cards
- **Current**: Good but needs refinement
- **Additions**:
  - Distance from user (calculate from geolocation)
  - Enhanced shadow on hover
  - Scale animation on tap (0.97)
  - Heart bounce animation on wishlist toggle
  - Rating stars display

### 3.2 Card Component Specifications
```
Card Dimensions:
- Width: 260px (mobile), 280px (desktop)
- Image height: 160px (mobile), 180px (desktop)
- Border radius: 16px
- Shadow: 0 2px 8px rgba(0,0,0,0.08)
- Hover shadow: 0 8px 24px rgba(0,0,0,0.12)
- Hover scale: 1.03
- Tap scale: 0.97
- Transition: 200ms ease-out
```

---

## Phase 4: Discovery Chips (Priority 2)

### 4.1 Create DiscoveryChips Component
Replace filter dropdowns with horizontally scrollable chips:

**Categories:**
- All (default)
- Nature
- Bars
- Castles
- Waterfalls
- Viewpoints
- Food
- Culture
- Activity

**Styling:**
- Pill-shaped buttons
- Horizontal scroll with fade edges
- Active state with filled background
- Icons for each category

---

## Phase 5: Micro-interactions (Priority 3)

### 5.1 Button Press Animation
- Scale down to 0.97 on press
- Spring back on release
- Duration: 150ms

### 5.2 Card Hover Lift
- Already implemented: translateY(-4px)
- Add: shadow increase
- Add: subtle scale(1.02)

### 5.3 Wishlist Heart Animation
- Add bounce keyframe animation
- Trigger on toggle
- Duration: 300ms

### 5.4 XP Reward Animation
- Show "+50 XP" floating animation
- Confetti effect on milestone visits
- Badge unlock celebration (already exists)

---

## Phase 6: Skeleton Loading (Priority 3)

### 6.1 FeaturedHotspots Skeleton
- Create 4-6 skeleton cards
- Shimmer animation
- Match exact card dimensions
- Show while loading data

### 6.2 CommunityActivity Skeleton
- Create 3 skeleton items
- Shimmer animation
- Match exact item dimensions

### 6.3 MapPreview Skeleton
- Gradient placeholder
- Skeleton map controls

---

## Phase 7: Social Discovery Improvements (Priority 3)

### 7.1 Enhance CommunityActivity Cards
- Add user avatar (use UI avatars or initials)
- Add photo thumbnail if available
- Add distance from user
- Add reaction counts (likes/hearts)

**Card Structure:**
```
[Avatar] [Username] [timestamp]
         [Activity: visited/wishlisted]
         [Hotspot Name]
         [Location] • [Distance] • ❤️ [Count] explorers liked this
```

### 7.2 Personalization Logic
- New users (0 visits): Show popular/popularity-ranked hotspots
- Active explorers (1-10 visits): Mix of popular and hidden gems
- Advanced explorers (10+ visits): Focus on rare/hidden discoveries

---

## Phase 8: Delight Moments (Priority 3)

### 8.1 Adventure Ready Banner
- Show when user is near an unvisited hotspot
- Animated entrance
- "✨ Adventure ready nearby" message

### 8.2 Trending Today Section
- "🔥 Trending discoveries today" header
- Shows hotspots with recent activity

### 8.3 Surprise Suggestions
- Already have "Surprise Me" button
- Add random discovery card on homepage

---

## Phase 9: Performance Optimization (Priority 1)

### 9.1 Lazy Loading
- ✅ Lazy load map (already implemented)
- ✅ Lazy load images with OptimizedImage
- Add: Intersection Observer for discovery sections

### 9.2 Bundle Optimization
- Code split discovery sections
- Load data on-demand

### 9.3 Target Lighthouse Scores
- Performance > 90
- Accessibility > 95
- Best Practices > 95

---

## File Changes Required

### New Files to Create:
1. `src/components/home/DiscoveryChips.tsx` - Horizontal category chips
2. `src/components/home/TrendingHotspots.tsx` - Trending section
3. `src/components/home/NatureDiscoveries.tsx` - Nature section
4. `src/components/home/SunsetSpots.tsx` - Sunset spots section
5. `src/components/home/SkeletonCard.tsx` - Reusable skeleton
6. `src/components/home/AdventureBanner.tsx` - Delight moment banner
7. `src/app/explore/page.tsx` - Dedicated explore page

### Files to Modify:
1. `src/app/page.tsx` - Restructure sections, remove full map
2. `src/components/home/FeaturedHotspots.tsx` - Add distance, skeleton
3. `src/components/home/CommunityActivity.tsx` - Enhance cards
4. `src/components/home/QuickActions.tsx` - Add animations
5. `src/components/home/MapPreview.tsx` - Add skeleton

### CSS/Tailwind Updates:
- Add custom animations to `globals.css`
- Add skeleton shimmer animation
- Add bounce animation for hearts
- Add XP floating animation

---

## Implementation Order

### Week 1: Foundation
1. Phase 1: Remove full map, reorder sections
2. Phase 9: Performance baseline

### Week 2: Discovery Sections
1. Phase 2: Create carousel component
2. Phase 2: Add Trending/Nature/Sunset sections
3. Phase 4: Discovery Chips

### Week 3: Polish
1. Phase 3: Premium card enhancements
2. Phase 5: Micro-interactions
3. Phase 6: Skeleton loading

### Week 4: Social & Delight
1. Phase 7: Social discovery improvements
2. Phase 8: Delight moments
3. Phase 9: Final performance tuning

---

## Success Metrics

- Increase time on page (discovery)
- Increase scroll depth
- Increase wishlist additions
- Increase hotspot visits from homepage
- Lighthouse Performance > 90
- User satisfaction scores

