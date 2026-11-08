# Civic Center Sample Building Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy hotel sample graph and raster floor images with a metric-exact, SVG-rendered 3-storey Civic Center featuring an outdoor government/rescue vehicle parking lot, exterior and interior steps vs. 1:12 accessible ramps, 1st-floor main entrance, info/lounge desk and glass-enclosed souvenir shop, 2nd-floor library, two rectangular offices and restroom, 3rd-floor four function halls and stacked restroom, and architectural dimension lines in meters.

**Architecture:** A single metric geometry module (`src/civicPlan.ts`) defines all three floor plans on a `60 m × 50 m` sheet (`20 px/m`, `1200 × 1000 px`), generating architectural SVG data URLs (`renderFloorSvg`), wall-free `walkableAreas` (`src/walkable.ts`), and the routing graph (`src/hotel.ts`) with exact polyline edge weights on a `0.5 m` coordinate grid. Existing exports (`hotel`, `floors`, `sampleBuilding`) remain drop-in compatible.

**Tech Stack:** TypeScript, React 19, SVG data URLs, Phosphor Icons, Node test runner (`tsx --test`).

**Spec:** `docs/superpowers/specs/2026-11-08-civic-center-sample-design.md`

## Global Constraints

- Sheet size `60 m × 50 m` at `20 px/m` (`1200 × 1000 px`, `metersPerPixel = 0.05`) across all three floors (`0`, `1`, `2`).
- Building footprint `x: 4..44 m` (`40.0 m` wide), `y: 3..25 m` (`22.0 m` deep); central corridor `y: 13..16 m` (`3.0 m` wide, centerline `y = 14.5 m`).
- All nodes, corridor junctions, and `via` points sit on a `0.5 m` (`10 px`) grid; every doorway, stair landing, elevator landing, ramp endpoint, and step landing has its own dedicated corridor/spine junction directly outside it so no route ever overshoots and doubles back.
- Edge weights equal the Euclidean length of the edge polyline in meters (`px / 20`), rounded to `0.01 m`; vertical stair edges are `8.6 m` per storey (`accessible: false`) and vertical elevator edges are `12.0 m` per storey (`accessible: true`).
- Restrooms on the 2nd floor (`floor: 1`) and 3rd floor (`floor: 2`) occupy the exact same north-band slot (`x: 13..19 m, y: 3..13 m`, doorway at `x = 16.0 m, y = 13.0 m`).
- Preserve `sampleBuilding.id = 'linden-sample'` and existing module export names (`hotel`, `floors`, `nodeById`, `edgeById`, `facilities`, `floorName`, `facilityLabel`).
- Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact.

## Review Focus

- **Corridor dimension labels vs. graph edge weights:** If printed corridor gap labels in the SVG are formatted or summed independently of the graph edges, a defense reviewer will spot a discrepancy; Task 1 derives corridor gap dimension annotations directly from consecutive corridor edges and tests exact equality.
- **Outdoor and indoor ramp vs. step tie/reversal:** If a starting point in the parking lot or lobby is closer to a ramp than to steps in Manhattan distance, `shortest` mode will unexpectedly route via the ramp; Task 2 tests that both outdoor (`parking-lot → main-entrance`) and indoor (`main-entrance → lift-0`) routes strictly use steps in `shortest` mode and ramps in `accessible` mode.
- **Doorway wall-crossing check on thick walls:** `segmentIsWalkable` rejects any segment that crosses a gap between walkable rectangles; Task 1 overlaps each doorway aperture rectangle across the wall thickness (`y: 12.5..13.5 m` or `y: 15.5..16.5 m`, and `x: 33.5..34.5 m` for the shop glass door) so only segments passing through the doorway opening validate.
- **SVG data URL encoding in `<img>`:** Unescaped `#` or XML characters in `data:image/svg+xml;utf8,...` break `<img src>` rendering in browsers; Task 1 URL-encodes the SVG payload with `encodeURIComponent` and tests that `sampleBuilding.floors[f].image` decodes to well-formed SVG containing the meter dimension strings.
- **Default start/end IDs in `App.tsx`:** Leaving `'reception'` and `'restaurant'` in `App.tsx` causes the initial load on the sample building to render an empty route state; Task 3 updates the sample defaults to `'main-entrance'` and `'library'` and tests initial SSR markup.

