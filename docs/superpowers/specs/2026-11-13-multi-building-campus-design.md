# Multi-Building Campus (BP 344) Design

**Date:** 2026-11-13
**Status:** Ready for approval (builder check complete; user confirmed Cafeteria & Stockroom rules)

## Intent

Add a **Multi-Building Campus (BP 344)** establishment alongside `Civic Center` and `Regional Shopping Mall (BP 344)` in the indoor wayfinding prototype. Two distinct buildings — **Building 1 (4 floors: 3 enclosed + rooftop)** and **Building 2 (3 floors enclosed)** — share one unified metric site plan so Dijkstra computes valid **Shortest** and **Accessible** routes inside each building, vertically across floors, and horizontally between buildings via BP 344 accessible outdoor paths and `1:12` entrance ramps.

## Goals

1. **Exact room and circulation fidelity** per building and floor:
   - **Building 1 — 1F:** Registrar, Stockroom, Cafeteria (spanning two connected rooms: Dining Hall + Service Counter & Kitchen), Comfort Room, Elevator, Stairs, and Ramp + Stairs Entrance.
   - **Building 1 — 2F:** 3 Classrooms (`B1-201`–`B1-203`), Faculty Room, Comfort Room, Elevator, Stairs.
   - **Building 1 — 3F:** All Classrooms (4 enclosed classrooms `B1-301`–`B1-304`), Comfort Room, Elevator, Stairs.
   - **Building 1 — 4F (Rooftop):** Open Area, Garden Area, Elevator, Stairs.
   - **Building 2 — 1F:** 3 Classrooms (`B2-101`–`B2-103`), Principal's Office, Comfort Room, Elevator, Stairs, and Ramp + Stairs Entrance.
   - **Building 2 — 2F:** 3 Classrooms (`B2-201`–`B2-203`), Computer Laboratory, Comfort Room, Elevator, Stairs.
   - **Building 2 — 3F:** 4 Classrooms (`B2-301`–`B2-304`), Elevator, Stairs.
   - **Building 2 — 4F:** Displays Building 2's lower non-accessible roof slab outline (zero nodes/edges).
2. **Strict BP 344 Accessibility Law alignment:**
   - **PWD Parking:** Dual `3.70 m` effective-width stalls (`2.60 m` bay + `1.50 m` shared striped transfer aisle) with ISA pavement markings and dropped curb cut (`1:12` flares + tactile block warnings).
   - **Entrances & Ramps:** Both Building 1 and Building 2 provide side-by-side **exterior stairs** (`kind: 'stairs'`, `accessible: false`) and **`1:12` accessible ramps** (`kind: 'ramp'`, `accessible: true`, `1.50 m` clear width, `100 mm` toe-curbs, `1.50 m × 1.50 m` top/bottom level landings, dual `0.70 m`/`0.90 m` handrails with `300 mm` extensions).
   - **Campus Promenade & Corridors:** `3.50 m` outdoor accessible campus promenade with `600 mm` tactile guidance strip linking PWD parking, Building 1, and Building 2 on `1F`; `3.00 m` interior main corridors (`>= 1.80 m` passing clearance) with `>= 0.90 m` clear doorways.
   - **Elevators & Stairs:** Vertically stacked across `1F–4F` (B1) and `1F–3F` (B2) at identical `(x, y)` coordinates; elevators (`>= 1.40 m × 1.50 m` internal car) marked `accessible: true`; stairs (`<= 150 mm` riser, `300 mm` tread, dual handrails, tactile stair nosing/landings) marked `accessible: false`.
   - **BP 344 Comfort Rooms:** Vertically stacked wet core on B1 `1F–3F` and B2 `1F–2F`, each featuring an outward-swing PWD cubicle (`1.50 m` clear turning circle, L-shaped & folding grab bars, `0.45 m` water closet, roll-under lavatory, emergency pull-cord).
   - **Accessible Furnishings:** `0.80 m` low accessible counters in Registrar, Cafeteria Service Counter, and Principal's Office; designated wheelchair bays (`>= 0.90 m × 1.20 m`) in classrooms and an adjustable-height accessible workstation in the Computer Laboratory; `1.20 m` safety parapet with `100 mm` kickplate around Building 1 `4F` Rooftop.
