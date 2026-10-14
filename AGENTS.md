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