---

### Task 1: Metric Civic Center Plan, Walkable Envelopes & SVG Renderer

**Files:**
- Create: `src/civicPlan.ts`
- Modify: `src/walkable.ts`
- Test: `tests/routing.test.ts`

**Interfaces:**
- Produces in `src/civicPlan.ts`:
  - `export const SCALE = 20;` (`px` per meter)
  - `export const SHEET_WIDTH_M = 60, SHEET_HEIGHT_M = 50;`
  - `export const PLAN_WIDTH = 1200, PLAN_HEIGHT = 1000, METERS_PER_PIXEL = 0.05;`
  - `export interface RoomBox { id: string; floor: FloorId; name: string; x: number; y: number; w: number; h: number; door?: { x: number; y: number; width: number; wall: 'north' | 'south' | 'east' | 'west'; glass?: boolean }; staffOnly?: boolean; }` (coordinates in meters)
  - `export interface DimensionLine { floor: FloorId; x1: number; y1: number; x2: number; y2: number; label: string; meters: number; kind: 'building' | 'corridor' | 'gap' | 'room' | 'ramp' | 'parking'; }`
  - `export const civicRooms: RoomBox[];`
  - `export const civicDimensions: DimensionLine[];`
  - `export const civicWalkableAreas: Record<FloorId, WalkableArea[]>;` (in pixel coordinates `0..1200 × 0..1000`)
  - `export function renderFloorSvg(floor: FloorId): string;` (returns raw `<svg ...>...</svg>`)
  - `export function floorSvgDataUrl(floor: FloorId): string;` (returns `'data:image/svg+xml;utf8,' + encodeURIComponent(renderFloorSvg(floor))`)
- Produces in `src/walkable.ts`:
  - `export const walkableAreas: Record<FloorId, WalkableArea[]> = civicWalkableAreas;`

- [ ] **Step 1: Write failing geometry & SVG plan tests in `tests/routing.test.ts`**

Add a test in `tests/routing.test.ts` importing `civicRooms`, `civicDimensions`, `renderFloorSvg`, and `floorSvgDataUrl` from `../src/civicPlan.ts`:

```ts
test('civic plan stacks 2nd and 3rd floor restrooms identically and encodes metric dimension lines in SVG', () => {
  const rest1 = civicRooms.find(r => r.id === 'restroom-1')!;
  const rest2 = civicRooms.find(r => r.id === 'restroom-2')!;
  assert.deepEqual(
    { x: rest1.x, y: rest1.y, w: rest1.w, h: rest1.h, door: rest1.door },
    { x: rest2.x, y: rest2.y, w: rest2.w, h: rest2.h, door: rest2.door },
  );
  for (const floor of [0, 1, 2] as const) {
    const svg = renderFloorSvg(floor);
    assert.ok(svg.startsWith('<svg') && svg.includes('viewBox="0 0 1200 1000"'));
    assert.ok(svg.includes('40.0 m') && svg.includes('3.0 m'));
    const dataUrl = floorSvgDataUrl(floor);
    assert.ok(dataUrl.startsWith('data:image/svg+xml;utf8,') && !dataUrl.slice(24).includes('#'));
  }
  assert.ok(renderFloorSvg(0).includes('FIRE') && renderFloorSvg(0).includes('RESCUE'));
  assert.ok(renderFloorSvg(0).includes('1:12'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/routing.test.ts`
Expected: FAIL with `Cannot find module '../src/civicPlan.ts'`.

- [ ] **Step 3: Implement `src/civicPlan.ts` and update `src/walkable.ts`**

