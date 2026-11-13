# Project AKAY Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the prototype from Civic Center / Linden Hotel to **Project AKAY** (*Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm*) across user-facing chrome, preloader, dynamic headings, research exports, and documentation.

**Architecture:** Apply Option A from the approved spec: update metadata, workspace header controls, preloader, guest hero/wordmark, research view exports, and markdown docs while preserving internal graph/map filenames, `sampleBuilding.id` (`'linden-sample'`), routing logic, blueprints, and `?est=` QR link compatibility. Drive guest headings and research metadata dynamically from `building.name`.

**Tech Stack:** React 19, TypeScript, Vite 6, Phosphor Icons, plain CSS (`src/concierge.css`), Node `node:test` + `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-13-project-akay-rebrand-design.md`

## Global Constraints

- System name is verbatim **`Project AKAY`** (*akay* in Tagalog means to guide or assist; **never** expand AKAY as an acronym).
- Full research title is verbatim **`Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm`**.
- Keep internal IDs and symbols intact (`sampleBuilding.id === 'linden-sample'`, `HotelMap`, `HotelGraph`, `hotel.ts`, `civicPlan.ts`, `--civic-*`).
- Keep all three built-in samples selectable (`Civic Center`, `Regional Commercial Mall (BP 344)`, `Multi-Building Campus (BP 344)`) plus user-saved browser establishments.
- Preserve Sites packaging (`dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`) and Vercel config (`vercel.json` -> `npm run build:vercel` -> `dist/client`).

## Review Focus

1. **Blank or whitespace `building.name` on custom draft:** Guest hero `<h1>` and `document.title` must fall back cleanly (`Navigate this establishment, step-free or shortest path.` and `New establishment · Project AKAY`) without empty gaps — pinned by test in Task 2.
2. **Switching across samples (`Civic Center`, `Mall`, `Multi-Building Campus`) and custom establishments:** Never render hardcoded `"Navigate the Civic Center"` on other buildings or call them `"sample civic facility"` — pinned by tests in Tasks 2 & 3.
3. **Header crowding after adding `Project AKAY`, venue pill, and `+ New` button:** Right-hand `.workspace-bar.is-integrated-bar` must fit without colliding with `.site-header nav` on desktop (`>= 1040px`) and wrap cleanly below `1040px` / `420px` — verified in CSS (Tasks 1 & 2) and live browser check (Task 4).
4. **Research JSON export when inspecting non-Civic buildings:** Export payload must attach `system`, active `facility: building.name`, `benchmarkSample: 'Civic Center'`, and filename `'project-akay-routing-results.json'` — pinned by unit test on `buildResearchExport` in Task 3.
5. **Preserved tests & dual hosting builds:** All existing unit, routing, mall, campus, AI scan, and Sites worker tests plus `build:vercel` and `build` remain green — verified in Task 4.

---

### Task 1: Workspace Topbar, Grouped Facility Picker, Preloader & Package Meta

**Files:**
- Modify: `index.html:6`
- Modify: `package.json:2-4`
- Modify: `src/Workspace.tsx:17-177,216,249-333`
- Modify: `src/concierge.css:2521-2706,2780-2870,3223-3290,4051-4154`
- Test: `tests/building-ui.test.ts`

**Interfaces:**
- Produces: exported `SystemLoader({ buildingName, exiting, onSkip }: { buildingName: string; exiting: boolean; onSkip: () => void })` in `src/Workspace.tsx` for unit verification and reuse by loading/suspense boundaries.
- Produces: upfront `+ New` button in `.workspace-controls-cluster` invoking `create()` alongside grouped `<optgroup>` facility options (`Built-in samples`, `Saved establishments`).

- [ ] **Step 1: Write failing tests in `tests/building-ui.test.ts`**

Add assertions at the bottom of `tests/building-ui.test.ts` importing `Workspace` and `SystemLoader` from `../src/Workspace`:
```ts
test('Project AKAY workspace and preloader present general multi-establishment chrome without Civic-only loader floors', () => {
  const loaderHtml = renderToStaticMarkup(createElement(SystemLoader, { buildingName: '', exiting: false, onSkip: () => {} }));
  assert.ok(loaderHtml.includes('Project AKAY'));
  assert.ok(loaderHtml.includes('Accessibility-Aware Indoor Facility Finder'));
  assert.ok(loaderHtml.includes('Dijkstra Shortest Path'));
  assert.ok(!loaderHtml.includes('Rescue &amp; fire truck bays'));

  const workspaceHtml = renderToStaticMarkup(createElement(Workspace));
  assert.ok(workspaceHtml.includes('Project AKAY'));
  assert.ok(workspaceHtml.includes('optgroup label="Built-in samples"'));
  assert.ok(workspaceHtml.includes('aria-label="New establishment"'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/building-ui.test.ts`