3. **Full geometry & routing guarantees:**
   - Include `walkableAreas` for every floor (`0..3`) and pass `validateGraph` (`routing.ts` + `geometry.ts`) so **zero edges cross mapped walls** and every doorway/vertical core has its own orthogonal corridor junction (**no route overshoot or double-back**).
   - Match printed blueprint dimension labels (`m`) cleanly to graph edge `distance` weights.

## Non-goals

- Modifying existing `Civic Center` (`hotel.ts` / `civicPlan.ts`) or `Regional Shopping Mall` (`mallPlan.ts`) blueprints or breaking default `App` Civic Center tests.
- Building a standalone building-toggle UI outside the existing `1F–4F` floor tabs and searchable `LocationPicker`.
- Supporting custom-upload scan flows for the built-in campus sample (`sample: true`).

## Anti-goals

- Creating two disconnected buildings that cannot route between Building 1 and Building 2.
- Omitting `walkableAreas` (we want wall-crossing regression checks enforced, unlike unverified shortcut graphs).
- Letting accessible mode traverse exterior entrance steps or interior stairwells, or routing through enclosed classrooms as corridor shortcuts.

## Approaches Considered

- **Option 1A — Single Unified Campus, Side-by-Side Twin Wings (Selected):** West Building 1 (`4F`) + East Building 2 (`3F`) placed side-by-side on a `72.0 m × 40.0 m` (`1440 × 800 px` at `20 px/m`) landscape sheet connected via a southern `1F` accessible campus promenade and central BP 344 PWD parking zone. Matches `HotelMap`'s wide viewport and keeps vertical elevator/stair shafts at constant `(x, y)` across shared `1F–4F` floor tabs.
- **Option 1B — North–South Courtyard:** Rejected due to taller square aspect ratio (`~44 m × 48 m`) requiring heavier zoom/pan in desktop layout.
- **Option 2 — Separate Establishments:** Rejected because it prevents direct Dijkstra routing between buildings (e.g., `B1 Registrar` -> `B2 Computer Lab`).

## Metric Geometry & Layout (`1 m = 20 px`, Sheet `72.0 m × 40.0 m`)

`CAMPUS_SCALE = 20` (`metersPerPixel = 0.05`). Sheet canvas: `1440 × 800 px`.

### Structural Envelopes
- **Building 1 (West Wing, `4F` + Rooftop):** `x = 4.0..34.0 m` (`30.0 m` wide), `y = 4.0..23.0 m` (`19.0 m` deep).
  - Interior Central Corridor (`1F–3F`): `x = 4.0..34.0 m`, `y = 12.0..15.0 m` (`3.00 m` wide, centerline `y = 13.5 m`).
  - Vertical Core (`1F–4F`, exact stacked `(x, y)`):
    - Elevator: `x = 4.0..7.2 m, y = 15.0..19.0 m`, node at `(5.6, 17.0)`, opens North to corridor `(5.6, 13.5)`.
    - Stairs: `x = 7.2..11.0 m, y = 15.0..20.5 m`, node at `(9.1, 17.5)`, opens North to corridor `(9.1, 13.5)`.
  - Comfort Room Core (`1F–3F`): `x = 27.5..34.0 m, y = 15.0..23.0 m`, node at `(30.75, 18.5)`, opens North to corridor `(30.75, 13.5)`.
- **Central Campus Plaza Void:** `x = 34.0..40.0 m` (`6.0 m` open landscaped separation between buildings above `1F` promenade).
- **Building 2 (East Wing, `3F` Enclosed):** `x = 40.0..68.0 m` (`28.0 m` wide), `y = 4.0..23.0 m` (`19.0 m` deep).
  - Interior Central Corridor (`1F–3F`): `x = 40.0..68.0 m`, `y = 12.0..15.0 m` (`3.00 m` wide, centerline `y = 13.5 m`).
  - Vertical Core (`1F–3F`, exact stacked `(x, y)`):
    - Elevator: `x = 40.0..43.2 m, y = 15.0..19.0 m`, node at `(41.6, 17.0)`, opens North to corridor `(41.6, 13.5)`.
    - Stairs: `x = 43.2..47.0 m, y = 15.0..20.5 m`, node at `(45.1, 17.5)`, opens North to corridor `(45.1, 13.5)`.
  - Comfort Room Core (`1F–2F`): `x = 62.0..68.0 m, y = 15.0..23.0 m`, node at `(65.0, 18.5)`, opens North to corridor `(65.0, 13.5)`.

### Floor-by-Floor Bay Assignments