Create `src/civicPlan.ts` with exact metric coordinates (`SCALE = 20` px/m, `px = (m: number) => m * 20`):
- **Building shell** (`x: 4..44, y: 3..25`, `40.0 m × 22.0 m`) on all 3 floors; central corridor `x: 4..44, y: 13..16` (`3.0 m` wide).
- **Core rooms (all floors `0, 1, 2`)**:
  - Elevator shaft `x: 4..7, y: 3..13` (`3.0 × 10.0 m`), door on south wall `(5.5, 13.0)`, width `1.2 m`.
  - Stairwell `x: 7..13, y: 3..13` (`6.0 × 10.0 m`), opening on south wall `(11.5, 13.0)`, width `2.0 m`, drawn with two flights, landing, and `"UP / DN 24×0.15 m"`.
- **Floor 0 (`1st floor`)**:
  - Outdoor parking lot (`x: 2..58, y: 31..49`): `6.0 m` drive aisle (`y: 31..37`), 2 Rescue/Ambulance bays (`x: 4..11, y: 37..45`, `3.5 × 8.0 m` each, labeled `RESCUE 1`, `RESCUE 2`), 6 gov't vehicle stalls (`x: 12..27, y: 37..42`, `2.5 × 5.0 m`), painted crosswalk at `x: 25..27`, 2 PWD stalls with access aisle (`x: 33..39.5, y: 37..42`), 2 Fire Truck bays (`x: 43..52, y: 37..49`, `4.5 × 12.0 m` each, hatched red, labeled `FIRE TRUCK 1`, `FIRE TRUCK 2`).
  - Sidewalk (`x: 4..44, y: 29..31`, `2.0 m` wide), front steps (`x: 22..28, y: 28..29.5`, `4 × 0.15 m` risers), entrance plaza (`x: 18..30, y: 25..28`), exterior accessible ramp (`x: 30..37.5, y: 25.5..27.5`, `7.5 m` run, `1.8 m` wide, labeled `RAMP 7.5 m · 1:12`).
  - Main entrance double glass doors at `(26.0, 25.0)`, width `2.0 m`.
  - Entrance lobby (`x: 18..34, y: 16..25`, `16.0 × 9.0 m`): Information & lounge desk (`id: 'info-desk'`) and waiting seating (`id: 'lounge'`).
  - Interior level change (`+0.45 m` from lobby `y = 16..25` to corridor `y = 13..16`):
    - Interior lobby steps at `x: 24.5..27.5, y: 16..17.5` (`3 × 0.15 m` risers, center `x = 26.0`).
    - Interior accessible ramp along east lobby wall at `x: 31.6..33.4, y: 16..21.4` (`5.4 m` run, `1.8 m` wide, `1:12` slope, center `x = 32.5`).
  - Souvenir shop (`id: 'souvenir-shop'`, `x: 34..40, y: 16..25`, `6.0 × 9.0 m`): west partition wall `x = 34.0, y: 16..25` is drawn as a double-line glass wall with a `1.2 m` glass door at `(34.0, 21.0)` (`glass: true`).
  - Staff-only hatched rooms (non-routable): Utility (`x: 13..19, y: 3..13`), Records room (`id: 'records-room'`, `x: 19..44, y: 3..13`, `staffOnly: true`), Building services (`x: 4..18, y: 16..25`), Security (`x: 40..44, y: 16..25`).
- **Floor 1 (`2nd floor`)**:
  - `restroom-1` (`x: 13..19, y: 3..13`, `6.0 × 10.0 m`, door `(16.0, 13.0)`, width `1.2 m`).
  - `library` (`x: 19..44, y: 3..13`, `25.0 × 10.0 m`, door `(31.5, 13.0)`, width `1.8 m`).
  - `office-a` (`x: 4..24, y: 16..25`, `20.0 × 9.0 m`, door `(14.0, 16.0)`, width `1.5 m`).
  - `office-b` (`x: 24..44, y: 16..25`, `20.0 × 9.0 m`, door `(34.0, 16.0)`, width `1.5 m`).
