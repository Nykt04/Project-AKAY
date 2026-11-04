# Indoor wayfinding research testing guide

Prepared 17 October 2026. This package contains 44 technical cases, 10 participant tasks, and blank observation logs. No participant or live AI accuracy results have been collected in this workbook.

## What to evaluate

| Research question | Evidence to collect |
|---|---|
| Can intended guests find and understand a route suitable for their mobility needs? | U01–U05; unassisted completion, errors, time, help, ease ratings and observations. |
| Can staff prepare an accurate, reviewed establishment map? | U06–U10; calibration, corrections, review, completion and preparation time. |
| Does routing minimize distance while respecting restrictions? | R01–R13; independent expected distances, allowed-edge checks and unreachable cases. |
| Do displayed routes follow doors and corridors? | G01–G03; independent floor-plan overlays, including Suites 201 and 202. |
| How accurate and useful is automatic scanning? | AI01–AI08 plus Scan log; precision, recall, unsafe links, failures and correction time. |
| Is the interface accessible and reliable? | A01–A05 and REL01–REL04; keyboard, assistive technology, layout, storage and deployment. |
| How quickly does routing respond? | PERF01 and Benchmarks; graph size, algorithm latency and UI response latency. |

## Run the evaluation

1. Read the workbook Guide and agree the protocol, sample, targets and privacy arrangements with your research adviser. The proposed pilot size and targets are planning suggestions, not standards or a statistical power calculation.
2. Freeze the build and reference datasets. Confirm a valid Gemini API model ID and endpoint configuration before live AI tasks. Never place secrets in the workbook. Keep cloud failures visible as outcomes.
3. Execute the critical technical cases first. A case passes only when its observed result satisfies its full expected result. Record actual observations and evidence in Test cases. Use Blocked when a prerequisite prevents execution.
4. Recruit representative guests, including people with mobility limitations, and map-maintenance staff. Obtain voluntary participation and optional recording consent. Use anonymous participant codes and participants' usual assistive tools.
5. Read participant scenarios without revealing the completion criterion. Start timing at readiness; stop at verified completion, abandonment or the limit. Record one Sessions row for each participant/task/attempt. Record assistance explicitly.
6. Ask after each task: **How easy or difficult was this task?** Use 1 (very difficult) to 7 (very easy). This is a researcher-designed rating, not SUS or a validated composite instrument.
7. Score scans against independently annotated authorized plans. Keep raw-model and staff-reviewed performance separate. Complete Scan log and Benchmarks with measured values.
8. Summarize results by task, role and device. Show counts and denominators, failures and qualitative observations. Fix defects, then run a clearly identified follow-up round.

## Workbook use

- **Test cases:** 44 cases with setup, procedure, expected result, priority, status and evidence fields. All start Not run.
- **Usability tasks:** 10 facilitator task cards and formula-based first-attempt summaries. Only rows with Attempt number = 1 contribute. Record one first attempt per participant/task, and number repeats 2, 3, etc. Report repeated-attempt learning separately.
- **Sessions:** 200 blank observation rows. Skipped tasks are excluded from attempts. Blank means not recorded; zero means observed zero. Enter elapsed time for every attempted task, including failures. Mean time shown on the task sheet includes only unassisted completions.
- **Scan log:** 60 blank records with live precision/recall formulas. Record one plan/run/object type/stage per row. Repeat run-level latency only if needed for traceability; do not sum duplicated run times across object types.
- **Benchmarks:** 180 blank run records. For each condition use one warm-up and 30 recorded runs. Do not mix graph sizes, route modes or devices in a single latency summary.
- **Guide:** scoring definitions, proposed thresholds, annotation rules, limitations and sources.

Amber cells are editable observation fields. Formulas summarize only the provided bounded rows. If more rows are needed, extend the tables, formulas, validation and summary ranges before collecting additional data. Preserve an untouched copy of observations before analysis.

## Calculations and interpretation

