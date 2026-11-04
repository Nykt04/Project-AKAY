# AI draft path correction — October 19, 2026

The office-floor screenshot showed a graph of straight, rejected connections between room labels and corridor nodes. Rejecting these connections protected routing, but did not produce useful draft geometry. This change repairs candidate geometry before review instead of treating an AI line as a walkable route.

## Behavior

- AI labels and proposed topology remain untrusted. Each connection is traced in the unchanged obstacle mask using four-neighbor A*. The guest route algorithm remains Dijkstra on the reviewed, calibrated graph.
- Existing doorway/turn anchors are preserved. Endpoints on obstacles are not snapped to another room or through a wall. Disconnected paths, excessive detours and closed doorway anchors remain blocked.
- Path simplification only removes bends when the entire replacement segment passes the obstacle check. Distances are recalculated from the resulting polyline and converted to meters by the existing scale calibration.
- Named room/facility destinations cannot become intermediate graph nodes. Paths through another labeled destination cell are rejected. This does not infer complete room boundaries or public access permissions; staff review remains required.
- New AI scans use a 384-cell longest-dimension mask to preserve more doorway detail. The local skeleton scanner retains its existing 144-cell setting. No wall erosion or automatic doorway opening was added.
- Existing scans have a **Trace draft paths around walls** action. It works on unreviewed connections using their saved mask, preserving obstacle corrections and reviewed connections, with no cloud request. Undo remains available. Previously reviewed/blocked connections are not silently reopened.
- Rejected edges remain inspectable, with a visible count and a toggle to show their lines. Selecting one also reveals it. They are hidden by default to distinguish unusable proposals from candidate paths. Misplaced location names are listed for correction.
- A new AI response with zero traceable connections is rejected before replacing the current draft. All repaired candidates remain unreviewed and inaccessible until staff confirms them.

## Verification

57 automated tests passed, including added tests for a route bending through the only doorway in a separating wall, unchanged obstacle cells, blocked endpoints and anchors, diagonal corner rejection, room/facility terminal rules including partly reviewed topology, distance totals, and visible explanation/inspection of rejected edges. TypeScript and the Vercel production build passed.

Reprocessed the saved live Gemini ground-floor sample at the new AI mask resolution, without another cloud request: 3 of 7 connections could be traced around obstacles; 4 remain blocked. All 7 stayed unreviewed and all 112 distinct endpoint/mode combinations remained unroutable before review. This is an improvement on that sample's previous 0 traceable connections, not evidence that the user's office map is fixed or that automatic interpretation is reliable.

The supplied office screenshot contains rendered labels and rejected graph lines, not the original clean floor-plan upload and saved graph. Its precise saved geometry could not be replayed from that screenshot. Live browser verification remains unavailable because of the earlier browser-tool policy rejection. Existing browser-local maps are not automatically overwritten; the repair action applies the change to an existing draft.