| Floor (`FloorId`) | Building 1 (West Wing) | Building 2 (East Wing) |
|---|---|---|
| **1F Ground (`0`)** | **North (`y = 4..12`):** Registrar (`4..11.5`, door `7.75`), Stockroom (`11.5..19`, public routable destination, door `15.25`), Cafeteria Dining Hall (`19..26.5`, corridor door `22.75`), Cafeteria Counter & Kitchen (`26.5..34`, terminal room branched strictly off Dining Hall through internal archway `x = 26.5, y = 8.5`; no corridor door at `30.25` to eliminate Manhattan distance ties).<br>**South (`y = 15..23`):** Elevator, Stairs, B1 Entrance Lobby (`11..27.5`, main door `(19.25, 22.8)`), Comfort Room (`27.5..34`).<br>**Exterior Approach:** Landing node `b1-landing-top` at `(19.25, 24.0)`; straight stairs `(19.25, 24.0)->(19.25, 29.0)` + parallel West `1:12` ramp (`(19.25, 24.0)->b1-ramp-top(17.25, 24.0)->b1-ramp-bot(11.75, 24.0)->(11.75, 29.0)`). | **North (`y = 4..12`):** Classroom B2-101 (`40..49.3`, door `44.65`), Classroom B2-102 (`49.3..58.6`, door `53.95`), Classroom B2-103 (`58.6..68`, door `63.3`).<br>**South (`y = 15..23`):** Elevator, Stairs, B2 Entrance Lobby (`47..54`, main door `(50.5, 22.8)`), Principal's Office (`54..62`, door `58.0`), Comfort Room (`62..68`).<br>**Exterior Approach:** Landing node `b2-landing-top` at `(50.5, 24.0)`; straight stairs `(50.5, 24.0)->(50.5, 29.0)` + parallel East `1:12` ramp (`(50.5, 24.0)->b2-ramp-top(52.5, 24.0)->b2-ramp-bot(58.0, 24.0)->(58.0, 29.0)`). |
| **2F Second (`1`)** | **North (`y = 4..12`):** Classroom B1-201 (`4..14`, door `9.0`), Classroom B1-202 (`14..24`, door `19.0`), Classroom B1-203 (`24..34`, door `29.0`).<br>**South (`y = 15..23`):** Elevator, Stairs, Faculty Room (`11..27.5`, door `19.25`), Comfort Room (`27.5..34`). | **North (`y = 4..12`):** Classroom B2-201 (`40..49.3`, door `44.65`), Classroom B2-202 (`49.3..58.6`, door `53.95`), Classroom B2-203 (`58.6..68`, door `63.3`).<br>**South (`y = 15..23`):** Elevator, Stairs, Computer Laboratory (`47..62`, door `54.5`), Comfort Room (`62..68`). |
| **3F Third (`2`)** | **North (`y = 4..12`):** Classroom B1-301 (`4..14`, door `9.0`), Classroom B1-302 (`14..24`, door `19.0`), Classroom B1-303 (`24..34`, door `29.0`).<br>**South (`y = 15..23`):** Elevator, Stairs, Classroom B1-304 (`11..27.5`, door `19.25`), Comfort Room (`27.5..34`). | **North (`y = 4..12`):** Classroom B2-301 (`40..54`, door `47.0`), Classroom B2-302 (`54..68`, door `61.0`).<br>**South (`y = 15..23`):** Elevator, Stairs, Classroom B2-303 (`47..57.5`, door `52.25`), Classroom B2-304 (`57.5..68`, door `62.75`). |
| **4F Rooftop (`3`)** | **Entire Roof Deck (`4..34, 4..23`):** Elevator `(5.6, 17.0)`, Stairs `(9.1, 17.5)` opening onto rooftop promenade (`y = 13.5`); **Rooftop Open Area** (`4..18, 4..15` plus walkable south terrace `11..18, 15..23`, node `(12.0, 9.0)`); **Rooftop Garden Area** (`18..34, 4..23`, node `(26.0, 13.5)`), partitioned at `x = 18` with a `>= 1.80 m` threshold opening centered on `y = 13.5`. `1.20 m` safety parapet + `100 mm` toe kickplate drawn around perimeter. | **Non-accessible lower roof (`40..68, 4..23`):** Hatched roof membrane visual (`Building 2 Roof — 3F Top Slab (No Access)`). Zero graph nodes or edges. |

