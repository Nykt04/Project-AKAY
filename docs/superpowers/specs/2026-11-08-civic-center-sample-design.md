# Civic Center sample building — design

Status: draft for approval · 2026-11-08

## Intent
Replace the hotel content inside the "Civic Center" sample with a realistic 3-storey civic center whose
floor plans are drawn from exact metric geometry. The plan is shown in a research paper/defense, so every
printed dimension must equal what the routing graph uses. The system is accessibility-aware: its main
users have limited mobility, so the building must contain real choices between steps and ramps (outside
and inside) and between stairs and the elevator.

## Goals
- Three floors (ids 0/1/2, shown as "1st floor", "2nd floor", "3rd floor"; Philippine numbering, 1st = ground).
- Outside on the 1st-floor sheet: parking lot for government vehicles (fire trucks, rescue), PWD stalls,
  sidewalk, entrance plaza reached by **front steps** and an **accessible ramp**.
- Inside the 1st floor: a level change with **steps and a parallel ramp** so shortest and accessible routes differ.
- Dimension lines in meters: building size, corridor length/width, gaps between doorways along the corridor,
  room width × depth, ramp length and slope, step count/riser, parking stall and aisle sizes. Scale bar, north arrow.
- Restrooms on the 2nd and 3rd floors stacked at the same position (next to the stair/elevator core).
- Routing graph, wall-check areas and dimension labels all derived from one geometry source.

## Non-goals
- No second (emergency) stair, no fire-code compliance claim. Plan is "realistic", not certified.
- No 3D view, no furniture library beyond simple outlines (desks, shelves, seating, stalls).
- No change to the upload/AI-scan studio, routing algorithm, or UI layout.
- No logo work.

## Anti-goals
- Meter labels that disagree with graph edge weights.
- Routes that cross walls, enter rooms other than through their door, or double back (existing rules in AGENTS.md).
- Claiming the plan proves real-world accessibility.

## Approaches considered
| | Approach | Trade-off | Decision |
|---|---|---|---|
| A | Plans drawn in code (SVG) from metric geometry; graph + walkable areas derived from same data | Clean architectural look, not painterly; more code | **Picked by user** |
| B | AI-generated raster + hand-traced graph (how the hotel was made) | Prettier; no true scale, labels invented, walls drift from routes | Rejected: fails "realistic with meters" |
| C | Code geometry + generated art overlay | Art must match walls exactly; same failure as B | Rejected |

## Geometry (all meters; origin = top-left of sheet; 20 px per meter)
Sheet: 60 m × 50 m → 1200 × 1000 px, identical for all three floors so floor switching stays aligned.

### Building shell (every floor)
- Footprint x 4–44, y 3–25 → **40.0 m × 22.0 m**. Exterior walls 0.30 m, interior walls 0.15 m.
- Below, `bx = x − 4`, `by = y − 3` (building-local).
- Central corridor: by 10–13 (**3.0 m clear**), runs bx 0.3–39.7 (**39.4 m**).
- North band: rooms by 0–10 (≈9.7 m clear). South band: by 13–22 (≈8.7 m clear).
- Core (same on all floors):
  - Elevator bx 0–3, north band; car 2.4 × 2.4 m at by 7.6–10, door on corridor at bx 1.5.
  - Stair hall bx 3–9, north band; dog-leg stair, two 1.2 m flights, 12 risers × 0.15 m each, half landing.
    Opening onto corridor at bx 7.5. Floor-to-floor height 3.6 m.
    (Builder-check call: stairs sit east of the elevator so the stairs are genuinely shorter for every public room.)
  - Restroom slot bx 9–15, north band; door at bx 12 (used on floors 2 and 3).

### 1st floor (id 0) — ground
Outside:
- Entrance plaza x 18–30, y 25–28 (12 × 3 m), at finished-floor level (+0.60 m above parking grade).
- Front steps: x 20–28 (8 m wide), y 28–29.2, **4 risers × 0.15 m, 0.30 m treads**.
- Ramp: east of plaza, x 30–37.2, y 26–27.8 (**7.2 m run, 1.8 m wide, 1:12, 0.60 m rise**), bottom landing x 37.2–39 at grade.
- Sidewalk y 29.2–31, x 4–44.
- Parking lot x 2–58, y 31–49: drive aisle y 31–37 (**6.0 m**), bay row y 37–49:
  - 2 rescue/ambulance bays 3.5 × 8 m (x 4–11),
  - 8 government car stalls 2.5 × 5 m (x 11–31),
  - 2 PWD stalls 2.5 × 5 m with shared 1.2 m access aisle nearest the ramp foot (x 34–40.2),
  - 2 fire-truck bays 4.5 × 12 m (x 46–55), hatched red, labelled FIRE.
  - Painted pedestrian crosswalks across the aisle at x 24 (to steps) and x 38 (to ramp).
- Main entrance: double glass doors 2.0 m in the south wall at bx 22 (x 26).

Inside (interior level change of **0.45 m**: the lobby is at entrance level; the corridor and everything
north/west of it is 0.45 m higher):
- **Entrance lobby** south band bx 14–30: Information & lounge desk near the entrance, lounge seating.
- **Lobby steps** at the lobby's north edge, bx 20–24 (4 m wide), **3 risers × 0.15 m**, straight up from the doors to the corridor.
- **Lobby ramp** along the lobby east wall (beside the shop glass wall), bx 28–29.8 (1.8 m wide), running north
  from by 18.4 to by 13 (**5.4 m run, 1:12, 0.45 m rise**), landings top and bottom.
  (Builder-check call: ramp is east, away from the west core, so the steps stay the shorter path and the ramp the accessible one.)
