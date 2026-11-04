# Live AI scan test — October 19, 2026

## Result

The live Gemini integration now responds successfully, but the returned sample graph is **not ready for guest routing**. All seven proposed connections were blocked by the current obstacle/room-shortcut checks. Staff correction and review remain necessary.

| Check | Actual result |
| --- | --- |
| Fixture | Fictional Linden Hotel ground floor, public/assets/floor-0.png, 1438 × 1093 PNG |
| Endpoint | Local Vite POST /api/scan-floor-plan with configured staff code and explicit sample-image consent |
| Provider model | gemini-3.5-flash-lite |
| Live endpoint response after fixes | HTTP 200, 4,371 ms |
| Proposed graph | 8 locations, 7 connections |
| Destination labels | Entrance, Reception, Lounge, Stairs, Elevator, Dining |
| Application draft conversion | Passed |
| Blocked connections | 7 of 7 |
| Reviewed connections | 0 |
| Accessible connections | 0 |
| Routing before review | All 112 ordered, distinct-endpoint/mode checks produced no found route |
| Automated suite | 52 tests passed |
| Production build | TypeScript and Vercel build passed |

## Issues found and corrected

1. `.env.local` contained the display name `Gemini-3.5 Flash-Lite`, rejected by the server's model identifier check. Corrected only that value to `gemini-3.5-flash-lite`. Google's model-list endpoint confirmed availability for the configured key. No key or staff code was printed or changed.
2. The configured model returned HTTP 400 INVALID_ARGUMENT with the bounded nested output schema. Removing thinking settings or switching to responseSchema independently did not resolve it; a minimal text request succeeded. Removing nested numeric and array bounds from the provider schema succeeded with the same image, model and prompt. The app retains graph-size limits, coordinate validation, path-length limits, obstacle checks and mandatory review in its service/draft validation. Added regression coverage for compact schema requests and rejection of oversized returned graphs.

The local endpoint was then retested successfully with the implemented fix. No fallback model was selected, no automatic provider retries were added, and no browser-saved map was replaced.

## Limits of this evidence

This was one real floor-plan API test, not a scan accuracy benchmark or a usability study. The request sent the PNG directly; it did not exercise the browser's JPEG preparation, upload dialog or rendering. The obstacle mask used the application's default 155 threshold, zero padding and 144-cell longest dimension. The raster was decoded locally and processed with the same darkest-pixel calculation as floorRaster. All-blocked output can reflect proposed geometry and conservative obstacle detection on the furnished illustration; this run does not distinguish those causes or justify relaxing safety checks.

The 4.4-second duration measures the whole API request, not Dijkstra execution or expected walking time. A successful API response does not establish correct doorways, accessibility or usable routes. Browser interaction verification remains outstanding.

Model reference: [Google's Gemini 3.5 Flash-Lite documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite).