### Ground Site Connector & PWD Parking (`1F`, `y = 27.5..39.0 m`)
- **Accessible Campus Promenade (`y = 27.5..31.0 m`, centerline `y = 29.0 m`):** Horizontal tactile-guided walkway joining `B1 Ramp Bottom (11.75, 29.0)` <-> `B1 Stairs Bottom (19.25, 29.0)` <-> `Central Plaza Curb Cut (36.0, 29.0)` <-> `B2 Stairs Bottom (50.5, 29.0)` <-> `B2 Ramp Bottom (58.0, 29.0)`.
- **BP 344 PWD Parking Zone (`x = 30.0..42.0 m, y = 32.0..38.5 m`):** Destination node `campus-pwd-parking` at `(36.0, 35.0)` (`category: 'parking'`, `facility: true`), connected North to `(36.0, 29.0)` via `1:12` flared dropped curb (`kind: 'corridor'`, `accessible: true`, `6.0 m`).

## Routing Graph & Geometry Rules

1. **Corridor Junctions & Orthogonal Spurs:** Every room doorway, entrance vestibule, elevator cab, and stair landing connects perpendicularly (`via` only when clean right-angle segments lie inside contiguous `walkableAreas`) to its own `(doorX, 13.5)` junction along `y = 13.5 m`, except `Cafeteria Counter & Kitchen` (`(30.25, 8.5)`), which branches cleanly off `Cafeteria Dining Hall` (`(22.75, 8.5)`) through an internal archway (`x = 26.5, y = 8.5`, `7.50 m`) so the Dining Hall and Kitchen never become a corridor shortcut or tie on Manhattan distance. `Stockroom` (`(15.25, 8.5)`) connects publicly via corridor door `x = 15.25`. Adjacent junctions along the corridor chain strictly in ascending `x` order (`dx = x_right - x_left`). No edge skips junctions or doubles back.
2. **Walkable Polygons & Wall Crossings:** Define `campusWalkableAreas: Record<FloorId, WalkableArea[]>` covering every interior corridor, doorway threshold cutout, room interior floorplate, `4F` open south terrace (`x = 11..18, y = 15..23`) and `x = 18` garden threshold, entrance landing (`y = 22.8..25.0`), exterior `1:12` ramp/stair run, campus promenade, and PWD parking transfer aisle. `validateGraph(campusBuilding.graph)` must return zero errors, and every cross-floor transition (`from.floor !== to.floor`) must obey `geometry.ts` exact pixel `(x, y)` equality for `'elevator'` and `'stairs'`.
3. **Edge Accessibility Semantics:**
   - Corridors, campus promenade, curb cut (`(36.0, 35.0) -> (36.0, 29.0)`), level landing connectors, and elevators: `accessible: true`.
   - Exterior `1:12` entrance ramps: `kind: 'ramp'`, `accessible: true`, with `distance` matching horizontal planimetric span (`5.50 m` from ramp top to bottom landing) so printed blueprint labels match graph weights.
   - Interior stairwells (`from.floor !== to.floor`) and exterior entrance steps (`b*-landing-top` -> `b*-stairs-bot` on `1F`): `kind: 'stairs'`, `accessible: false`.
   - Exterior landing topology (no `via`, zero double-back): `b1-main-entrance (19.25, 22.8)` connects orthogonally South (`1.20 m`, `corridor`) to `b1-landing-top (19.25, 24.0)`. From `b1-landing-top`, straight `stairs` drop South (`5.00 m`, `accessible: false`) to `(19.25, 29.0)`, while a straight `corridor` runs West (`2.00 m`, `accessible: true`) along the level landing to `b1-ramp-top (17.25, 24.0)`, followed by a straight `1:12` `ramp` West (`5.50 m`, `accessible: true`) to `b1-ramp-bot (11.75, 24.0)` and South (`5.00 m`, `corridor`) to `(11.75, 29.0)`. Mirrored topology for Building 2 via `b2-landing-top (50.5, 24.0)` -> `b2-ramp-top (52.5, 24.0)` -> `b2-ramp-bot (58.0, 24.0)` -> `(58.0, 29.0)`.

## Code Shape & Workspace Integration

