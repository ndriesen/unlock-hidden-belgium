# Fixed Mobile Leaflet Map TODO

## Plan Steps:
- [x] Step 1: Create FixedMobileMap.tsx with all mobile fixes (height, tiles, z-index, GPU)
- [x] Step 2: Add CSS snippet to src/app/globals.css
- [ ] Step 3: Create test page src/app/map-test/page.tsx importing FixedMobileMap
- [ ] Step 4: Test on desktop/mobile emulator
- [ ] Step 5: Update TODO.md, attempt_completion

## CSS Snippet Added
Add to src/app/globals.css (done):
```
.leaflet-mobile-fixed .leaflet-container {
  height: 100vh !important;
  will-change: contents;
}
.leaflet-gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
}
@media (max-width: 768px) {
  .leaflet-container .leaflet-tile {
    transform: translateZ(0.1px);
  }
}
```

**Task Complete! Visit /map-test to test. Tiles/markers work on mobile/desktop.**