- **Floor 2 (`3rd floor`)**:
  - `restroom-2` (`x: 13..19, y: 3..13`, `6.0 × 10.0 m`, door `(16.0, 13.0)`, width `1.2 m`).
  - `hall-1` (`x: 19..31.5, y: 3..13`, `12.5 × 10.0 m`, door `(25.0, 13.0)`, width `1.8 m`).
  - `hall-2` (`x: 31.5..44, y: 3..13`, `12.5 × 10.0 m`, door `(38.0, 13.0)`, width `1.8 m`).
  - `hall-3` (`x: 4..24, y: 16..25`, `20.0 × 9.0 m`, door `(14.0, 16.0)`, width `1.8 m`).
  - `hall-4` (`x: 24..44, y: 16..25`, `20.0 × 9.0 m`, door `(34.0, 16.0)`, width `1.8 m`).
- **`civicWalkableAreas`**:
  - Converts corridor bands, lobby/plaza/sidewalk/parking bands, and narrow doorway/step/ramp apertures into pixel `WalkableArea[]` per floor so that wall lines between rooms and corridors are excluded everywhere except through the mapped door/step/ramp openings.
- **`renderFloorSvg(floor)`**:
  - Renders paper background, grid lines, parking bays (on floor 0), room fills, thick exterior/interior walls with gaps at doorways, double-line cyan/brass glass partition for the souvenir shop, door swing arcs, stair treads, ramp slopes, furniture outlines (info desk, lounge sofas, shop counter, library bookshelves/tables, office desks, function hall seating, restroom stalls), brass architectural dimension lines (`civicDimensions`) showing building `40.0 m × 22.0 m`, corridor width `3.0 m`, room widths/depths, and exact junction-to-junction corridor gaps, plus north arrow and metric scale bar.
- Update `src/walkable.ts` to re-export `walkableAreas = civicWalkableAreas`.

- [ ] **Step 4: Run test to verify Task 1 tests pass**

Run: `npx tsx --test tests/routing.test.ts`
Expected: New `civicPlan` test passes (legacy hotel tests in `tests/routing.test.ts` will be updated in Task 2).

---

### Task 2: Civic Center Routing Graph, Scenarios & Geometry Regression Tests

**Files:**
- Modify: `src/types.ts`
- Modify: `src/FacilityIcon.tsx`
- Modify: `src/hotel.ts`
- Modify: `src/scenarios.ts`
- Modify: `tests/routing.test.ts`

**Interfaces:**
- Modifies `MapNode['category']` in `src/types.ts`:
  - Add `'library' | 'office' | 'shop' | 'parking'` to the category union.
- Modifies `src/hotel.ts`:
  - `export const floors = [{ id: 0, name: '1st floor', short: '1F', description: 'Parking lot, main entrance, info lounge & souvenir shop' }, { id: 1, name: '2nd floor', short: '2F', description: 'Public library, offices & restroom' }, { id: 2, name: '3rd floor', short: '3F', description: 'Four function halls & restroom' }] as const;`
  - Facility IDs:
    - Floor 0: `'parking-lot'`, `'pwd-parking'`, `'main-entrance'`, `'info-desk'`, `'lounge'`, `'souvenir-shop'`, `'stairs-0'`, `'lift-0'`, `'records-room'` (disconnected).
    - Floor 1: `'stairs-1'`, `'lift-1'`, `'restroom-1'`, `'library'`, `'office-a'`, `'office-b'`.
    - Floor 2: `'stairs-2'`, `'lift-2'`, `'restroom-2'`, `'hall-1'`, `'hall-2'`, `'hall-3'`, `'hall-4'`.
  - Edge weights computed from pixel coordinates (`Math.round(polylineMeters * 100) / 100`), except cross-floor `stairs-*` (`8.6 m`, `accessible: false`) and `lift-*` (`12.0 m`, `accessible: true`).

- [ ] **Step 1: Update `tests/routing.test.ts` with Civic Center routing, doorway, dimension-consistency, and wall-crossing tests**