- **Souvenir shop** south band bx 30–36, at lobby level; separated from the lobby by a **glass wall with a
  0.9 m glass door** at bx 30.
- Staff-only rooms (drawn, hatched, labelled, **not** routable): bx 9–15 north "Utility"; bx 15–40 north
  "Records & staff offices"; bx 0–14 south "Building services"; bx 36–40 south "Security / first aid".
  One of them ("Records room") exists as a facility node with **no edges**, for the "disconnected destination" research scenario.
- No 1st-floor restroom (not requested) — see open question.

### 2nd floor (id 1)
- Restroom bx 9–15 north (men, women, PWD all-gender cubicle drawn inside), door bx 12.
- **Public library** bx 15–40 north (25 × 10 m), door bx 27.5, shelves + reading tables outlined.
- **Office A** bx 0–20 south (20 × 9 m), door bx 10. **Office B** bx 20–40 south (20 × 9 m), door bx 30.

### 3rd floor (id 2)
- Restroom bx 9–15 north, door bx 12 (same position as 2nd floor).
- **Function Hall 1** bx 15–27.5 north (12.5 × 10 m), door bx 21. **Function Hall 2** bx 27.5–40 north, door bx 34.
- **Function Hall 3** bx 0–20 south (20 × 9 m), door bx 10. **Function Hall 4** bx 20–40 south, door bx 30.
- Hall doors 1.8 m double doors.

## Routing graph rules
- Every door, stair opening, elevator door, ramp end and step edge gets its own corridor junction directly
  outside it (AGENTS.md rule). Rooms are terminal: exactly one edge.
- Edge weight = length of the drawn polyline in meters, computed from geometry — never typed by hand. All doors,
  junctions and via points sit on a 0.5 m grid and edges are axis-aligned polylines, so weights are exact multiples
  of 0.5 m; round to 0.01 only to remove float drift. Labels print the same numbers (builder-check call).
- Old hotel node ids are dropped without an alias table; old links fall back to defaults. Update the sample's default
  start/end in `App.tsx` (currently `'reception'`/`'restaurant'`) to Main entrance → Public library (builder-check call).
- Kinds: steps (outside and lobby) = `stairs`, `accessible: false`; ramps = `ramp`; elevator = `elevator`.
- Vertical weights: stairs **8.6 m per storey** (walking length of two flights + landing);
  elevator **12 m per storey** — documented assumption (≈3.6 m travel plus waiting), shown in the research view as an assumption.
- Facilities (destinations/starts): Parking lot (at x 24 crosswalk), Accessible parking (PWD stalls), Main entrance,
  Information & lounge desk, Lounge, Souvenir shop, Stairs ×3, Elevator ×3, Restroom ×2, Public library, Office A,
  Office B, Function Hall 1–4, Records room (disconnected).

Expected behaviour (sanity targets, exact numbers come from geometry):
- Parking lot → Elevator: shortest uses front steps + lobby steps; accessible uses outdoor ramp + lobby ramp and is longer.
- Main entrance → Souvenir shop: level, no steps in either mode.
- Any 2nd/3rd-floor room in accessible mode uses the elevator; shortest uses stairs.

## Code shape (builder may refine)
- New `src/civicPlan.ts`: the single geometry source (rooms, walls with openings, doors, stairs, ramps, parking,
  dimension strings) plus `renderFloorSvg(floorId): string`.
- Floor images are SVG data URLs from `renderFloorSvg`, so `HotelMap` keeps rendering `<img src>` unchanged.
- `src/hotel.ts` keeps its file name and exports (`hotel`, `floors`, `nodeById`, `facilities`, …) but builds the
  civic graph from `civicPlan`; `src/walkable.ts` derives walkable rectangles from the same data.
- `buildings.tsx`: sample floors use the data URLs, width 1200, height 1000, `metersPerPixel: 0.05`; keep id `linden-sample`
  so saved URLs keep working.
- New facility categories: `library`, `office`, `shop`, `parking` (types union + `FacilityIcon` with Phosphor icons);
  function halls use `conference`, info desk uses `reception`.
- Remove hotel-specific bits: `HotelMap` "Steps only"/"No public connection" ids and hard-coded Ramp/Steps annotations
  (now drawn in the SVG), hotel scenarios, hotel PNGs in `public/assets/` if nothing else uses them.
- Visual style: ivory paper, charcoal walls, evergreen labels, brass dimension lines, glass = pale blue double line,
  door swing arcs, stair treads with "UP" arrow, ramp hatch with arrow and "1:12", staff rooms grey hatch.

## Tests
- Rewrite hotel-specific tests in `tests/routing.test.ts` for the civic graph: graph valid (incl. wall checks),
  rooms terminal, doorway-crossing check for library/one office/one hall/shop, no-double-back for every facility pair
  in both modes, elevator closure removes accessible upper-floor routes, Floyd–Warshall oracle (unchanged).
- New: dimension labels along each corridor equal the sum of the graph edges between the same junctions.
- New: restroom polygons on floors 1 and 2 are identical.
- Update `scenarios.ts` (steps vs ramp outside, lobby ramp, stairs vs elevator, elevator closure, disconnected
  Records room) and `tests/building-ui.test.ts`.
- `npm test`, `npm run build`, `npm run build:vercel`, `npm run test:sites` must pass.

## Also update
- `AGENTS.md`: Civic Center sample replaces Linden Hotel; plans are code-drawn from metric geometry; dimensions must match edge weights; accessibility-first.

## Left to the builder
Exact furniture outlines, label placement, colours within the existing palette, wall-polygon algorithm, SVG text
sizes, internal helper structure.