Expected: FAIL (`SystemLoader` not exported / `Rescue &amp; fire truck bays` still present / `optgroup` missing).

- [ ] **Step 3: Update `index.html`, `package.json`, `src/Workspace.tsx`, and `src/concierge.css`**

1. In `index.html:6`, set `<title>Project AKAY · Accessibility-Aware Indoor Facility Finder</title>`.
2. In `package.json`, set `"name": "project-akay"` and add `"description": "Accessibility-Aware Indoor Facility Finder System Using Dijkstra's Algorithm"`.
3. In `src/Workspace.tsx`:
   - Replace `PRELOADER_FLOORS` with `PRELOADER_STAGES` representing Project AKAY's engine stages:
     - `01 GRAPH` — `Dijkstra Shortest Path`: `Evaluates weighted meter edges across corridors, ramps, and stairs` (`Main gate` -> `Target wing`)
     - `02 ACCESS` — `BP 344 Step-Free Filter`: `Excludes stairs and unverified links for wheelchair-accessible routes` (`Entrance ramp` -> `Elevator`)
     - `03 STUDIO` — `Multi-Establishment Plans`: `Upload floor plans, calibrate meter scale, and review doorway access` (`Floor plan` -> `Verified graph`)
   - Rename `CivicLoader` -> exported `SystemLoader` (`{ buildingName, exiting, onSkip }`). Display `buildingName.trim() || 'Project AKAY'` in `<strong>`, `Accessibility-Aware Indoor Facility Finder` in `<span>` when custom/default (`Project AKAY · ${buildingName}` or `Accessibility-Aware Indoor Facility Finder`), keeping SVG architectural drafting animation (`ARCHITECTURAL GRAPH · ${activeStage.code}`). Ensure fallback prop at call sites (`Workspace.tsx:249,332`) uses `current.name || 'Project AKAY'` and `current.name || 'Floor Plan Studio'`.
   - Update `document.title` effect (`Workspace.tsx:216`): `` `${current.name || 'New establishment'} · Project AKAY` ``.
   - Update `.workspace-brand`: `<span>Project AKAY</span><small>Indoor Facility Finder</small>`.
   - In `.workspace-controls-cluster`: keep `Facility <select>` with `<optgroup label="Built-in samples">` (Civic Center + active `BUILT_IN_SAMPLES`) and conditional `{customBuildings.length > 0 && <optgroup label="Saved establishments">...</optgroup>}` (where `customBuildings = library.filter(b => !BUILT_IN_SAMPLES.some(s => s.id === b.id) && b.id !== sampleBuilding.id)`), add compact `<button type="button" className="workspace-new-btn" disabled={loading||saving} aria-label="New establishment" onClick={create}><Plus size={14} aria-hidden="true"/><span>New</span></button>`, keep delete button & `Map tools`.
4. In `src/concierge.css`:
   - Add styling for `.workspace-new-btn` matching `.workspace-tools summary` (emerald hover/focus accent, compact pill) and `.workspace-picker select { max-width: 175px; text-overflow: ellipsis; }` on desktop.
   - Adjust `.site-header` desktop right padding (`3225`: `padding: 0 430px 0 24px;`) so `.site-header nav` stays centered without intersecting `.workspace-bar.is-integrated-bar`; verify `max-width: 1040px` resets header padding cleanly and `.workspace-controls-cluster` wraps cleanly below `420px`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/building-ui.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add index.html package.json src/Workspace.tsx src/concierge.css tests/building-ui.test.ts
