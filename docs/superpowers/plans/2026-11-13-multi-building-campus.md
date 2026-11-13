# Multi-Building Campus (BP 344) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the **Multi-Building Campus (BP 344)** built-in establishment (`Building 1` 4F incl. Rooftop + `Building 2` 3F enclosed) on a unified metric blueprint with strict geometry/accessibility validation, full URL deep-link preservation (`?est=campus`), and disambiguated vertical closures.

**Architecture:** Implement `src/campusPlan.ts` following `src/mallPlan.ts` (`SCALE = 20`, SVG floor data URLs) and `src/civicPlan.ts` (`walkableAreas` strict wall-crossing enforcement), re-export `campusBuilding` from `src/buildings.tsx` with a shared `BUILT_IN_SAMPLES` / URL alias helper used synchronously across `Workspace.tsx`, `App.tsx`, and `StaffTools.tsx`, and include `a.name` in `src/closures.ts` cross-floor labels so B1 and B2 cores stay distinct.

**Tech Stack:** TypeScript, React 19, Vite, Node built-in `node:test` via `tsx --test`

**Spec:** `docs/superpowers/specs/2026-11-13-multi-building-campus-design.md`

## Global Constraints

- Canvas scale: `CAMPUS_SCALE = 20` (`metersPerPixel = 0.05`), `72.0 m × 40.0 m` sheet (`1440 × 800 px`), shared floor IDs `0..3` (`1F`, `2F`, `3F`, `4F`).
- Building 1 (`x = 4..34 m, y = 4..23 m`, corridor `y = 12..15 m`) + Building 2 (`x = 40..68 m, y = 4..23 m`, corridor `y = 12..15 m`) connected on `1F` via `y = 27.5..31.0 m` promenade (`y = 29.0 m` centerline) and PWD parking `(36.0, 35.0)`.
- `geometry.ts` vertical contract: every cross-floor edge (`from.floor !== to.floor`) uses `'stairs'` or `'elevator'` with `from.category === edge.kind && to.category === edge.kind` and exact pixel equality `from.x === to.x && from.y === to.y` across all spanned floors (`1F–4F` B1, `1F–3F` B2).
- SVG validity: every `&` inside SVG `<text>` must be escaped as `&amp;`; data URLs use `encodeURIComponent(svg)`.
- Default `Civic Center` (`sampleBuilding`) home behavior and all existing 86+ tests must stay green.
- Use valid non-`'room'` categories from `src/types.ts` (`'office'`, `'conference'`, `'library'`, `'dining'`, `'restroom'`, `'lounge'`, `'facility'`, `'parking'`, `'entrance'`, `'elevator'`, `'stairs'`).

## Review Focus

1. **`?est=campus` URL stripping & reload mismatch:** `Workspace` async initialization or `building.sample` checks removing `est=campus` before restoring route params or sharing QR links — pinned by Task 2 URL helper & `?est=campus` state tests.
2. **Exterior ramp vs. steps landing double-back or wall clipping:** Direct diagonal segments between `b*-main-entrance`, `b*-ramp-top`, and `b*-stairs-bot` clipping facade walls or failing `no-double-back` — pinned by Task 1 `validateGraph` + exhaustive all-pairs regression test in both modes.
3. **Cafeteria 2-room distance tie & classroom transit shortcuts:** Giving `Cafeteria Counter & Kitchen` a corridor door alongside an archway, or connecting adjacent rooms, allowing corridor bypass — pinned by Task 2 graph topology invariants (`Cafeteria Counter & Kitchen` degree-1 off `Cafeteria Dining Hall`; classrooms/offices degree-1 terminal spurs).
4. **Building 2 `4F` emptiness & elevator closure React-key collisions:** Building 2 leaking nodes onto floor `3` (`4F`) or `closureLabel` emitting identical `"Elevator · 1F ↔ 2F"` strings for B1 & B2 — pinned by Task 1 (`4F` check) and Task 2 (`closureLabel` + `applyClosures` checks).
5. **Same-floor exterior `steps` leaked into `accessible` mode & sample restore clobbering:** Accessible routing taking `1F` entrance steps (`from.floor === to.floor`) or restoring Campus deleting Mall's `deletedSamples` state — pinned by Task 1 (`accessible` stair-free check) and Task 2 (per-sample restore check).

---

### Task 1: Campus Blueprint, Graph Geometry & Core Routing Tests

**Files:**
- Create: `src/campusPlan.ts`
- Modify: `src/buildings.tsx`
- Create: `tests/campus-establishment.test.ts`
- Modify: `package.json:13`

