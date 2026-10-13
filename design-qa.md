# Design QA status

Original selected-reference review: blocked / incomplete. Scoped route-correction evidence is recorded below; it does not establish a full design pass.

## Source visual truth
`.impeccable/mocks/approved.png`, option 1 selected by the user. Source dimensions: 1487 × 1058.

## Implementation evidence
Original local Vite preview: http://localhost:4173. Initial accessibility inspection showed the guest form, default 24 m/38 m route comparison, directions, floor controls and map facility buttons. Initial browser error/warning logs were empty.

No valid saved same-viewport comparison against the approved reference exists. The original attempted viewport override did not produce a verified 1487 × 1058 capture; the next user turn interrupted testing. Subsequent browser reconnection was rejected by the browser tool's security policy with a URL-policy restriction. Browser access was restored for the scoped route correction below; the original comparison remains incomplete.

## Required fidelity surfaces
- Typography: Inria Serif headings and Geist body are implemented; rendered sizing and wrap require verification.
- Spacing/layout: 29/71 desktop split and stacked phone layout implemented; responsive verification incomplete.
- Colors: ivory/evergreen selected-reference tokens implemented; contrast measurement pending.
- Images: three new floor-plan backgrounds generated from the approved reference, with interactive route overlays. Automatic Impeccable plate gate rejected ground artwork size and structural similarity; this is unresolved and has not been represented as a pass.
- Copy/content: selected concept's heading and controls preserved; calculated directions reflect actual graph paths. Browser flow verification incomplete.

## Outstanding checks
- P1: complete a comprehensive browser overlay review of all facilities on every floor. Suite 201/202 corrections and automated geometry coverage are recorded below.
- P2: capture same-state desktop and phone screenshots and compare with the selected reference.
- P2: test keyboard endpoint search, floor changes, zoom, unavailable routes, identical endpoints and Research view in the browser.
- P2: verify reduced motion, focus visibility and text contrast.
- Complete independent finish review after valid screenshots exist.

Full-view and focused-region comparisons against the selected reference still lack valid matching captures. No overall visual pass is claimed.

## Scoped route correction — October 13, 2026

The reported Suite 201/202 wall crossings were corrected without changing the Concierge Desk design direction. The upper-floor west shortcut was removed. Floor-specific entrance waypoints now enter facilities through their mapped doorways, and guest rooms remain terminal graph nodes. Rendering and validation share the same route centerline geometry; conservative walkable envelopes check complete segments for wall crossings rather than checking only graph connectivity or sampled points. Label positions are separate from routing endpoints.

Validation passed: 20 routing tests, 4 Sites worker tests (`npm run test:sites`), `npm run typecheck` and `npm run build`. The routing tests cover former wall-crossing paths, thin walls, both suite doorways in both modes and directions, terminal guest rooms, and Dijkstra results against an independent Floyd–Warshall oracle. These checks validate the manually traced demonstration geometry; they do not certify a surveyed building.

Browser route evidence was captured from http://localhost:5173:

- `.impeccable/reviews/route-fix/suite-201-desktop.png`: Reception → Suite 201, second-floor accessible route around the east corridor and through the suite's east doorway; comparison shows 70 m shortest and 94 m accessible.
- `.impeccable/reviews/route-fix/suite-202-desktop.png`: Reception → Suite 202, second-floor accessible route through its north doorway; comparison shows 63 m shortest and 87 m accessible.
- `.impeccable/reviews/route-fix/suite-202-phone.png`: stacked phone layout with the Suite 202 route. The observed viewport was 433 × 937 CSS pixels despite a requested 390 × 844; no horizontal overflow was observed. This is not evidence of testing at exactly 390 × 844.

Independent finish review approved shipping the scoped Suite 201/202 wall-crossing fix: both desktop routes enter the actual doorways without passing through other guest rooms, and the phone evidence is valid at the observed width. The original artwork plate-gate rejection, reference fidelity, broader keyboard/interaction checks, reduced motion, focus and contrast remain unresolved or unverified as listed above. No visual tokens or design-system files were changed by this correction.

## Scoped skeuomorphic refinement — October 13, 2026

The user approved extending Concierge Desk with more appealing icons, visual details and skeuomorphism. `AGENTS.md` and `PRODUCT.md` record this durable direction. Warm paper, restrained brass, inset fields and beveled controls now supersede the original mock's flat material treatment; the original layout, hotel palette, serif hierarchy and routing behavior remain the basis. The original artwork gate history above is preserved and is not retroactively a pass.

The material layer is `src/concierge.css`, loaded after the existing base styles. Shared `FacilityIcon` usage spans endpoint fields, map labels and the actionable Explore this floor directory. Route cards emphasize computed distances, and the directions area has a distinct paper-sheet hierarchy. `DESIGN.md` now records extracted current tokens; `.impeccable/design.json` carries their shadow, motion, breakpoint and component-preview extensions. No routing geometry was changed by this refinement.

Validation passed for this refinement: `npm run typecheck`, `npm run build`, and all 20 routing tests. Browser verification confirmed keyboard destination search and Enter selection for Suite 202; Find route produced 63 m shortest and 87 m accessible; the second-floor route remained aligned through its mapped doorway; phone Zoom in enabled Zoom out; the Suite 201 shortcut updated the destination and cleared the previous route; and Research Run tests passed all 13 runtime scenarios. The earlier 4 Sites worker tests belong to the route-correction validation above and are not represented as a new run for this refinement.

Saved browser evidence:

- `.impeccable/reviews/skeuomorphic/desktop.png`: warm desktop Concierge Desk layout and material controls.
- `.impeccable/reviews/skeuomorphic/suite-desktop.png`: Suite 202 route and desktop map hierarchy.
- `.impeccable/reviews/skeuomorphic/mobile.png`: stacked phone layout. The image is 469 pixels wide; a 390px CSS width was requested but the actual CSS viewport was not independently verified. This is not evidence of exactly 390px testing.
- `.impeccable/reviews/skeuomorphic/research-mobile.png`: phone Research surface and runtime-result evidence.

Independent finish review approved shipping this scoped visual refinement with no material fixes. It found coherent warm materials and controls, preserved desktop map hierarchy and doorway alignment, and coherent phone stacking. The detector reported only three retained-Geist font warnings; retaining the established body font is intentional.

This review does not clear every historical QA item. A comprehensive all-facility visual overlay review, unavailable/identical endpoint browser states, complete focus and text-contrast verification, and the original artwork plate-gate rejection remain unresolved or unverified. Reduced-motion CSS is preserved in source but was not newly emulated. The listed keyboard, floor-route, zoom, shortcut and Research checks update only those portions of the earlier outstanding list. An exact reproduction of the original flat treatment is no longer the current target; remaining selected-reference comparison must account for the user's approved material evolution.
