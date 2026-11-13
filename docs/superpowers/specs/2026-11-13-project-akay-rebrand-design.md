# Project AKAY Rebrand Design (Option A)

## Intent & Identity
- **System Name:** Project AKAY (*akay* in Tagalog means to guide or assist; not an abbreviation).
- **Research Title:** Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm.
- **Why:** Rebrand the product chrome, headings, preloader, research exports, and docs from Civic Center / Linden Hotel so the system clearly presents as a general-purpose, multi-establishment indoor navigation platform powered by Dijkstra's algorithm.

## Approach Chosen: Option A — Branded Workspace + Dynamic Multi-Establishment UI
We chose Option A over a separate pre-map directory hub (Option B) and a deep internal symbol/filename rename (Option C). It removes every user-facing Civic Center/hotel leak, surfaces custom establishment creation upfront, keeps direct map-first routing intact, and avoids breaking saved `?est=` QR links, IndexedDB data, or test imports.

## Goals, Non-Goals & Anti-Goals
- **Goals:** Project AKAY identity on `<title>`, header wordmarks, studio workspace bar, preloader, research view exports, package metadata, and project docs; dynamic facility headings (`Navigate {building.name}, step-free or shortest path.`); grouped dropdown (`Built-in samples` vs `Saved establishments`); visible `+ New` button in workspace controls; clear copy highlighting Dijkstra's shortest vs accessible routing.
- **Non-Goals:** Altering Dijkstra routing math, floor geometry (`civicPlan.ts`, `mallPlan.ts`, `campusPlan.ts`), IndexedDB store names (`indoor-wayfinding`), or internal TS/CSS symbols (`HotelMap`, `HotelGraph`, `sampleBuilding.id = 'linden-sample'`, `--civic-*`).
- **Anti-Goals:** Never expand `AKAY` as an acronym; never remove built-in samples (`Civic Center`, `Regional Commercial Mall (BP 344)`, `Multi-Building Campus (BP 344)`) or weaken staff obstacle/access review gates.

## Scope of Changes
1. **Document & Package Meta** (`index.html`, `package.json`)
   - Default `<title>` -> `Project AKAY · Accessibility-Aware Indoor Facility Finder`.
   - `package.json`: `"name": "project-akay"` + description matching research title.
2. **Workspace Bar, Facility Picker & Preloader** (`src/Workspace.tsx`, `src/concierge.css`)
   - `.workspace-brand` -> `Project AKAY` with `<small>Accessibility-Aware Indoor Facility Finder</small>`.
   - `document.title` -> `${current.name || 'New establishment'} · Project AKAY`.
   - `<select>` groups presets under `Built-in samples` (`Civic Center`, `Regional Commercial Mall (BP 344)`, `Multi-Building Campus (BP 344)`) and user maps under `Saved establishments`.
   - Add compact `+ New` button (`aria-label="New establishment"`) beside `Map tools` in `.workspace-controls-cluster`, expanding desktop `.site-header` right gutter cleanly so header nav buttons never collide.
   - Replace `CivicLoader` / Civic-only `PRELOADER_FLOORS` with a generic `SystemLoader` displaying `Project AKAY` (`Accessibility-Aware Indoor Facility Finder`) and 3 engine stages (`01 GRAPH · Dijkstra Shortest Path`, `02 ACCESS · Step-Free Filtering`, `03 STUDIO · Any Establishment Plan`).
3. **Guest Header & Dynamic Hero** (`src/App.tsx`, `src/concierge.css`)
   - `.wordmark` displays `Project AKAY` with active establishment badge (`{building.name}` + `Sample` tag when built-in) so the system brand stays visible alongside the active venue on desktop and mobile.
   - Hero `<h1>` renders `Navigate ${building.name || 'this establishment'}, step-free or shortest path.`
   - Hero subtitle: `Compare step-free ramp and elevator routes against shortest stair paths in exact meters using Dijkstra’s algorithm.`
4. **Research View & Exports** (`src/ResearchView.tsx`)
   - Subtitle/header frames Project AKAY (`Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm`).
   - JSON export uses `system: 'Project AKAY'`, `facility: building.name`, `benchmarkSample: 'Civic Center'`, filename `project-akay-routing-results.json`.
   - Sample disclaimer reads `"This is a built-in sample establishment with manually configured accessibility conditions."`
5. **Docs & Tests** (`README.md`, `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`, `tests/building-ui.test.ts`)
   - Update docs from Linden Hotel / Civic prototype framing to Project AKAY.
   - Update UI assertions in `tests/building-ui.test.ts` to verify Project AKAY header branding, dynamic active establishment hero, preloader/picker behavior, and non-Civic sample rendering.

## Verification Criteria
- `npm test`, `npm run typecheck`, `npm run build:vercel`, `npm run build`, and `npm run test:sites` all pass after implementation.
- Live dev preview inspected visually across Civic Center, Campus/Mall, and mobile widths with no header overlap or leftover `Civic Center` hardcoding outside the Civic Center sample itself.
