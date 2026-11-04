# Human-Readable Codebase & Dijkstra Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor condensed and minified modules in `src/` into idiomatic, human-readable TypeScript/React code with clean formatting and clear documentation, and highlight Dijkstra routing decision-making for shortest vs accessible routes.

**Architecture:** Expand single-line statements, unpacked multiple declarations, and compacted JSX into well-formatted, commented files. Add JSDoc annotations to `src/routing.ts` detailing the binary min-heap priority queue, graph filtering (mode checks, stairs exclusion, unreviewed edge gating, room shortcut prevention), and predecessor reconstruction without altering runtime behavior or breaking any tests.

**Tech Stack:** React 19, TypeScript, Vite, Node.js test runner (`tsx --test`), `@phosphor-icons/react`.

**Spec:** User request: "make the codebase readable by a human and highlight the dijkstra algorithm and the decision making used for shortest route and accessibility route."

## Global Constraints
- Do not change algorithm logic or public function signatures in `src/routing.ts`, `src/geometry.ts`, etc.
- Maintain floating-point tolerances (`1e-12`) and deterministic tie-breaking in `compare()` to ensure reproducibility.
- All 73 tests in `npm test` and 4 tests in `npm run test:sites` must continue to pass without regression.
- Preserve DOM selectors and accessible ARIA attributes (`id="floor-map"`, `id="route-directions"`, `class="selected-path"`, etc.).

## Review Focus
1. **Formatting Regression:** Expanding single-line statements must not accidentally drop statements or mutate local state hooks.
2. **Deterministic Tie-Breaking:** `compare()` in `src/routing.ts` must maintain string ID tie-breaking so Dijkstra playback remains stable.
3. **Room Shortcut Guard:** Preserving `if (id !== start && nodes.get(id)?.category === 'room') continue;` to ensure private rooms remain non-traversable.
4. **Accessible Filter Integrity:** Ensuring `mode === 'accessible'` excludes both `!edge.accessible` and `edge.kind === 'stairs'` under all conditions.
5. **Sites Worker Packaging:** Preserving build outputs in `dist/` verified by `npm run test:sites`.

---

### Task 1: Refactor and Document `src/routing.ts`

**Files:**
- Modify: `src/routing.ts:1-148`
- Test: `tests/routing.test.ts`

**Interfaces:**
- Consumes: `HotelGraph`, `RouteMode`, `RouteResult` from `src/types.ts`, `geometryErrors`, `pointIsMapped` from `src/geometry.ts`.
- Produces: `findRoute(graph, start, end, mode, trace?): RouteResult`, `validateGraph(graph): string[]`.

- [ ] **Step 1: Check baseline test run**
Run: `npm test tests/routing.test.ts`
Expected: PASS

- [ ] **Step 2: Format and document `src/routing.ts`**
Expand `RouteQueue`, `validateGraph`, and `findRoute`. Add detailed section comments explaining:
  1. Priority queue with binary min-heap and tie-breaking.
  2. Adjacency graph filtering for `shortest` vs `accessible` modes.
  3. Non-traversable room shortcut barrier.
  4. Relaxation with epsilon tolerance.
  5. Predecessor backtracking.

- [ ] **Step 3: Run routing test suite**
Run: `npm test tests/routing.test.ts`
Expected: PASS (all 13 subtests pass)

---

### Task 2: Refactor `src/ResearchView.tsx`

**Files:**
- Modify: `src/ResearchView.tsx:1-17`
- Test: `tests/building-ui.test.ts`

**Interfaces:**
- Consumes: `useBuilding` from `src/buildings.tsx`, `runScenarios` from `src/scenarios.ts`, `formatDistance` from `src/format.ts`.
- Produces: `ResearchView({ routes, onBack })`.

- [ ] **Step 1: Format minified JSX and handler functions**
Expand line 16 (currently a single 2000+ character line) into standard indented React JSX with clear sub-sections (`research-title`, `research-explanation`, `graph-stats`, `table-scroll`, `test-summary`).

- [ ] **Step 2: Verify Research View renders cleanly and passes tests**
Run: `npm test tests/building-ui.test.ts`
Expected: PASS

---

### Task 3: Refactor `src/HotelMap.tsx` and `src/DijkstraPlayback.tsx`

**Files:**
- Modify: `src/HotelMap.tsx:1-142`
- Modify: `src/DijkstraPlayback.tsx:1-75`
- Test: `tests/building-ui.test.ts`

**Interfaces:**
- Consumes: `useBuilding` from `src/buildings.tsx`, `edgeGeometry` from `src/geometry.ts`.
- Produces: `HotelMap`, `DijkstraPlayback`.

- [ ] **Step 1: Expand condensed state and effect declarations**
Break multi-variable `useState` declarations into readable individual hooks. Add explanatory comments for viewport centering, frame point calculations, GSAP stroke animations, and trace overlay state.

- [ ] **Step 2: Verify map and playback tests**
Run: `npm test tests/building-ui.test.ts`
Expected: PASS

---

### Task 4: Clean Up State & Prop Declarations in `src/App.tsx` and `src/Workspace.tsx`

**Files:**
- Modify: `src/App.tsx:40-75`
- Modify: `src/Workspace.tsx:190-218`
- Test: `tests/building-ui.test.ts`

- [ ] **Step 1: Expand combined `useState` and `useEffect` statements**
Split comma-separated hook declarations onto separate lines for clarity and maintainability.

- [ ] **Step 2: Verify full test suite and build**
Run: `npm test && npm run build && npm run test:sites`
Expected: PASS (73/73 unit tests, 4/4 sites tests)