1. **`src/campusPlan.ts`:**
   - Exports `CAMPUS_SCALE = 20`, `campusGraph`, `campusFloors`, `campusBuilding` (`id: 'multi-building-campus-bp344'`, `name: 'Multi-Building Campus (BP 344)'`, `sample: true`, `status: 'ready'`).
   - Maps campus facilities to existing non-`'room'` `MapNode['category']` types (`'office'`, `'conference'` for classrooms, `'library'` for Computer Laboratory, `'dining'` for Cafeteria Dining & Counter, `'restroom'`, `'lounge'` for Open Area, `'facility'` for Garden Area & Stockroom, `'parking'`, `'entrance'`, `'elevator'`, `'stairs'`) so icons (`FacilityIcon.tsx`) and QR anchors (`StaffTools.tsx`) work accurately. Orders `campusNodes` so `b1-main-entrance` / `campus-pwd-parking` and a primary destination (e.g., `b2-computer-lab`) precede elevators/stairs for initial `App.tsx` selection.
   - Internal helpers for SVG floor rendering (`renderCampusFloorSvg` -> `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, escaping `&` as `&amp;`) drawing architectural walls, doorway swing arcs, BP 344 PWD restrooms (`1.50 m` turning dashed circle + grab bars), elevator tactile/Braille callouts, `1:12` ramp slope arrows + handrails, PWD parking ISA graphics, classroom wheelchair bays, and clear room/wing labels (`Building 1` & `Building 2`).
2. **`src/buildings.tsx`:** Re-export `campusBuilding` from `./campusPlan`.
3. **`src/Workspace.tsx`, `src/App.tsx`, `src/StaffTools.tsx`, & `src/closures.ts`:**
   - Extract a shared built-in sample registry (`SAMPLE_BUILDINGS`, starting with `mallBuilding` and `campusBuilding`) in `Workspace.tsx`, add `<option value={campusBuilding.id}>Multi-Building Campus (BP 344)</option>`, support per-sample deletion/restore in `deletedSamples`, and resolve `?est=` sample aliases (`campus`, `mall`, exact IDs) synchronously in `selected`'s initial state before child `App` mounts (preventing async overwrite and avoiding `loading` flash on built-in samples).
   - Gate `est: undefined` in `App.tsx` and `StaffTools.tsx` on `building.id === sampleBuilding.id` (instead of `building.sample`) so `?est=campus` and `?est=grand-mall` persist across reloads and Share Route QR/links, and recognize built-in aliases in `App.tsx`'s `sameBuilding` URL restoration check.
   - Include `a.name` in cross-floor labels in `src/closures.ts` (`${a.name} · ${floorName(a.floor)} ↔ ${floorName(b.floor)}`) so Building 1 and Building 2 elevators/stairs stay distinct in `ClosuresDialog` and don't collide on React keys in `App.tsx`.
4. **`AGENTS.md`:** Append a concise entry documenting the `Multi-Building Campus (BP 344)` establishment (`src/campusPlan.ts`, `campusBuilding`) and resolved decisions.

## Tests & Verification

Add `tests/campus-establishment.test.ts` and register it in `package.json` `"test"` verifying:
- `campusBuilding` metadata (`status: 'ready'`, `sample: true`, 4 floors `1F–4F`, `metersPerPixel === 0.05`, SVG data URL validity + escaped `&amp;`).
- `validateGraph(campusBuilding.graph)` returns zero errors (strict `walkableAreas` wall-crossing check + vertical `(x, y)` stack check).
- Exact facility inventory matching all requested rooms across Building 1 (`1F–4F`) and Building 2 (`1F–3F`) plus zero Building 2 nodes/edges on `4F`.
- **Shortest vs. Accessible routing invariants:**
  - `Campus PWD Parking` -> `B1 Classroom B1-304` uses `1:12` ramp + `B1 Elevator` in `accessible` mode, avoiding stairs (`stairs: 0`), while `shortest` uses entrance steps + stairwell and has shorter/equal distance.
  - `Campus PWD Parking` -> `B2 Computer Laboratory` uses B2 `1:12` ramp + `B2 Elevator` in `accessible` mode.
  - Cross-building route `B1 Registrar` -> `B2 Principal's Office` traverses B1 Exit -> `1F` Campus Promenade -> B2 Entrance cleanly, switching `stairs` vs `ramp` by mode.
  - Rooftop route `B2 Classroom B2-304` -> `B1 Rooftop Garden Area` descends B2 -> crosses `1F` Promenade -> ascends B1 to `4F` (`stairs` vs `elevator` by mode).
  - Exhaustive **all-facility-pairs** no-double-back regression check in both `shortest` and `accessible` modes (plus Share Route / `?est=campus` URL state check).
- Full verification gate: `npm test`, `npm run build`, `npm run test:sites`, plus browser preview check opening `?est=campus` in the local Vite server.
