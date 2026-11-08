# Prototype Instructions

User selected option 1 (Concierge Desk): formal ivory/evergreen hotel interface, serif headings, left route controls and large right map. Build actual Dijkstra routing and a separate research view. Use fictional three-floor Linden Hotel, English, meters. Preserve this direction; no new concept round.

User subsequently requested a more appealing UI with icons, visual details, and skeuomorphism. Extend Concierge Desk with warm paper surfaces, restrained brass accents, beveled/tactile controls, and clear facility icons. This preference supersedes the original mock's flat surface treatment while retaining its layout, palette, readability, and routing behavior.

Routes must follow the visible floor plan and enter facilities through mapped doorways. Never reuse room-entry geometry between floors without inspecting each floor image. Guest rooms are destinations, not shortcuts between corridors. Geometry regression checks must cover wall crossings as well as graph shortest-path correctness.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.


## General establishment maps (latest scope)
The user expanded the product beyond hotels and selected assisted scan: browser detection of candidate nodes and connections, followed by staff correction, destination labels, scale calibration and confirmed accessibility. Preserve Linden Hotel as a clearly labeled sample. Custom establishments and floor plans are local browser data. No logo work for now.

Do not claim that a floor-plan image determines real accessibility, room permissions or correct doorways automatically. Unreviewed links must be excluded from routing. Uploaded floors need calibration and explicit review before guest use. Reuse the paper/evergreen/brass visual system for the map studio; no new concept round.

The user plans to deploy on Vercel. Keep vercel.json configured for Vite, npm run build:vercel, and dist/client. Preserve the separate Sites build and wrapper files. Vercel builds must not depend on ignored local .openai files. Hosting does not synchronize browser-local maps.


The user requested automatic AI scanning and selected a free-tier cloud API for the Vercel prototype. Gemini scanning is optional and server-side; keep GEMINI_API_KEY out of client bundles. Require explicit image-sharing consent and the separate staff scan code. AI-generated locations/edges remain unreviewed; never trust model accessibility or distance claims, and block obstacle crossings and room shortcuts. Preserve the no-key local scan fallback. Free-tier eligibility/quotas are provider/account-dependent; never promise unlimited free service or silently fall back to paid models.

The user rejected the AI-generated straight-line connections through walls (office-floor screenshot). Trace draft connections against detected open space, preserve doorway anchors and obstacle corrections, and report unresolved connections separately. Do not make a rejected graph look usable by merely changing line styling or relaxing wall checks. Keep all repaired connections unreviewed.

The user finds new-establishment creation confusing and authorized a guided setup revision with MotionDesign, Impeccable and Product Design. Present one stage at a time: place/floors, path detection, map correction and scale, then access review. Keep advanced graph/obstacle controls collapsed initially; keep errors and required review visible. Preserve the existing visual system, local draft saving, cloud consent and activation safeguards. Do not return to an all-controls-at-once setup screen.

The user reiterated that proper routing must not cross walls and supplied office-building.png for verification. Navigate to visible room entrances on the corridor side, not guessed room-label centers. Check geometry independently of AI output; do not accept paths on wall boundaries, missing floor masks, or unreviewed uploaded edges. Manual connections should trace around obstacles as well. Keep recorded AI failures separate from tests using manually measured entrance positions; never present the latter as automatic scan accuracy.

The user reported a route line that overshot a doorway and doubled back along the corridor (Reception → Main entrance). Every doorway or stair landing needs its own corridor junction directly outside it; never attach a door spur to a farther corridor node with a `via` point that retraces the corridor. Keep the "drawn routes never double back" regression test passing for every facility pair in both modes.

The user replaced the Linden Hotel sample with a realistic 3-storey Civic Center (`src/civicPlan.ts`, `src/hotel.ts`) drawn in code from exact metric geometry (40.0 m × 22.0 m building on a 60 m × 50 m sheet at 20 px/m): 1st floor with outdoor emergency/government parking lot (fire trucks, rescue vehicles, PWD bays), exterior & interior steps paired with 1:12 accessible ramps, main entrance, info & lounge desk, and glass-walled souvenir shop; 2nd floor with public library, two large rectangular offices, and restroom; 3rd floor with four function halls and a stacked restroom at the exact same north-band coordinates. Printed meter dimension lines must equal the routing graph edge weights.