Update `tests/routing.test.ts` so it tests:
1. `validateGraph(hotel)` returns `[]`.
2. Outdoor route `parking-lot → main-entrance`: `shortest` is `14.0 m` via `steps-out-bot--plaza-entry-j` (`stairs`), `accessible` is `37.0 m` via `ramp-out-top--ramp-out-bot` (`ramp`).
3. Indoor 1st-floor route `main-entrance → lift-0`: `shortest` is `33.0 m` via `lobby-center-j--f0-steps-j` (`stairs`), `accessible` is `46.0 m` via `lobby-east-j--f0-ramp-j` (`ramp`).
4. Cross-floor route `main-entrance → library`: `shortest` uses `stairs-0--stairs-1`, `accessible` uses `lift-0--lift-1`.
5. Glass-partition shop route `main-entrance → souvenir-shop`: `13.5 m` in both modes, crosses `x = 680 px` (`34.0 m`) within doorway `y: 408..432 px` (`20.4..21.6 m`).
6. Doorway crossing check for `library`, `office-a`, `office-b`, `hall-1`, `hall-2`, `hall-3`, `hall-4`, `restroom-1`, `restroom-2`, `souvenir-shop`, and `main-entrance`.
7. Wall-crossing rejection: adding a shortcut across the lobby/corridor wall or through the shop glass wall outside the doorway fails `validateGraph`.
8. Terminal destination check: every room/facility (`library`, `office-a`, `office-b`, `hall-1..4`, `restroom-1..2`, `souvenir-shop`, `info-desk`, `lounge`) has degree `1`.
9. Corridor gap dimension lines in `civicDimensions` match the exact distance of the corresponding graph edges on all 3 floors.
10. All existing universal invariants: `runScenarios()`, all-pairs facility invariants, Floyd–Warshall oracle, Dijkstra trace monotonicity, elevator closure (`lift-0--lift-1`), and no-double-back on every facility pair in both modes.

- [ ] **Step 2: Run `tests/routing.test.ts` to verify it fails against the old hotel graph**

Run: `npx tsx --test tests/routing.test.ts`
Expected: FAIL on missing civic node IDs (`parking-lot`, `main-entrance`, `library`, etc.).

- [ ] **Step 3: Implement `src/types.ts`, `src/FacilityIcon.tsx`, `src/hotel.ts`, and `src/scenarios.ts`**

1. In `src/types.ts`, add `'library' | 'office' | 'shop' | 'parking'` to `MapNode['category']`.
2. In `src/FacilityIcon.tsx`, map `library: BookOpen`, `office: Briefcase`, `shop: Storefront`, `parking: CarProfile` from `@phosphor-icons/react/dist/csr/*`.
3. In `src/hotel.ts`, construct the Civic Center nodes and edges using a helper `m(xMeters, yMeters)` (`[xMeters * 20, yMeters * 20]`) and compute horizontal edge `distance` directly from polyline length in meters (`polylineLengthPx / 20`). Set `labelPositions` so room pills sit cleanly inside each room box without overlapping corridor lines.
4. In `src/scenarios.ts`, update the hotel-specific scenarios to Civic Center equivalents:
   - `Outdoor steps vs. ramp (shortest)`: `parking-lot → main-entrance`, `shortest`, `14 m; uses steps`
   - `Outdoor accessible ramp`: `parking-lot → main-entrance`, `accessible`, `37 m; uses ramp`
   - `Interior lobby ramp`: `main-entrance → lift-0`, `accessible`, `46 m; uses lobby ramp`
   - `Same-floor glass shop access`: `main-entrance → souvenir-shop`, `accessible`, `13.5 m; level lobby`
   - `Cross-floor elevator to library`: `lift-0 → lift-1`, `accessible`, `12 m; one elevator link`
   - `Cross-floor stairs to 3rd floor`: `stairs-0 → stairs-2`, `shortest`, `17.2 m; two stair links`
   - `Elevator closure blocks upper accessible route`: `main-entrance → hall-1`, `accessible`, `graph: applyClosures(hotel, ['lift-0--lift-1'])`, `unreachable`
   - `Disconnected staff room`: `main-entrance → records-room`, `shortest`, `unreachable`
   - Keep `Already at destination`, `Missing selection`, and synthetic `mini` graph scenarios intact.

- [ ] **Step 4: Run `tests/routing.test.ts` to verify all tests pass**

