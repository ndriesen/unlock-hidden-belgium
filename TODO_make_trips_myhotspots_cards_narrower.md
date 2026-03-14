pm n# TODO: Narrower Popular Trips + My Hotspots cards

## Plan approved - Steps:

### 1. [✅] Create this TODO.md
### 2. [✅] Confirm src/app/hotspots/ExplorePageClient.tsx (trips) & src/app/hotspots/my/page.tsx
### 3. [✅] Edit Popular Trips cards (ExplorePageClient.tsx):
   - Grid: md:grid-cols-2 xl:grid-cols-3 → md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
   - Image: h-28 → h-24
   - Stats: gap-2 text-[11px] → gap-1.5 text-xs
   - Buttons: py-2 → py-1.5
### 4. [✅] Edit My Hotspots cards (my/page.tsx):
   - Grid: sm:grid-cols-2 lg:grid-cols-3 → sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5
   - Image: h-36 → h-32
   - Stats: grid-cols-5 gap-2 text-[11px] → grid-cols-5 gap-1.5 text-xs
### 5. [✅] Test /hotspots (trips narrower), /hotspots/my (cards narrower)
### 6. [✅] Responsive intact, complete task

✅ Task complete! Popular Trips narrower (lg+ 3-4 cols, h-24, tighter), My Hotspots narrower (lg+ 4-5 cols, h-32, tighter stats).
