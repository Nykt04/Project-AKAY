# Accessibility-aware Indoor Facility Finder

A React + TypeScript + Vite research prototype for accessible indoor navigation. Real Dijkstra routing compares shortest and accessible routes. Linden Hotel remains a fictional sample; other establishments can create their own maps.

## Use the map studio

1. Select **New establishment** and give it a name.
2. Upload each floor as PNG, JPG or WebP (up to 12 MB, under 40 megapixels). Export PDF/CAD pages as images first.
3. Choose **Corridor seed**, click a clear corridor, then **Scan pathways**. Without a seed, the scanner chooses the largest enclosed light region.
4. Inspect all generated lines. Adjust the wall threshold/padding and rescan if needed. Rescanning replaces that floor's nodes, links, cross-floor connections and obstacle corrections.
5. Correct the graph with Add node, Connect, Move node and Remove selected. Straight connections crossing the detected obstacle mask are rejected. Use intermediate nodes for turns. Open doorway/Block area correct the mask; these tools do not automatically reconnect the graph. Add connections afterward. Do not open real walls or use private rooms as shortcuts.
6. Use **Mark two known points**, click two points a known distance apart, enter meters and **Apply scale**. Do this on every floor.
7. Select a node using the map or inspector. Give it a location name and type, and enable **Show in guest destination list**. At least two destinations are required. Guest-room nodes must be terminal destinations.
8. Review each connection's type and access condition. A whole-floor confirmation is available only after explicitly checking all displayed connections. Stairs stay excluded from accessible routing. Confirming a route is staff input, not scanner evidence.
9. For multiple floors, label stair/elevator nodes on each drawing and link matching landings with a mapped vertical distance and access status.
10. Select **Use reviewed map**. The app checks calibration, destination names, geometry and review status before enabling guest routing. Select start/destination and **Find route** to compare paths.

Keyboard users can select nodes and edges with the inspector, use the coordinate editor to place points, and connect selected nodes using its dropdown. Coordinates are relative to the original uploaded image and the bounds are shown in the editor.

## Scanner limitations

The scanner thresholds image pixels, identifies a connected free-space region, thins it to a centerline, and extracts graph nodes and polyline edges in a Web Worker. It is a heuristic assisted scanner, not semantic AI recognition. Clean black-and-white drawings work best. Room fills, furniture, text, door arcs, shadows and colored renderings can cause missing or incorrect candidates. The longest scan dimension is 144 cells, so fine geometry can be lost. The obstacle mask is editable for this reason.

It cannot infer doorway permission, room function, clearance width, ramp slope, steps hidden in a drawing, elevator availability or real-world accessibility. Staff must check actual conditions. Wall checks validate the configured mask, not the real building. Nothing here certifies building accessibility or provides emergency navigation.

## Storage and privacy

Floor images and graphs are saved in IndexedDB in this browser on this origin. There is no upload server or cloud vision request, and no cross-device synchronization. Switching from localhost to a hosted URL, another port or another browser uses different storage. Clearing site data removes saved maps. The header shows save status; wait for it before closing. **Download backup** exports JSON for archival/developer recovery; this version does not have a backup-import screen.

## Research demonstration

- Show the Linden Hotel sample to compare stair and elevator/ramp routes.
- Create a second establishment and explain scan → correction → calibration → access review.
- Switch to the reviewed establishment's guest view and compare routes.
- Open Research view to inspect the current graph and measured computation time.
- Run reference scenarios. These are software tests against the fixed sample and synthetic graphs, not validation of uploaded floor geometry or participant-study results.

## Deploy on Vercel

The root `vercel.json` selects Vite, `npm run build:vercel` and output directory `dist/client`. The Vercel build type-checks and bundles the browser app without requiring local Sites metadata in the ignored `.openai` folder. The original `npm run build` still prepares the Sites package.

1. Push this project to a GitHub repository, including `package-lock.json`, `vercel.json`, `src`, `public`, the Vite/TypeScript config files and `index.html`. Keep the project structure intact; exclude `node_modules` and generated `dist`.
2. In Vercel choose **Add New → Project**, connect GitHub and import that repository.
3. Set Root Directory to the directory containing `package.json` (leave the default if the repository root is this project).
4. Verify framework **Vite**, build **npm run build:vercel**, output **dist/client**, then select **Deploy**. The current app needs no environment variables or database.
5. Test the generated HTTPS URL on desktop and phone. Upload a clean floor-plan image, scan/review/calibrate it, create a route and reload to check local saving. Reference-test success does not replace this check.

Alternative without GitHub: from the project root, run `npx vercel`, sign in and follow its project prompts for a preview deployment. Publish with `npx vercel --prod` when ready.

Uploaded maps stay in the browser that created them. The deployed domain has different storage from localhost, and Vercel preview domains also have separate storage. A shared visitor map requires bundled reviewed map data or a separate shared-storage/publishing feature.

## Development commands

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Vite normally serves http://localhost:5173/. Production check: `npm run build`; preview: `npm run preview`.

Validation commands: `npm test`, `npm run typecheck`, `npm run build`, `npm run test:sites`.

The Sites wrapper is preserved. Production output includes `dist/client/index.html`, `dist/server/index.js` and `dist/.openai/hosting.json`.

Main source: `src/Workspace.tsx` (establishments), `src/FloorPlanStudio.tsx` (editor), `src/scan.ts` and `src/scan.worker.ts` (scanning), `src/buildingEditor.ts` (calibration/review), `src/buildings.tsx` (data/storage), `src/routing.ts` (Dijkstra), `src/geometry.ts` (path validation).
