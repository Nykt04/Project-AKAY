# Performance measurements

Measured locally on 19 October 2026 with Node v20.20.0. The deterministic benchmark uses five warm-ups and 30 recorded runs per operation. The before implementation was captured before editing; the same workloads were run sequentially before and after. These are local software measurements, not participant findings, mobile timings or live AI accuracy results.

| Operation | Before median | After median | Before p95 | After p95 |
|---|---:|---:|---:|---:|
| Accessible route, 500 nodes / 1,469 edges | 42.420 ms | 2.342 ms | 57.885 ms | 5.494 ms |
| Local scan, 144 × 120 L-shaped corridor | 23.701 ms | 21.299 ms | 110.193 ms | 60.906 ms |

The route fixture has no floor-plan geometry, isolating graph traversal and structural validation. Real uploaded plans also incur obstacle-mask validation. Local scan figures exclude image decoding, resizing and worker communication. CPU load and garbage collection affect timings; scanning improvements are modest and should be checked with representative plans. Reproduce the current workload with `npm run benchmark`.

## Loading changes

Vite production build measurements, in decimal kB:

| Initial asset | Before | After |
|---|---:|---:|
| JavaScript | 427.50 kB | 390.83 kB |
| JavaScript, gzip | 134.98 kB | 125.30 kB |
| CSS | 69.57 kB | 40.71 kB |
| CSS, gzip | 28.71 kB | 9.51 kB |

The staff floor-plan editor now loads separately when opened (about 39 kB before compression). The English interface uses Latin font subsets; other scripts use the existing system-font fallback. Asset sizes measure transfer payloads, not Core Web Vitals or a percentage improvement in perceived page load.

## Implementation and safety

- Dijkstra uses a binary min-heap with the existing distance/ID tie order. Outdated queue entries are ignored. Route reconstruction appends then reverses the path.
- Every route still validates graph coordinates, distances and walkable geometry. No graph-validation cache can outlive an edit.
- The scanner reuses neighbour checks only after its skeleton is fixed and only within that scan. Thinning reuses a small buffer instead of allocating an array for every pixel.
- React reuses building indexes, route descriptions and directions across unrelated renders.
- Find route no longer waits an artificial 100 ms. The action computes the current selections directly, avoiding delayed results for older selections.
- No cloud API retries, provider changes, accessibility shortcuts or review bypasses were introduced.

Regression coverage includes shorter queued paths, zero-cost cycles, changed permissions/geometry and changed scan masks, alongside the existing independent routing oracle and doorway checks. See the task report for executed verification. Test on representative phones and surveyed plans before making real-world performance claims.

## Verification performed

- `npm test`: 48 passed, 0 failed.
- `npm run build:vercel`: TypeScript checks and production build passed.
- `npm run build` and `npm run test:sites`: Sites package generated, all 4 wrapper tests passed.
- Browser: swapped endpoints, calculated the 38 m accessible return route, ran all 13 reference scenarios successfully, and opened an existing draft to verify deferred editor loading without changing saved map data.
- At a 390 × 844 viewport: checked the guest layout, keyboard route submission and floor switching. Restored the default viewport afterward. Browser error log was empty.
- Impeccable mechanical scan reported no findings for the changed frontend files.

This was not a full accessibility conformance audit, a physical-phone performance test or a live Gemini request. The cloud scanning provider and credentials were not changed.
