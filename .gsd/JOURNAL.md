# JOURNAL.md — Session Log

## Sessions

## Session: 2026-10-14 12:40

### Objective
Add the requested full-viewport Bengaluru satellite map with a clearly identified illustrative waterlogging-risk heat layer.

### Accomplished
- Added a dedicated Leaflet map centered on Bengaluru Urban using Esri World Imagery tiles.
- Added spatially distributed illustrative hotspots with a blue-to-cyan/green/yellow/orange/red gradient.
- Labeled the heat layer as demo visualization, not observed flood data; no observation or forecast timestamps are fabricated.
- Integrated the map into the existing Flood Map tab and aligned its browser title with Bengaluru Urban.

### Verification
- [x] `npm --prefix frontend run build` completed successfully; Vite transformed 3,174 modules and produced the production bundle.
- [x] Browser loaded 24 satellite tiles at 1280×800; the map occupied x=0–1280 and y=56.8–800, filling the space below the application navigation.
- [x] At 390×844, map bounds were x=0–390.4 and y=95.6–844; the demo disclaimer remained visible.
- [x] Rendered heat canvas contained blue, green, yellow, orange, and red pixels; screenshot confirmed distributed colored hotspots over visible imagery.
- [x] Navigation to Weather & Radar and back to Flood Map succeeded.

### Blockers Encountered
- No verified georeferenced flood observations or risk feed is connected; hotspots are illustrative demo data only.
- The map depends on externally hosted Esri World Imagery tiles and requires network access.

### Handoff Notes
- The heat layer must not be presented as a real observation or forecast unless validated geospatial data is later connected.
- No new map controls, legend, timestamps, or scale bar were added.

## Session: 2026-10-14 17:05

### Objective
Improve Bengaluru heatmap implementation to render a smooth continuous risk heat layer with connected corridors, vivid hotspots, and a clear satellite basemap without heavy brown tint.

### Accomplished
- Upgraded basemap from brown/muddy imagery to high-clarity Google Satellite tiles (`https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}`) with natural greens and visible street/lake detail.
- Replaced discrete per-point circle drawing with a continuous 2-pass density heatmap:
  - First pass accumulates blurred radial alpha density gradients across intersecting hydrological points.
  - Second pass colorizes the alpha field via a 256-color gradient LUT (transparent → royal blue → cyan → emerald green → golden yellow → bright orange → vivid red core).
- Connected cluster topology across Bengaluru's primary valleys:
  - Bellandur · Varthur · ORR · Sarjapur corridor (concentrated center)
  - Silk Board · Madiwala · Koramangala valley (concentrated center)
  - Manyata Tech Park · Hebbal · Nagavara corridor (concentrated center)
  - KR Puram · Hoodi · Mahadevapura · Whitefield corridor
  - Majestic · City Market · Mysore Road corridor
  - Bommanahalli · Kudlu · Electronic City corridor
  - Ambient connector paths linking valleys naturally without isolated circles.
- Tuned opacity (~0.32 at blue perimeter to ~0.82-0.86 at vivid red cores) and adaptive zoom-based radius scaling so imagery remains clearly visible through the heat field while colors remain saturated.
- Preserved existing dashboard structure, navigation bar, and accurate illustrative notice (`Demo heatmap · Illustrative only · Not observed flood data`).

### Verification
- [x] `npm --prefix frontend run build` completed with code 0 (`built in 33.21s`, zero TypeScript/Vite errors).
- [x] Map occupies full viewport below header without overflowing or extra controls.

---

*Last updated: 2026-10-14*