Run: `npx tsx --test tests/routing.test.ts`
Expected: PASS (all routing, scenario, oracle, doorway, dimension, and no-double-back tests green).

---

### Task 3: UI Integration, Sample Building Setup, Documentation & Full Verification

**Files:**
- Modify: `src/buildings.tsx`
- Modify: `src/App.tsx`
- Modify: `src/HotelMap.tsx`
- Modify: `src/Workspace.tsx`
- Modify: `tests/building-ui.test.ts`
- Modify: `AGENTS.md`
- Delete: `public/assets/floor-0.png`, `public/assets/floor-1.png`, `public/assets/floor-2.png`

**Interfaces:**
- `src/buildings.tsx` uses `floorSvgDataUrl(f.id)`, `width: PLAN_WIDTH` (`1200`), `height: PLAN_HEIGHT` (`1000`), `metersPerPixel: METERS_PER_PIXEL` (`0.05`) from `./civicPlan`.
- `src/App.tsx` defaults sample start to `'main-entrance'` and sample end to `'library'`.
- `src/HotelMap.tsx` replaces `'reading-room'`/`'private-room'` badges with `n.id === 'records-room' && <small>Staff only · no public route</small>` and removes the old hotel-only `Ramp`/`Steps` HTML overlay spans (since ramps, steps, and meter dimensions are rendered directly in the floor SVG).

- [ ] **Step 1: Add UI test for default Civic Center sample rendering in `tests/building-ui.test.ts`**

Add a test in `tests/building-ui.test.ts`:

```ts
test('default Civic Center sample renders 1200x1000 metric floor plan, civic facilities and default route', () => {
  const html = renderToStaticMarkup(createElement(App));
  assert.ok(html.includes('Main entrance'));
  assert.ok(html.includes('Public library'));
  assert.ok(html.includes('Souvenir shop'));
  assert.ok(html.includes('viewBox="0 0 1200 1000"'));
  assert.ok(!html.includes('Restaurant') && !html.includes('Suite 201'));
});
```

- [ ] **Step 2: Run `tests/building-ui.test.ts` to verify it fails**

Run: `npx tsx --test tests/building-ui.test.ts`
Expected: FAIL (`viewBox="0 0 1000 760"` and missing `'Public library'`).

- [ ] **Step 3: Update `src/buildings.tsx`, `src/App.tsx`, `src/HotelMap.tsx`, `src/Workspace.tsx`, `AGENTS.md`, and remove unused hotel PNGs**

1. In `src/buildings.tsx`, import `floorSvgDataUrl, METERS_PER_PIXEL, PLAN_HEIGHT, PLAN_WIDTH` from `./civicPlan` and set `sampleBuilding.floors` to `{ ...f, image: floorSvgDataUrl(f.id), width: PLAN_WIDTH, height: PLAN_HEIGHT, metersPerPixel: METERS_PER_PIXEL }`.
2. In `src/App.tsx`, change lines 53–54 sample defaults from `'reception'` / `'restaurant'` to `'main-entrance'` / `'library'`.
3. In `src/HotelMap.tsx`, replace `{building.sample&&n.id==='reading-room'&&<small>Steps only</small>}{building.sample&&n.id==='private-room'&&<small>No public connection</small>}` with `{building.sample&&n.id==='records-room'&&<small>Staff only</small>}` and remove line 129 (`Ramp`/`Steps` HTML spans).
4. In `src/Workspace.tsx`, update `PRELOADER_FLOORS` summaries/labels to match the 3-storey Civic Center (`1st Floor Concourse`, `2nd Floor Library & Offices`, `3rd Floor Function Halls`).
5. Delete `public/assets/floor-0.png`, `public/assets/floor-1.png`, and `public/assets/floor-2.png`.
6. Record the Civic Center metric SVG floor-plan decision in `AGENTS.md`.

- [ ] **Step 4: Run full test suite, typecheck, Vercel build, Sites build & Sites worker test**

Run:
- `npm test`
- `npm run build:vercel`
- `npm run build`
- `npm run test:sites`
Expected: All commands exit 0 with 0 failed tests.