**Interfaces:**
- Consumes (`src/types.ts`, `src/buildings.tsx`): `FloorId`, `MapNode`, `Edge`, `WalkableArea`, `HotelGraph`, `BuildingFloor`, `Building`.
- Produces (`src/campusPlan.ts` -> re-exported from `src/buildings.tsx`):
  - `export const CAMPUS_SCALE = 20`
  - `export const campusGraph: HotelGraph`
  - `export const campusFloors: BuildingFloor[]`
  - `export const campusBuilding: Building` (`id: 'multi-building-campus-bp344'`, `name: 'Multi-Building Campus (BP 344)'`, `sample: true`, `status: 'ready'`)

- [ ] **Step 1: Write failing core tests in `tests/campus-establishment.test.ts` and register in `package.json`**

Add tests asserting:
- `campusBuilding` metadata (`id === 'multi-building-campus-bp344'`, `floors.length === 4`, `floors.every(f => f.width === 1440 && f.height === 800 && f.metersPerPixel === 0.05 && !decodeURIComponent(f.image).includes(' & '))`).
- `validateGraph(campusBuilding.graph)` returns `[]` (strict `walkableAreas` wall-crossing + vertical `(x, y)` stack check).
- Exact facility presence:
  - B1 (`1F`..`4F`): Registrar, Stockroom, Cafeteria Dining Hall, Cafeteria Counter & Kitchen, B1 Comfort Room (`1F`, `2F`, `3F`), Classrooms `B1-201..203`, Faculty Room, Classrooms `B1-301..304`, Rooftop Open Area, Rooftop Garden Area, B1 Elevator & B1 Stairs across `0..3`, B1 Entrance on `0`.
  - B2 (`1F`..`3F`): Principal's Office, Classrooms `B2-101..103`, B2 Comfort Room (`1F`, `2F`), Classrooms `B2-201..203`, Computer Laboratory, Classrooms `B2-301..304`, B2 Elevator & B2 Stairs across `0..2`, B2 Entrance on `0`.
  - Zero Building 2 nodes (`x >= 40 * 20`) or edges on `floor === 3` (`4F`).
- Cross-building & vertical routing invariants:
  - `campus-pwd-parking` -> `b1-304`: `accessible` uses `kind === 'ramp'` + B1 Elevator with zero `'stairs'` edges; `shortest` uses entrance steps + stairs and is strictly/weakly shorter.
  - `campus-pwd-parking` -> `b2-computer-lab`: `accessible` uses B2 `1:12` ramp + B2 Elevator with zero `'stairs'`.
  - `b1-registrar` -> `b2-principal-office`: crosses `1F` promenade (`36.0, 29.0`) and switches steps vs `1:12` ramps by mode.
  - `b2-304` -> `b1-roof-garden`: descends B2, crosses `1F` promenade, ascends B1 to `4F`.
- Exhaustive all-pairs no-double-back regression check: for every ordered pair of distinct `facilities`, `findRoute` in both `shortest` and `accessible` modes never retraces any non-room junction, reversed segment, or overshoot along `1F` exterior landings (`b1-landing-top`, `b2-landing-top`).

- [ ] **Step 2: Run tests to verify failure**

Run: `npx tsx --test tests/campus-establishment.test.ts`
Expected: FAIL with missing module `./campusPlan` / `../src/campusPlan`.

- [ ] **Step 3: Implement `src/campusPlan.ts` and re-export `campusBuilding` from `src/buildings.tsx`**

Implement in `src/campusPlan.ts` (using pixel helpers `p(meters) = Math.round(meters * CAMPUS_SCALE)`):
- **`campusNodes` ordering:** Place `b1-main-entrance`, `b2-computer-lab`, `campus-pwd-parking`, `b1-registrar`, classrooms/offices/cafeteria/rooftop ahead of `elevator`/`stairs` cores so `App.tsx` opens on a meaningful cross-building route (`b1-main-entrance` -> `b2-computer-lab`) rather than `Elevator -> Stairs`.
- **Nodes & Corridor Chains (`y = 13.5 m` inside B1 `x = 4..34` and B2 `x = 40..68`):** Every room, lobby, CR, elevator `(5.6, 17.0)` / `(41.6, 17.0)`, and stair `(9.1, 17.5)` / `(45.1, 17.5)` drops perpendicularly to its own `(doorX, 13.5)` corridor junction. Corridor junctions chain left-to-right in ascending `x` with `distance = dx`.
- **`1F` Ground Approach & Promenade (`y = 22.8..35.0`):**
  - `b1-main-entrance (19.25, 22.8)` -> `b1-landing-top (19.25, 24.0)` (`1.2 m`, `corridor`).
  - `b1-landing-top` -> `b1-stairs-bot (19.25, 29.0)` (`5.0 m`, `stairs`, `accessible: false`).
  - `b1-landing-top` -> `b1-ramp-top (17.25, 24.0)` (`2.0 m`, `corridor`) -> `b1-ramp-bot (11.75, 24.0)` (`5.5 m`, `ramp`, `accessible: true`) -> `b1-ramp-walk (11.75, 29.0)` (`5.0 m`, `corridor`).
  - Mirror Building 2 via `b2-main-entrance (50.5, 22.8)` -> `b2-landing-top (50.5, 24.0)` -> `b2-stairs-bot (50.5, 29.0)` (`stairs`) and `b2-ramp-top (52.5, 24.0)` -> `b2-ramp-bot (58.0, 24.0)` (`ramp`) -> `b2-ramp-walk (58.0, 29.0)`.
  - Promenade chain on `y = 29.0`: `(11.75) <-> (19.25) <-> campus-plaza-curb (36.0) <-> (50.5) <-> (58.0)`, plus `(36.0, 29.0) <-> campus-pwd-parking (36.0, 35.0)` (`6.0 m`, `corridor`, `accessible: true`).