- Unassisted completion rate = unassisted completions / attempted tasks. Assisted, failed and abandoned attempts remain in the denominator. Report both count and percentage per task.
- Mean successful time in the workbook = sum of elapsed times for unassisted completions / number with recorded times. Missing times must be investigated. For the report, also calculate median time and report failure times separately.
- Precision = TP / (TP + FP); recall = TP / (TP + FN). Use one-to-one matching. Duplicate predictions count as false positives. Do not call these formulas overall scan accuracy.
- An undefined denominator remains blank. Provider failures are a separate failure rate, not omitted runs. For aggregate precision/recall, sum compatible TP/FP/FN counts before dividing. Report by object type, plan class and stage; repeat scans of one plan are not independent buildings.
- Algorithm latency measures the routing computation. UI latency measures click to displayed directions. Neither measures actual walking time. Report median and p95 by condition, with the method and sample count. For nearest-rank p95 of 30 observations, sort and take observation 29.
- Suggested pilot targets: >=90% unassisted guest-task completion and median ease >=5/7, with no known inaccessible route accepted as accessible. These are proposed project criteria; freeze them before main-study data collection.
- Critical route and privacy conditions require zero observed violations in the tested cases. Passing a finite set of cases does not establish that every real-world plan is safe.

## Additional interview questions

1. What was confusing when selecting a route?
2. How did you decide whether the route met your mobility needs?
3. Which directions or map details were missing?
4. What would you do if no accessible route was available?
5. For staff: which scanning errors took the most effort to correct?
6. What single change would make the app easier to use?

Record responses as qualitative findings. Do not combine them into an invented validated scale. If your adviser requires SUS or another standardized instrument, adopt the official instrument and its exact scoring separately.

## Scan benchmark preparation

Use diverse, authorized plans: clean black-and-white, furnished, low contrast, rotated, and complex corridor layouts. Two reviewers annotate doors, destinations and valid corridor segments before seeing predictions. Resolve disagreements and freeze the reference. Specify coordinate tolerance and rules for splitting/joining links before scoring. The workbook proposes 1% of image diagonal as an endpoint tolerance; adjust it to plan resolution before evaluation.

For each scan save plan ID/hash, raw output, model ID/config, run date, graph and annotation version. Match predicted links to the independently marked corridor segments, collapsing harmless degree-2 subdivisions. A link must remain fully in the verified walkable area to count as a match. Count wall crossings, restricted-area links and room shortcuts separately. Evaluate raw candidates and staff-reviewed routable links separately. If quota allows, run three AI trials per plan; record all failures and avoid silently changing models.

Actual accessibility attributes such as doorway width, ramp slope, permissions and elevator availability must be checked against establishment information. They cannot be established by the image alone. Initial testing should use the digital prototype and verified fixtures; an actual building walkthrough requires a separately agreed, supervised study with verified routes.

## Report template

> We evaluated build [commit/version] with [guest count] guests and [staff count] staff using [devices/input methods] and [plan count] plans. For task U01, [x/y] first-attempt participants completed the task without assistance. Median completion time among successful participants was [seconds], and median task-ease rating was [value]/7. We observed [count] critical route errors in [number] tested routes. Raw scan corridor-link precision and recall were [values], with [count] provider failures in [attempts] attempts. After staff review, [count] unsafe routable links remained in the evaluated plans. Results apply to this sample, build and test conditions.

Do not replace these fields with estimates. Keep software regression-test outcomes separate from participant results. The Research view's built-in reference tests do not validate an uploaded building.

## Sources

- [NIST: Usability Testing](https://www.nist.gov/programs-projects/usability-testing) supports evaluating representative users and tasks through effectiveness, efficiency and satisfaction.
- [W3C WAI: Involving Users in Evaluating Web Accessibility](https://www.w3.org/WAI/test-evaluate/involving-users/) supports combining user evaluation with standards checks and limiting conclusions to the studied population and context.
- [W3C: WCAG 2.2](https://www.w3.org/TR/WCAG22/) informs selected interface checks. The workbook is not a complete conformance checklist.
- Project reference fixtures: src/scenarios.ts, tests/routing.test.ts, tests/scan.test.ts, tests/building-ui.test.ts, tests/aiGraph.test.ts and tests/ai-scan-api.test.mjs. Expected distances are fixed sample values, not surveyed beneficiary measurements.

Web sources accessed 17 October 2026. New independent geometry annotations and participant observations are still required.

## Software baseline recorded during preparation

On 17 October 2026, npm test completed with **45 passed, 0 failed, 0 skipped** on commit 5ec6fdc. The suite includes routing, geometry, local scanning, UI server-render checks, AI graph validation and mocked AI API responses. This is a software regression baseline only. It does not represent participant usability sessions, a full browser accessibility audit or live Gemini scan accuracy. Workbook cases remain Not run because they require their own complete procedure and evidence.
