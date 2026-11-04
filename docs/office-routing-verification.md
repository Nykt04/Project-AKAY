# Office routing verification — 19 October 2026

The user supplied `C:/Users/Gian Karlo/Downloads/office-building.png` (650 × 774) and explicitly consented to sending it to the configured Gemini API for this test.

## Changes

- Gemini is instructed to identify the corridor backbone and visible doorway approaches. Enclosed-room destinations are named as entrances and must be leaves. A room without a visible door must not receive an invented connection.
- Normal diagram uploads now use PNG for AI requests when they fit the payload limit, preserving thin lines. JPEG is used only if needed to fit that limit. The obstacle mask is always derived separately from the original local image.
- Wall checks include every touched grid cell: boundary-aligned segments, corner endpoints and both directions. Invalid mask dimensions and non-finite coordinates fail closed.
- Mapped routes require floor masks, valid elevator/stair landing positions and explicit review of uploaded connections. Private rooms cannot be intermediate graph nodes.
- Draw connection now traces a polyline through detected open space using A*. The existing Dijkstra algorithm chooses among reviewed graph connections. The traced polyline is also the displayed geometry and distance source.
- AI notes are explicitly labeled unverified. No model-generated permission or accessibility claim is adopted.

## Actual cloud result

The first authorized request through `createScanService` used the configured `gemini-3.5-flash-lite` model at the existing LOW thinking setting and the original PNG. It returned HTTP 200 in 4,568 ms: 17 nodes and 16 edges. This was a service/API test, not a browser interaction test.

The wall validator accepted **4 candidate connections and blocked 12**. Seven node positions touched detected obstacles. The model also claimed that the storage room was included as an isolated destination, although it did not include that node. Its narrative is not treated as ground truth.

All 16 connections remained unreviewed and inaccessible. A regression test checks all 544 distinct ordered node-pair/mode combinations and confirms none becomes a guest route before review. The recorded model response is in `tests/fixtures/office-gemini-response.json`. These results do **not** establish that automatic scanning is ready for unattended use; this model still needs entrance-position corrections on this drawing.

A second controlled request used the same model with HIGH thinking. It returned HTTP 200 in 16,344 ms: 21 nodes, 19 connections, 7 traceable and 12 blocked. It still placed several destinations in the wrong locations or on obstacles. This does not establish consistent improvement: it is only one sample at each setting. The production thinking setting remains LOW; no model switch or automatic retry was added. The second diagnostic response is saved locally in `.artifacts/office-ai-high-result.json`.

## Independent geometry checks

Eleven corridor-side entrance/landing approaches were measured manually from the original drawing. They are separate test inputs, not improved AI predictions. The pathfinder reached all 11 from the south corridor. An independent set of measured wall rectangles and the image-derived mask both check the resulting segments.

A stair-approach → manager-entrance test rejects the direct diagonal and traces around the storage/reception walls through the main corridor. The storage-room test uses an empty interior point, confirms it is not on printed text, and finds no path through the closed room boundary. No doorway or mask cell was opened to make these tests pass.

The compressed mask fixture is `tests/fixtures/office-clearance.json`: conservative darkest-pixel downsampling to 322 × 384, threshold 155, no padding or manual edits. The test implementation is `tests/office-routing.test.ts`. The illustration in `outputs/office-route-proof.png` shows the manually positioned endpoint test, not an automatic AI result.

## Verification and remaining limits

- `npm test`: 69 tests passed, including the office image regressions.
- `npm run build:vercel`: TypeScript and production build passed.
- `npm run build` and `npm run test:sites`: Sites packaging and all 4 worker tests passed.
- Browser interaction verification remains blocked by the previously reported browser-tool access policy. Existing saved browser maps were not modified.

The occupancy mask is an image interpretation, not a surveyed building. Door swing symbols, printed labels and furniture can be obstacles in that interpretation. Calibration, actual entrance checks and accessibility review remain required. Floor-level room permissions and physical mobility clearances cannot be inferred reliably from this image alone.