- **`Cafeteria` & `4F` Rooftop:** `b1-cafeteria-counter (30.25, 8.5)` connects only to `b1-cafeteria-dining (22.75, 8.5)` (`7.5 m`, `corridor`). On `4F` (`floor: 3`), B1 elevator `(5.6, 17.0)` & stairs `(9.1, 17.5)` join `y = 13.5` promenade `(5.6)->(9.1)->(12.0)` -> `b1-roof-open (12.0, 9.0)` and East `(12.0, 13.5)->b1-roof-garden (26.0, 13.5)` (`14.0 m`, threshold at `x = 18`).
- **`campusWalkableAreas`:** Define rectangular walkable slabs per floor (`0..3`) covering each building's corridor (`y = 12..15`), each room interior + `2.0 m`-wide doorway threshold bridge across `y = 11.5..15.5`, internal cafeteria archway (`x = 22.0..31.0, y = 7.2..9.8`), lobby/core wells, `1F` exterior landings (`y = 22.5..24.8`), ramps, stair runs, promenade (`y = 27.5..31.0`), curb cut, PWD parking transfer aisle, and `4F` deck slabs (including open south terrace `11..18, 15..23` and `x = 18` garden threshold).
- **SVG Floor Plans (`renderCampusFloorSvg`):** Draw architectural rooms, doorways w/ swing arcs, `1:12` ramp slope arrows + `100 mm` curbs + handrail offsets, stair treads + tactile nosing bands, stacked elevator cabs w/ Braille call indicators, BP 344 PWD comfort room stalls (`1.50 m` dashed turning circle, grab bars, roll-under basin), `0.80 m` low-counter callouts (Registrar, Cafeteria Counter, Principal's Office), classroom/lab wheelchair bays, dual `3.70 m` PWD parking stalls w/ ISA icon & striped shared aisle, Rooftop `1.20 m` parapet (`100 mm` kickplate), planted garden beds, and hatched Building 2 `4F` lower-roof slab.
- Re-export `export { campusBuilding } from './campusPlan';` in `src/buildings.tsx`.

- [ ] **Step 4: Run `npm test` and verify Task 1 passes**

Run: `npx tsx --test tests/campus-establishment.test.ts && npm test`
Expected: PASS (`campus-establishment.test.ts` + all existing test suites green, zero `validateGraph` errors).

---

### Task 2: Unified Sample Registry, URL Deep-Link Preservation, Disambiguated Closures & Full Verification

**Files:**
- Modify: `src/buildings.tsx`
- Modify: `src/closures.ts:44-51`
- Modify: `src/Workspace.tsx:188-315`
- Modify: `src/App.tsx:48-95`
- Modify: `src/StaffTools.tsx:34-46`
- Modify: `tests/campus-establishment.test.ts`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `sampleBuilding`, `mallBuilding`, `campusBuilding` in `src/buildings.tsx`.
- Produces (`src/buildings.tsx`):
  - `export const BUILT_IN_SAMPLES: readonly Building[]` (`[mallBuilding, campusBuilding]`)
  - `export function resolveBuiltInSample(est: string | undefined, deletedIds: readonly string[]): Building | undefined`
  - `export function sampleEstParam(building: Building): string | undefined` (returns `undefined` for `sampleBuilding.id`, `'mall'` for `mallBuilding`, `'campus'` for `campusBuilding`, or `building.id` for custom maps)
  - `export function sampleMatchesEst(est: string | undefined, building: Building): boolean` (matches `est === building.id`, canonical alias, `'grand-mall'` legacy alias, or `!est || est === 'sample'` on `sampleBuilding.id`)
- Updates `src/closures.ts`: `closureLabel(edge, nodeById, floorName)` returns `${edgeName} · ${floorName(a.floor)} ↔ ${floorName(b.floor)}` where `edgeName = a.name === b.name ? a.name : `${a.name} ↔ ${b.name}`` when `a.floor !== b.floor`.

- [ ] **Step 1: Add Review Focus unit tests to `tests/campus-establishment.test.ts` first**

Add assertions proving:
- URL helpers: `resolveBuiltInSample('campus', [])?.id === campusBuilding.id`, `resolveBuiltInSample('campus', [campusBuilding.id]) === undefined`, `resolveBuiltInSample('grand-mall', [])?.id === mallBuilding.id`, `sampleEstParam(sampleBuilding) === undefined`, `sampleEstParam(campusBuilding) === 'campus'`, `sampleEstParam(mallBuilding) === 'mall'`, `sampleMatchesEst('campus', campusBuilding) === true`, `sampleMatchesEst('campus', sampleBuilding) === false`.
- Graph invariants: `Cafeteria Counter & Kitchen` has graph degree `1` connected strictly to `Cafeteria Dining Hall` (no corridor junction edge); all B1/B2 classrooms, Faculty Room, Principal's Office, Computer Lab, Registrar, and Stockroom have degree `1` (`no room transit`).
- Closure disambiguation + availability: `closureLabel` for B1 Elevator (`1F ↔ 2F`) differs from B2 Elevator (`1F ↔ 2F`), and closing B1 Elevator edges via `applyClosures` forces `accessible` routes to floors `>= 2F` in Building 1 to report unreachable cleanly (rather than leaking onto stairs).
- UI SSR smoke check: rendering `<Workspace />` with mocked `window.location.search = '?est=campus'` initializes with `'Multi-Building Campus (BP 344)'` selected synchronously without losing `?est=campus` or falling back to Civic Center.

- [ ] **Step 2: Run tests to verify new Task 2 assertions fail before edits**

Run: `npx tsx --test tests/campus-establishment.test.ts`
Expected: FAIL (`resolveBuiltInSample` / `sampleEstParam` not exported yet; `closureLabel` collides on `"Elevator · 1F ↔ 2F"`).

- [ ] **Step 3: Implement shared sample helpers (`src/buildings.tsx`), closure labels (`src/closures.ts`), and wire `Workspace.tsx`, `App.tsx`, `StaffTools.tsx`, and `AGENTS.md`**

- `src/buildings.tsx`: Define `BUILT_IN_SAMPLES`, `SAMPLE_ALIASES`, `resolveBuiltInSample`, `sampleEstParam`, `sampleMatchesEst`. Keep `sampleBuilding` as Civic Center default.
- `src/closures.ts:48`: Change cross-floor label line to include `${a.name === b.name ? a.name : `${a.name} ↔ ${b.name}`}`.
- `src/Workspace.tsx`:
  - Initialize `selected` synchronously via `resolveBuiltInSample(readRouteParams().est, deletedSamples)?.id ?? sampleBuilding.id` (skipping async `loading` state for built-in samples).
  - Resolve `current` against `BUILT_IN_SAMPLES` (excluding `deletedSamples`) before `library`.
  - Render `<option>` items from `BUILT_IN_SAMPLES` (`Regional Shopping Mall (BP 344)`, `Multi-Building Campus (BP 344)`) + per-sample restore button(s) removing only that sample's ID from `deletedSamples`.
  - Use `BUILT_IN_SAMPLES.some(s => s.id === nextId)` in `<select>` `onChange`.
- `src/App.tsx` & `src/StaffTools.tsx`: Replace `building.sample ? undefined : building.id` with `sampleEstParam(building)`, and replace `sameBuilding` in `App.tsx` with `sampleMatchesEst(params.est, building)`.
- `AGENTS.md`: Append one concise paragraph recording the Multi-Building Campus (`src/campusPlan.ts`, `campusBuilding`) establishment decisions (unified side-by-side layout, public Stockroom, terminal Cafeteria Counter off Dining Hall, B1-301..304 / B2-301..304, shared `1F–4F` floors, `walkableAreas` strict validation).

- [ ] **Step 4: Run full verification suite and visual browser check**

1. Run `npm test && npm run typecheck && npm run build && npm run test:sites`
   Expected: ALL unit tests pass (zero skipped/failing), TypeScript check exits 0, Vite + Sites build produces `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and Sites worker tests pass.
2. Start local Vite server (`npm run dev`), open `http://localhost:5173/?est=campus` in the `browser` subagent, switch across `1F`, `2F`, `3F`, `4F Rooftop`, test an accessible route (`Campus PWD Parking` -> `Classroom B1-304` and `B1 Registrar` -> `B2 Computer Laboratory`), verify clean visual layout & zero console/UI clipping, then stop the background Visual Companion & dev server when finished.
