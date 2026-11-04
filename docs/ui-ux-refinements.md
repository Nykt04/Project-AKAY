# UI and UX refinements — October 19, 2026

This pass preserves the Concierge Desk palette, tactile surfaces, floor-plan geometry and routing rules.

- Guest navigation: staff actions are grouped under Map tools; phones show route choices before the map. Successful routes have direct links to the map and text directions. Floor views outside the selected route offer a return-to-route button.
- Location search: separate search clearing and endpoint clearing, counts and no-match guidance, Arrow/Enter/Escape handling, active-option scrolling, close on focus leaving, visible invalid fields, and safe rendering of removed selections.
- Touch and reading: larger floor/zoom/editor controls, phone search text at 16 px, and legible setup guidance. Existing reduced-motion rules remain active.
- Map studio: linked setup steps report actual floor, connection, destination and calibration counts. The next incomplete step is explained. Wall-detection settings are collapsible and disabled scanning has an actionable reason. Completing these steps only leads to final validation; it does not bypass geometry, calibration or accessibility review.

## Verification

All 51 automated tests passed, including routing/geometry, local scanning, AI safeguards and server-rendered UI checks. Added checks cover stale endpoint selections, route shortcut targets, absent directions for inaccessible routes, unreviewed setup progress, and an empty establishment. TypeScript, the Vercel production build, the Sites build and all 4 Sites packaging/worker tests passed. These are technical checks, not evidence from a participant usability study.

The design detector found palette/type advisories. New styles now reuse existing tokens; the 16 px mobile input size and error color are explicitly documented in DESIGN.md. No new decorative palette was introduced.

Fresh browser access was rejected by the browser tool's security policy during this turn. No alternate access method was used. Current desktop/phone rendering, live keyboard and pointer interactions, and reduced-motion emulation still need a browser confirmation. Earlier screenshots are baseline evidence only, not proof of these changes.