git commit -m "feat: rebrand workspace bar, preloader, and metadata to Project AKAY"
```

---

### Task 2: Dynamic Guest Wordmark, Hero Headline & Dijkstra Copy

**Files:**
- Modify: `src/App.tsx:121-137`
- Modify: `src/concierge.css:317-343,2536-2544,3231-3243,4124-4136`
- Test: `tests/building-ui.test.ts`

**Interfaces:**
- Consumes: `building.name` and `building.sample` from `useBuilding()` in `src/App.tsx`.
- Produces: `.wordmark` rendering both `Project AKAY` and active venue pill (`building.name`), dynamic `<h1>` (`Navigate ${building.name.trim() || 'this establishment'}, step-free or shortest path.`), and Dijkstra-explicit hero subtitle.

- [ ] **Step 1: Update existing and add failing tests in `tests/building-ui.test.ts`**

Update line 14 assertion in `tests/building-ui.test.ts` (which asserted old `'Navigate the Civic Center, step-free or shortest path.'`) and add non-Civic + blank-name tests:
```ts
test('default Civic Center sample renders 1200x1000 metric floor plan, Project AKAY brand and dynamic hero', () => {
  const html = renderToStaticMarkup(createElement(App));
  assert.ok(html.includes('Project AKAY'));
  assert.ok(html.includes('Navigate Civic Center, step-free or shortest path.'));
  assert.ok(html.includes('Dijkstra'));
  assert.ok(html.includes('Main entrance'));
  assert.ok(html.includes('Public library'));
  assert.ok(html.includes('Souvenir shop'));
  assert.ok(html.includes('viewBox="0 0 1200 1000"'));
  assert.ok(html.includes('cta-arrow-badge'));
  assert.ok(!html.includes('demo-label') && !html.includes('picker-selected-floor-tag'));
  assert.ok(!html.includes('Restaurant') && !html.includes('Suite 201'));
});

