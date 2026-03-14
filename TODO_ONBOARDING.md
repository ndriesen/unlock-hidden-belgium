# Onboarding & Auth Implementation

## Phase 1: Database Migration
- [x] Create migration for new tables:
  - [x] user_activity (id, user_id, action_type, entity_type, entity_id, created_at)
  - [x] user_preferences (id, user_id, preference_type, preference_value)
  - [x] lists (id, user_id, name, visibility, created_at)
  - [x] list_hotspots (id, list_id, hotspot_id, saved_at)
  - [x] user_settings (user_id, allow_location, allow_notifications)
  - [x] Add interests, city, travel_style columns to users table if not exist

## Phase 2: Auth Page (/app/auth/page.tsx)
- [x] Create split-screen layout (left: globe, right: auth card)
- [x] Implement GlobeHero component
- [x] Implement glass-style auth card
- [x] Add Login tab with form
- [x] Add Signup tab

## Phase 3: AuthModal Component
- [x] Create components/auth/AuthModal.tsx
- [x] Implement Login/Signup tabs
- [x] Trigger on: save hotspot, create list, follow user

## Phase 4: Discovery Components
- [x] Create components/discovery/GlobeHero.tsx
- [x] Create components/discovery/HotspotPreview.tsx
- [x] Add hotspot hover preview functionality

## Phase 5: Onboarding Flow (Simplified)
- [x] Step 1: Hero Globe Exploration
- [x] Step 2: Save Hotspot (triggers signup if needed)
- [x] Step 3: Signup (email + password)
- [x] Step 4: Explorer Type selection
- [x] Step 5: Location + Travel Style
- [x] Step 6: Welcome → Redirect to /map

## Phase 6: Integration
- [x] Update layout to include AuthModalProvider
- [x] Add auth triggers to save/list/follow actions
- [ ] Test full flow

