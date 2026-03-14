# Hotspot Categories Standardization

## Current Implementation
`getCategoryDisplay()` in `src/types/hotspot.ts` handles display names with fallback.

## Suggested DB Enum / Standardized Values
```
museum, museums
castle, castles  
park, parks
church, churches
viewpoint, viewpoints
beach, beaches
monument, monuments
restaurant, restaurants
nature_reserve, nature_reserves
forest, forests
lake, lakes
river, rivers
cave, caves
waterfall, waterfalls
abbey, abbeys
brewery, breweries
bakery, bakeries
market, markets
street_art, street art
```

## Next Steps
1. Add `category` enum to hotspots table migration
2. Backfill existing hotspots  
3. Update `AddHotspotModal` with select dropdown
4. Extend `getCategoryDisplay` mapping
