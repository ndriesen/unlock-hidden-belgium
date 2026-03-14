# Hotspot Ranking Engine Implementation

## Step 1: Database Migration
- [x] 1.1 Add views_count, trip_visits_count columns to hotspots
- [x] 1.2 Add indexes on saves_count, created_at
- [x] 1.3 Create trigger function for updating counters
- [x] 1.4 Update user_activity with additional action types
- [x] 1.5 Create materialized view hotspot_rankings
- [ ] 1.6 Create scheduled job for refreshing materialized view

## Step 2: Backend Service Layer
- [x] 2.1 Create ranking constants file
- [x] 2.2 Create ranking service functions (graceful fallback)
- [x] 2.3 Create activity tracking service

## Step 3: Frontend Integration
- [x] 3.1 Update GlobeHero to fetch ranked hotspots
- [x] 3.2 Update homepage FeaturedHotspots with ranking
- [ ] 3.3 Update Map page to use ranking

## Step 4: Testing & Validation
- [ ] 4.1 Run SQL migration on Supabase
- [ ] 4.2 Test materialized view refresh
- [ ] 4.3 Test frontend integration

