# Enrichment Data Export - Approved Plan Implementation
Current working directory: e:/Projects/unlock-hidden-belgium

## Approved Plan Breakdown
**Goal:** Add export of all new enriched hotspot data (from Wikidata/OSM/Wikipedia) to app code.

### Step 1: ✅ Create this TODO file [DONE]
### Step 2: ✅ Update types/hotspot.ts [DONE]
### Step 3: ✅ Update services/hotspots.ts [DONE]
- Added parseTags() function
- Extended SELECT: `*, wikipedia_intro, tags, tourism_type, heritage`  
- Map returns images/tags parsed + all new fields
### Step 4: Update services/explore.ts
- Extend fetchExploreHotspots query to select/join new fields
- Map new fields to ExploreHotspot interface (extend if needed)
### Step 5: Update services/ranking.ts 
- Ensure HotspotRanking includes all new fields
- Verify materialized view alignment
### Step 6: Test & Verify
- npm run dev
- Check hotspots page loads with new data
- Verify console/network shows new fields
### Step 7: UI Integration TODOs
- Show wikipedia_intro in HotspotDetail
- Display tags as chips  
- Use tourism_type for filtering
- heritage badge in cards
### Step 8: attempt_completion

**Next step: Edit services/explore.ts**

- Extend SELECT to include new fields: *, wikipedia_intro, tags, tourism_type, heritage
- Add parseTags function similar to parseImages
- Return enriched data in fetchHotspots()
### Step 4: Update services/explore.ts
- Extend fetchExploreHotspots query to select/join new fields
- Map new fields to ExploreHotspot interface (extend if needed)
### Step 5: Update services/ranking.ts 
- Ensure HotspotRanking includes all new fields
- Verify materialized view alignment
### Step 6: Test & Verify
- npm run dev
- Check hotspots page loads with new data
- Verify console/network shows new fields
### Step 7: UI Integration TODOs
- Show wikipedia_intro in HotspotDetail
- Display tags as chips  
- Use tourism_type for filtering
- heritage badge in cards
### Step 8: attempt_completion

**Next step: Edit types/hotspot.ts**