test('guest UI adapts hero dynamically for arbitrary establishments and falls back cleanly on blank names', () => {
  const custom: Building = { ...building, name: 'St. Luke Medical Pavilion' };
  const customHtml = renderToStaticMarkup(createElement(BuildingContext.Provider, { value: custom }, createElement(App)));
  assert.ok(customHtml.includes('Project AKAY'));
  assert.ok(customHtml.includes('Navigate St. Luke Medical Pavilion, step-free or shortest path.'));
  assert.ok(!customHtml.includes('Civic Center'));

  const unnamed: Building = { ...building, name: '   ' };
  const unnamedHtml = renderToStaticMarkup(createElement(BuildingContext.Provider, { value: unnamed }, createElement(App)));
  assert.ok(unnamedHtml.includes('Navigate this establishment, step-free or shortest path.'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/building-ui.test.ts`
Expected: FAIL (`Navigate Civic Center` missing — currently hardcoded `Navigate the Civic Center`).

- [ ] **Step 3: Implement guest header wordmark and dynamic hero in `src/App.tsx` + `src/concierge.css`**

1. In `src/App.tsx`:
   - Compute `const venueName = building.name.trim() || 'this establishment';`
   - Update `.wordmark` (`App.tsx:122-124`):
     ```tsx
     <a className="wordmark" href="#" onClick={event => { event.preventDefault(); changeView('guest'); }}>
       <span className="hotel-emblem" aria-hidden="true">{building.sample ? <Tree size={18} /> : <MapTrifold size={18} />}</span>
       <span className="wordmark-stack">
         <strong>Project AKAY</strong>
         <small>{building.name.trim() || 'Indoor Facility Finder'}{building.sample ? ' · Sample' : ''}</small>
       </span>
     </a>
     ```
   - Update `.concierge-intro` (`App.tsx:133-136`):
     ```tsx
     <div className="concierge-intro">
       <h1>Navigate {venueName}, step-free or shortest path.</h1>
       <p>Compare step-free ramp and elevator routes against shortest paths in exact meters using Dijkstra’s algorithm.</p>
     </div>
     ```
2. In `src/concierge.css`, style `.wordmark-stack` (`display: flex; flex-direction: column; line-height: 1.15; min-width: 0;`), `.wordmark-stack strong` (`font-size: 15px; font-weight: 700; color: var(--civic-obsidian);`), and `.wordmark-stack small` (`font-size: 11px; font-weight: 500; color: var(--tabular-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px;`) with responsive tightening under `@media (max-width: 768px)` (`max-width: 170px`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/building-ui.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/App.tsx src/concierge.css tests/building-ui.test.ts
git commit -m "feat: adapt App wordmark and hero dynamically under Project AKAY"
```

---

### Task 3: Research View Rebrand, Export Payload Helper & Documentation Updates

**Files:**
- Modify: `src/ResearchView.tsx:12-66,238-246`
- Modify: `README.md`
- Modify: `PRODUCT.md`
- Modify: `DESIGN.md`
- Modify: `AGENTS.md`
- Test: `tests/building-ui.test.ts`

**Interfaces:**
- Produces: exported pure helper `buildResearchExport(buildingName: string, results: ReturnType<typeof runScenarios>)` in `src/ResearchView.tsx` returning `{ filename: 'project-akay-routing-results.json', payload: { system, facility, benchmarkSample, measuredAt, note, results } }`.

- [ ] **Step 1: Write failing tests for `ResearchView` and `buildResearchExport` in `tests/building-ui.test.ts`**

Add tests checking both JSX copy (custom vs sample non-Civic building) and export payload metadata:
```ts
test('ResearchView labels samples generically and exports Project AKAY metadata for the active facility', () => {
  const campusSample: Building = { ...building, id: 'multi-building-campus', name: 'Multi-Building Campus (BP 344)', sample: true };
  const sampleHtml = renderToStaticMarkup(createElement(BuildingContext.Provider, { value: campusSample },
    createElement(ResearchView, { routes: null, onBack: () => {} })));
  assert.ok(sampleHtml.includes('Project AKAY'));
  assert.ok(sampleHtml.includes('built-in sample establishment'));
  assert.ok(!sampleHtml.includes('sample civic facility'));

  const exported = buildResearchExport('Multi-Building Campus (BP 344)', []);
  assert.equal(exported.filename, 'project-akay-routing-results.json');
  assert.equal(exported.payload.system, 'Project AKAY — Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm');
  assert.equal(exported.payload.facility, 'Multi-Building Campus (BP 344)');
  assert.equal(exported.payload.benchmarkSample, 'Civic Center');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/building-ui.test.ts`
Expected: FAIL (`buildResearchExport` undefined / `"sample civic facility"` still rendered).

- [ ] **Step 3: Implement `buildResearchExport` & copy updates in `src/ResearchView.tsx`, then update docs**

1. In `src/ResearchView.tsx`:
   - Export `buildResearchExport(buildingName: string, results: ReturnType<typeof runScenarios>)` returning:
     - `filename: 'project-akay-routing-results.json'`
     - `payload: { system: 'Project AKAY — Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm', facility: buildingName.trim() || 'Unnamed establishment', benchmarkSample: 'Civic Center', measuredAt: new Date().toISOString(), note: 'Predefined software tests against the fixed benchmark sample; not participant research results or building certification.', results }`
   - Use `buildResearchExport(building.name, results)` inside `download()`.
   - Update research subtitle (`ResearchView.tsx:60-61`):
     `<p>Project AKAY — Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm. Inspect {building.name.trim() || 'this establishment'}’s metric floor-plan graph and scenario checks.</p>`
   - Update disclaimer (`ResearchView.tsx:240`):
     `building.sample ? 'This is a built-in sample establishment with manually configured accessibility conditions.' : 'This uploaded map uses access conditions entered by its author.'`
2. Update documentation cleanly (preserving existing setup/Vercel/Sites/BP 344 technical details and test expectations):
   - `README.md`: Title `# Project AKAY — Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm`, explain *akay* meaning (Tagalog: assist/guide, not an abbreviation), describe general multi-establishment routing + built-in sample demos (`Civic Center`, `Regional Commercial Mall (BP 344)`, `Multi-Building Campus (BP 344)`).
   - `PRODUCT.md` & `DESIGN.md`: Update title/brand overview from Linden Hotel / Civic prototype framing to Project AKAY while documenting preserved design tokens and multi-establishment scope.
   - `AGENTS.md`: Append concise bullet recording the user's **Project AKAY** rebrand decision (`Project AKAY`, full research title, general multi-establishment UI + Option A boundaries).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/building-ui.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/ResearchView.tsx README.md PRODUCT.md DESIGN.md AGENTS.md tests/building-ui.test.ts
git commit -m "docs,feat: rebrand ResearchView exports and documentation to Project AKAY"
```

---

### Task 4: Full Automated Regression & Live Browser Verification

**Files:** None edited unless verification reveals a visual/layout issue.

- [ ] **Step 1: Run complete automated test, typecheck, and dual-build suite**

Run:
```bash
npm test && npm run typecheck && npm run build:vercel && npm run build && npm run test:sites
```
Expected: All unit/UI/routing/mall/campus/AI/Sites suites pass (`exit 0`), `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json` exist.

- [ ] **Step 2: Visually verify live app in built-in browser**

Inspect:
- `http://localhost:5173/` (default `Civic Center` sample — desktop `1440×900` and mobile `390×844`): verify header displays `Project AKAY`, venue sublabel, no nav/toolbar overlap, `Built-in samples` / `+ New` button visible, dynamic `Navigate Civic Center, step-free or shortest path.`, and Research view copy.
- `http://localhost:5173/?est=campus` (`Multi-Building Campus (BP 344)`): verify `Navigate Multi-Building Campus (BP 344), step-free or shortest path.` and `New establishment` button launches `Project AKAY` Floor Plan Studio cleanly (`Start with your place.`).
- Zero console errors and zero broken routes.
