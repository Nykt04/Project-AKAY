import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const root = process.cwd();
const out = path.join(root, 'outputs', 'research-tests-20261017');
const support = path.join(root, '.artifacts', 'research-tests-20261017');
await fs.mkdir(out, {recursive:true});
const cases = [];
const add=(id,area,priority,setup,steps,expected,method='Manual')=>cases.push([id,area,priority,setup,steps,expected,method,'Not run','','']);
add('R01','Routing','Critical','Linden sample. Reception and restaurant.','Find the shortest route. Inspect its ordered connections.','24 m. Includes the reception steps. Edge distances sum to 24 m.','Reference scenario + UI');
add('R02','Routing','Critical','Same endpoints as R01.','Find the accessible route and compare it with the shortest route.','38 m. Uses the ramp. No stairs or inaccessible connections.','Reference scenario + UI');
add('R03','Routing','High','Linden sample. Reception and lounge.','Find an accessible route on the ground floor.','19 m. Continuous corridor route. No floor transition.','Reference scenario + UI');
add('R04','Routing','Critical','Linden sample. Elevator at floors 0 and 2.','Route between elevator landings in accessible mode. View every floor.','16 m. Two elevator links. Directions and floor sections agree.','Reference scenario + UI');
add('R05','Routing','High','Linden sample. Stairs at floors 0 and 2.','Route between stair landings in shortest mode.','10 m. Two stair links. Stair usage is disclosed.','Reference scenario + UI');
add('R06','Routing','Critical','Linden sample. Reception to reading room.','Select accessible mode for this stairs-only destination.','No accessible route. No stair route is substituted or shown as accessible.','Reference scenario + UI');
add('R07','Routing','Critical','Linden sample. Reception to private function room.','Request each route mode to the disconnected destination.','Unreachable in both modes. No fabricated route or distance.','Reference scenario + UI');
add('R08','Routing','High','Linden sample. Reception as both endpoints.','Find a route in both modes.','Already at destination. 0 m, one node, no connections.','Reference scenario + UI');
add('R09','Validation','High','One or both endpoints absent or no longer valid.','Submit a route with a missing endpoint. Repeat after removing a selected custom destination.','Clear validation or safe reset. No stale route and no crash.','API fixture + UI');
add('R10','Routing','High','Fixture: a-b=2, a-c=2, b-d=3, c-d=3. All edges allowed.','Route a to d repeatedly. Reverse endpoints and repeat.','Minimum is 5 m. Current forward tie rule selects a,b,d consistently. Reverse route is also 5 m.','Reference fixture');
add('R11','Routing','High','Fixture: a-b=0, allowed. Separate fixture a-b=-1.','Route a to b in each fixture.','Zero-weight edge is valid with 0 m. Negative weight yields invalid graph.','Reference fixture');
add('R12','Routing','Critical','Fixture with a single a-b connection.','Set traversable=false. Repeat with reviewed=false. Finally set accessible=false and test both modes.','Closed/unreviewed links excluded from both modes. Reviewed inaccessible link excluded from accessible mode.','Controlled fixture');
add('R13','Routing','Critical','All successful route fixtures.','Independently sum returned edge weights. Check endpoint continuity and accessible flags.','Node count = edge count + 1. Edges connect ordered nodes. Sum equals total within 0.001 m. Accessible edges are permitted.','Independent calculation');
add('G01','Floor geometry','Critical','Second-floor image with independently marked Suite 201 and 202 doors.','Route each suite to the elevator, then route between suites. Inspect every segment against the image.','Each room is entered/exited only through its own doorway. No wall or adjacent room crossing. Retain screenshots.','Independent visual overlay');
add('G02','Floor geometry','Critical','All three sample images. Route pairs covering each corridor and facility door.','Inspect segments floor by floor, at map zoom and phone width.','Paths remain inside walkable areas and mapped doors. No geometry copied incorrectly between floors.','Independent visual overlay');
add('G03','Room permissions','Critical','Custom fixture: corridor A, guest room B, corridor C.','Try to enable traversable links A-B and B-C and activate guest routing.','Activation blocks a guest room used as a shortcut. A room with one entry can remain a destination.','Manual fixture');
add('M01','Map setup','High','Fresh custom establishment. Valid PNG, JPG and WebP plans.','Upload each supported format in separate trials. Add floor names.','Correct image orientation/aspect ratio. Map coordinates align with image at different zoom levels.');
add('M02','Map setup','High','Oversized >12 MB image, >40 MP image, PDF and corrupt image.','Try each upload separately. Record which validation rejects it.','Unsupported, oversized or undecodable file receives a clear error. Existing draft remains usable.');
add('M03','Local scanning','High','Known clean plan, then blank and solid-dark images.','Run local scan. For the clean plan try a valid corridor seed.','Clean plan produces editable candidates. Empty images fail clearly. All generated links remain unreviewed.');
add('M04','Calibration','Critical','Custom plan with independently measured 10 m reference segment.','Set two calibration points and 10 m. Test missing, zero and negative length in separate attempts.','Valid scale converts image distances to meters. Invalid/missing scale blocks activation. Independently check one edge distance.');
add('M05','Editing','Critical','Plan with an intentional closed-wall candidate link.','Add/move nodes and try connecting through the wall. Correct doorway mask only at a verified doorway and retry.','Wall crossing is rejected/blocked. Corrected doorway permits only the intended connection. Edits remain reviewable.');
add('M06','Review gates','Critical','Custom map with 2 named destinations and unreviewed links.','Try guest activation before calibration/review. Complete prerequisites and review only verified connections.','Premature activation is blocked with actionable errors. Complete valid map can be used. No unreviewed link becomes routable.');
add('M07','Review invalidation','Critical','Reviewed custom connection.','Move an endpoint or change its category. Switch floors and undo. Separately change only a label.','Geometry/category changes invalidate affected review. Floor review confirmation resets when required. Label-only edits preserve geometry review.');
add('M08','Multiple floors','Critical','Two calibrated floors with elevator and stair landing nodes.','Connect matching landings. Try ordinary cross-floor connection and mismatched landing categories.','Valid explicit transitions route correctly. Invalid floor links are rejected. Accessible mode excludes stairs.');
add('M09','Rescan','High','Reviewed floor with nodes and a cross-floor link. Saved backup available.','Try rescan without replacement confirmation. Confirm replacement and scan again.','Replacement requires confirmation. Replaced draft is unreviewed. Old incident floor links are not silently retained.');
add('AI01','AI scanning','Critical','AI configured server-side. Valid image. Network inspector.','Leave image-sharing consent unchecked and attempt AI scan. Then use an incorrect staff code.','No provider call without consent or valid authorization. Clear error. No API key exposed.','UI + mocked API');
add('AI02','AI scanning','High','Valid model ID, server key, staff code and authorized image.','Consent and run one live scan. Record model ID, date, input hash, latency and raw candidate graph.','Returns editable candidates or an honest provider error. Generated links remain unreviewed. Record accuracy in Scan log.','Live integration');
add('AI03','AI scanning','Critical','Mock model labels an edge accessible/reviewed and supplies false distances.','Convert mock output into a draft. Inspect flags and calibrated distances.','Model permissions/distances are not trusted. Review is required; distances derive from geometry and scale.','Controlled AI fixture');
add('AI04','AI scanning','Critical','Mock output: edge across wall or through a guest room to another corridor.','Process output, then try guest activation without corrections.','Unsafe candidate cannot be used for routing. Required correction and review remain visible.','Controlled AI fixture');
add('AI05','AI scanning','High','Existing saved draft. Mock invalid JSON, duplicate IDs, dangling edges and out-of-bounds coordinates.','Run each response fixture separately.','Each malformed response fails explicitly. No partial invalid graph replaces the usable draft.','Mocked API + converter');
add('AI06','AI errors','High','Mock provider: quota exceeded, invalid key, unavailable model, timeout.','Run each response condition. Count provider calls and inspect messages.','Actionable sanitized error. No silent paid/model fallback or retry. Draft preserved.','Mocked API');
add('AI07','Privacy','Critical','Disposable development credentials only. Built client and network response.','Inspect bundled assets, browser storage, endpoint payloads and error messages for API-key exposure.','Gemini API key remains server-side. Never include real keys/staff codes in screenshots or research data.','Source/build inspection');
add('AI08','Fallback','High','Cloud AI unavailable. Valid local plan.','Select local scan and create/edit candidates without a cloud request.','Local scan works without Gemini key. No floor image is sent to provider in local mode.','Manual + network inspection');
add('A01','UI accessibility','Critical','Desktop guest page. Mouse set aside.','Use Tab/Shift+Tab, arrows, Enter and Escape through selectors, swap, route modes, floors and zoom.','All functions operable. Logical focus order, visible focus and no keyboard trap.','Keyboard audit');
add('A02','UI accessibility','Critical','Custom map studio. Keyboard only.','Select/edit node coordinates using inspector, connect nodes with selectors and review the map.','Essential editing has keyboard alternatives. Focus remains visible and follows errors logically.','Keyboard audit');
add('A03','UI accessibility','High','Screen reader and keyboard; successful and unavailable routes.','Read labels, select route, trigger validation, inspect ordered directions and status updates.','Controls have meaningful names. Status/errors understandable. Directions work independently of visual map.','Assistive technology audit');
add('A04','UI accessibility','High','Guest/staff flows at 200% zoom and 320 CSS px content width. Phone at 390 px.','Complete tasks, scroll and change map floors/zoom. Measure text and control contrast.','Controls/text remain readable and usable. Map may pan; surrounding text must reflow. Normal text >=4.5:1, large text/UI boundaries >=3:1 where WCAG applies.','Responsive + contrast audit');
add('A05','UI accessibility','High','Reduced motion enabled. Touchscreen or device emulation.','Run navigation/scan interactions. Inspect touch targets and focus obstruction.','Nonessential motion is suppressed. Targets satisfy WCAG 2.2 minimum size/spacing or documented exception. Focus is not entirely obscured.','Motion + target audit');
add('REL01','Persistence','High','Custom edited map saved to IndexedDB. Same browser and origin.','Wait for save, reload, reopen map. Compare nodes, links, labels, scale and image.','Saved map is restored accurately. Reload does not alter reviewed connectivity.');
add('REL02','Persistence','High','Disposable browser profile with simulated storage failure.','Edit and attempt save. Test navigation while saving. Export JSON backup.','Failure is visible. User is warned before losing unsaved work. Backup contains current map. Do not claim restore UI exists.','Fault injection');
add('REL03','Compatibility','High','Current browser versions on Windows, Android and iOS where available.','Repeat U01-U05. Record browser/version, viewport and input method.','Same expected route results. No clipped critical controls or blocking browser error. Mark unavailable devices Blocked.');
add('REL04','Deployment','High','Vercel test deployment with server environment variables.','Load guest page and a hash link, refresh, test local scan and one authorized AI scan.','Page works after refresh; /api/scan-floor-plan responds appropriately. Server credentials never appear in frontend.','Deployment integration');
add('PERF01','Performance','High','Fixed reference graphs at declared node/edge sizes. Same device/build.','One warm-up then 30 recorded routes per graph/mode. Keep datasets and pairs fixed.','Record algorithm ms separately from click-to-directions ms. Proposed p95 <=100 ms for declared <=500-node/1500-edge graphs. Validate results as well as speed.','Instrumented benchmark');
add('RES01','Research reporting','High','Research view and a custom active establishment.','Compare active route, then run built-in reference tests. Record graph used for each.','Actual pass/fail is shown. Reference tests are identified as sample/synthetic tests, not validation of uploaded building or usability.');

const tasks=[
['U01','Guest','You are at reception and want to eat at the restaurant. You need a route without stairs. Find it and explain which route you would take.','Linden sample; blank route selections.','Accessible 38 m ramp route selected; participant identifies no-stairs route.',180],
['U02','Guest','You are at reception and need to reach Suite 202 without using stairs. Show how you would move between floors.','Linden sample; reception and Suite 202 available.','Accessible route selected; identifies elevator and destination floor; can show floor segments.',240],
['U03','Guest','You would like to visit the reading room, but cannot use stairs. Find out whether this app has a suitable route.','Linden sample; clear previous selections.','Recognizes no accessible route; does not interpret shortest stair route as suitable.',180],
['U04','Guest','You are now at the restaurant. Plan your return to reception, using a route without stairs.','Linden sample; reception-to-restaurant route displayed.','Correct endpoints reversed and accessible return route found. Swap is optional.',180],
['U05','Guest','Using the directions, tell me where you would start, how you change floors, and how you reach Suite 201.','Preselected accessible reception-to-Suite 201 route.','Correctly describes start, elevator transition and destination using ordered text directions.',240],
['U06','Staff','Set up a new establishment from this floor plan. Name two destinations and show that the map distances match the supplied measurement.','Authorized clean fixture; 10 m marked reference segment; staff onboarding completed.','New plan uploaded, two destinations named, correct calibration; does not activate unreviewed map.',600],
['U07','Staff','This draft includes a path through a closed wall. Fix it so visitors use the marked doorway instead.','Prepared unreviewed draft; independently verified doorway overlay.','Unsafe link removed/blocked; correct doorway geometry created and reviewed; no room shortcut.',600],
['U08','Staff','Prepare this verified two-floor draft for guests who need an elevator. Show the route between its named destinations.','Saved draft; verified elevator landing information and calibration references.','Valid elevator transition, required calibration/review complete; accessible cross-floor route works.',600],
['U09','Staff','Create a draft from this authorized plan using cloud scanning. Explain what must still be checked before guests use it.','Valid API setup; assigned test staff code; authorized image.','Consent understood; scan attempted correctly; participant recognizes need for door, scale and accessibility review.',600],
['U10','Staff','Cloud scanning is currently unavailable. Continue preparing this plan using the tools that still work.','Simulated cloud outage; valid image; do not supply solution.','Chooses local scan/manual correction; can continue without repeated cloud attempts or lost draft.',600]
];

const guideRows=[
['Scope','Evaluate the general establishment app using fictional Linden Hotel and independently prepared custom plans. These are planned tests. All results start blank or Not run.'],
['Evidence','Technical tests establish behavior for tested fixtures. Participant sessions measure effectiveness, efficiency and satisfaction in the tested context. Neither alone certifies real-building accessibility.'],
['Participants','Recruit intended guests, including people with mobility limitations, and staff who would maintain maps. Include their usual input methods. Do not collect diagnoses. Use anonymous codes.'],
['Study size','Proposed exploratory pilot: 8–12 guests and 3–5 staff, with a range of mobility and technology experience. This is a practical starting point, not a statistically justified sample. Agree the final study design with your adviser.'],
['Consent','Explain participation, voluntary withdrawal, observation and optional recording. Store consent/contact data separately. Obtain establishment permission for plans and separate consent before cloud image sharing.'],
['Freeze the protocol','Record app commit/build, device/browser, plan hash, calibration source, study date, model ID and prompt/config version. Fix task order rules, metrics, exclusions and targets before scored sessions.'],
['Participant setup','Give an unrelated practice task. Provide staff with the same brief onboarding. Use guest tasks U01–U05 for guests, staff tasks U06–U10 for staff. Do not show expected results to participants.'],
['Order and learning','Alternate two predetermined guest task orders while keeping each task setup independent. Keep dependent staff tasks ordered. Record order. Label repeat attempts separately; do not mix them into first-attempt success.'],
['Timing','Start when the participant finishes reading the task and says they are ready. Stop at verified completion, abandonment or the listed time limit. Exclude briefing/setup. Use one timing protocol for all participants.'],
['Assistance','Read the task verbatim. Do not hint during the first attempt. After a help request, provide one neutral prompt and record it. Any task-solving hint makes completion Assisted. Normal assistive technology use is not help.'],
['Outcomes','Use Unassisted, Assisted, Failed or Abandoned for an attempted task. Skipped means not attempted and is excluded. Keep blank if not yet recorded. Timeouts count Failed. Record why and retain elapsed time.'],
['Errors and ease','Count observable wrong endpoints/modes, dead ends and recovery actions using a fixed coding guide. After each task ask: How easy or difficult was this task? 1=very difficult, 7=very easy. Researcher-designed item; not a validated SUS score.'],
['Session metrics','Tasks tab calculates attempted count, unassisted completion rate and mean time for unassisted completions from Sessions rows 2–201. Mean time excludes failures; report failure counts and elapsed times separately.'],
['Proposed usability targets','Per guest task: >=90% unassisted completion, median ease >=5/7, and no participant accepting a known inaccessible route as accessible. Time limits are session stopping rules, not universal usability standards. Revise targets only before the main study.'],
['Critical defects','Any routable wall crossing, stair edge in accessible mode, unreviewed routable link, room shortcut or exposed API key is Critical. Fix before deployment and rerun affected tests. Do not average these away in an overall score.'],
['Accessibility audit','A01–A05 are selected WCAG-informed checks, not a full conformance assessment. Combine them with user sessions. Physical doorway width, slope, permissions and elevator conditions require independent establishment review.'],
['Ground truth','Use at least 10 diverse authorized plans for an exploratory scan evaluation: clean, furnished, low contrast, rotated and narrow/complex corridors. Two reviewers mark doors, destinations and valid corridor links before seeing predictions. Resolve disagreement and freeze annotations.'],
['Matching rule','Define corridor segments between consecutive independently marked doors/junctions. Collapse harmless degree-2 subdivisions. A predicted link matches one reference segment only if endpoints match and its full polyline stays in the verified walkable region. Fix endpoint tolerance before scoring (proposed 1% of image diagonal).'],
['Scan counts','Each Scan log row is one plan/run/object type/stage. TP=one-to-one matched predictions; FP=unmatched or duplicate predictions; FN=unmatched reference items. Precision=TP/(TP+FP), recall=TP/(TP+FN). Zero denominators remain blank.'],
['Scan stages','Score Raw output and Staff reviewed separately. Compare local and AI with identical images/criteria. Record every run including provider failures. A failed run has a failure status and blank counts; do not discard it or invent an accuracy score.'],
['Unsafe geometry','Count links crossing a verified closed wall, using unauthorized areas or transiting a destination room. Report raw unsafe links separately from routable unsafe links after review. Required after-review count is zero for tested plans.'],
['Scan timing','Correction time starts when the raw draft is ready and ends after verified edits, calibration and review. Report it alongside scan latency. Repeat each AI plan 3 times only if quota allows, record all attempts and cluster interpretation by plan.'],
['Performance','Use Benchmarks for fixed graph pairs and modes. Record algorithm time separately from UI response time. One warm-up, then 30 recorded runs for each graph/mode condition. Report median/p95 and graph sizes; do not label algorithm time as walking time.'],
['Privacy','Never record real API keys or staff scan codes. Redact screenshots. Keep participant codes and identity lookup separate. Set retention/access rules with your institution and participants.'],
['Limits','Maps persist only in the same browser/origin. Backup export exists; restore UI is not assumed. Hosted maps are not synchronized. No live positioning, obstacle sensing or elevator status. AI output is not surveyed building evidence.'],
['Result writing','Report counts with denominators, device/participant context, failures, and uncertainty. Suggested wording: In this study, X of Y participants completed task U01 without assistance. Do not claim proven usable for every establishment.'],
['Source: implementation','Reference expectations: src/scenarios.ts and routing/scan/AI tests. These freeze current sample fixtures; use independent manual geometry and separate annotated plans to avoid validating the scanner against itself.'],
['Source: usability','NIST, Usability Testing: https://www.nist.gov/programs-projects/usability-testing (accessed 2026-10-17). Representative users/tasks and effectiveness, efficiency, satisfaction.'],
['Source: evaluation','W3C WAI, Involving Users in Evaluating Web Accessibility: https://www.w3.org/WAI/test-evaluate/involving-users/ (accessed 2026-10-17). Combine user evaluation with standards checks; limit generalizations.'],
['Source: criteria','W3C, WCAG 2.2: https://www.w3.org/TR/WCAG22/ (accessed 2026-10-17). Selected checks: keyboard, no trap, focus, names, contrast, reflow, target size and status messages. Reduced motion is an additional project requirement.']
];

const wb=Workbook.create();
const tests=wb.worksheets.add('Test cases');
const taskSheet=wb.worksheets.add('Usability tasks');
const sessions=wb.worksheets.add('Sessions');
const scan=wb.worksheets.add('Scan log');
const perf=wb.worksheets.add('Benchmarks');
const guide=wb.worksheets.add('Guide');
const C={green:'#214D3E',ink:'#23352E',paper:'#FAF8F2',input:'#FFF4D9',line:'#DDD8CB',muted:'#607168'};
const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
function layout(sh,headers,rows,widths,start=1,name){
  const end=start+rows.length, last=col(headers.length-1);
  sh.showGridLines=false;
  sh.getRange(`A${start}:${last}${end}`).values=[headers,...rows];
  sh.getRange(`A${start}:${last}${end}`).format={font:{name:'Arial',size:11,color:C.ink},verticalAlignment:'top',wrapText:true,rowHeight:34};
  widths.forEach((w,i)=>sh.getRange(`${col(i)}${start}:${col(i)}${end}`).format.columnWidthPx=w);
  sh.getRange(`A${start}:${last}${start}`).format={fill:C.green,font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:42,verticalAlignment:'center',horizontalAlignment:'center',wrapText:true};
  sh.freezePanes.freezeRows(start);
  sh.freezePanes.freezeColumns(1);
  for(let r=start+1;r<=end;r++){
    if((r-start)%2===0)sh.getRange(`A${r}:${last}${r}`).format.fill=C.paper;
  }
  if(name){const table=sh.tables.add(`A${start}:${last}${end}`,true,name);table.style='TableStyleLight1';table.showFilterButton=true;}
  rows.forEach((row,i)=>{
    const lines=Math.max(...row.map((v,j)=>Math.ceil(String(v??'').length/Math.max(10,Math.floor((widths[j]-12)/7)))));
    sh.getRange(`A${start+i+1}:${last}${start+i+1}`).format.rowHeightPx=Math.max(38,lines*19+16);
  });
  return end;
}
function title(sh,text,note,last='J'){
  sh.getRange('A2').values=[[text]];sh.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:C.green};
  sh.getRange(`A2:${last}2`).format.borders={bottom:{style:'thin',color:C.line}};
  sh.getRange('A3').values=[[note]];sh.getRange('A3').format.font={name:'Arial',size:11,color:C.muted};
}
title(tests,'Indoor wayfinding test cases','Record status, actual findings and evidence for every executed case. No research results are prefilled.');
tests.tabColor=C.green;
const tend=layout(tests,['ID','Area','Priority','Setup / test data','Procedure','Expected result / pass criterion','Method','Status','Actual result','Evidence / defect ID / tester / date'],cases,[75,140,90,265,340,390,160,115,290,260],7,'TechnicalCases');
tests.getRange(`H8:J${tend}`).format.fill=C.input;
tests.getRange(`H8:H${tend}`).dataValidation={rule:{type:'list',values:['Not run','Pass','Fail','Blocked','Not applicable']}};
tests.getRange(`H8:H${tend}`).conditionalFormats.add('containsText',{text:'Fail',format:{fill:'#FCE8E6',font:{color:'#9E2A24',bold:true}}});
tests.getRange('A5').values=[['Passed']];tests.getRange('B5').formulas=[[`=COUNTIFS(H8:H${tend},"Pass")`]];
tests.getRange('C5').values=[['Failed']];tests.getRange('D5').formulas=[[`=COUNTIFS(H8:H${tend},"Fail")`]];
tests.getRange('E5').values=[['Not run']];tests.getRange('F5').formulas=[[`=COUNTIFS(H8:H${tend},"Not run")`]];

title(taskSheet,'Participant tasks','Read only the scenario to participants. Summaries use first attempts in Sessions rows 2–201.','K');
const taskRows=tasks.map(t=>[...t,null,null,null,null]);
layout(taskSheet,['Task ID','Role','Participant scenario','Facilitator setup','Objective completion criterion','Stop limit (s)','Attempts','Unassisted completions','Unassisted rate','Mean unassisted time (s)'],taskRows,[85,85,365,300,330,115,95,125,120,155],6,'ParticipantTasks');
for(let r=7;r<=16;r++){
 taskSheet.getRange(`G${r}`).formulas=[[`=COUNTIFS(Sessions!$E$2:$E$201,A${r},Sessions!$H$2:$H$201,"Unassisted")+COUNTIFS(Sessions!$E$2:$E$201,A${r},Sessions!$H$2:$H$201,"Assisted")+COUNTIFS(Sessions!$E$2:$E$201,A${r},Sessions!$H$2:$H$201,"Failed")+COUNTIFS(Sessions!$E$2:$E$201,A${r},Sessions!$H$2:$H$201,"Abandoned")`]];
 taskSheet.getRange(`H${r}`).formulas=[[`=COUNTIFS(Sessions!$E$2:$E$201,A${r},Sessions!$H$2:$H$201,"Unassisted")`]];
 taskSheet.getRange(`I${r}`).formulas=[[`=IF(G${r}=0,"",H${r}/G${r})`]];
 taskSheet.getRange(`J${r}`).formulas=[[`=IF(COUNTIFS(Sessions!$E$2:$E$201,A${r},Sessions!$H$2:$H$201,"Unassisted",Sessions!$I$2:$I$201,"<>",Sessions!$I$2:$I$201,">=0")=0,"",SUMIFS(Sessions!$I$2:$I$201,Sessions!$E$2:$E$201,A${r},Sessions!$H$2:$H$201,"Unassisted",Sessions!$I$2:$I$201,">=0")/COUNTIFS(Sessions!$E$2:$E$201,A${r},Sessions!$H$2:$H$201,"Unassisted",Sessions!$I$2:$I$201,"<>",Sessions!$I$2:$I$201,">=0"))`]];
}
for(let r=7;r<=16;r++){
 const formulas=taskSheet.getRange(`G${r}:J${r}`).formulas;
 taskSheet.getRange(`G${r}:J${r}`).formulas=formulas.map(row=>row.map(f=>f.replaceAll('Sessions!$H$2:$H$201,','Sessions!$G$2:$G$201,1,Sessions!$H$2:$H$201,')));
}
taskSheet.getRange('I7:I16').setNumberFormat('0.0%');taskSheet.getRange('J7:J16').setNumberFormat('0.0');

const blankRows=(n,k)=>Array.from({length:n},()=>Array(k).fill(null));
layout(sessions,['Participant code','Session date','Role','Device / browser / input method','Task ID','Task order','Attempt number','Outcome','Elapsed time (s)','Error count','Help count','Ease (1–7)','Observation / cause / evidence','App build / plan ID'],blankRows(200,14),[140,120,100,250,85,90,100,130,120,100,100,100,380,200],1,'SessionRecords');
sessions.getRange('A2:N201').format.fill=C.input;
sessions.getRange('B2:B201').setNumberFormat('yyyy-mm-dd');
sessions.getRange('E2:E201').dataValidation={rule:{type:'list',values:tasks.map(t=>t[0])}};
sessions.getRange('C2:C201').dataValidation={rule:{type:'list',values:['Guest','Staff']}};
sessions.getRange('H2:H201').dataValidation={rule:{type:'list',values:['Unassisted','Assisted','Failed','Abandoned','Skipped']}};
sessions.getRange('L2:L201').dataValidation={rule:{type:'whole',operator:'between',formula1:1,formula2:7}};
sessions.getRange('I2:I201').setNumberFormat('0.0');
for(const c of ['F','G','J','K'])sessions.getRange(`${c}2:${c}201`).dataValidation={rule:{type:'whole',operator:'greaterThanOrEqual',formula1:c==='J'||c==='K'?0:1}};

layout(scan,['Plan ID / hash','Run ID','Method / exact model ID','Date','Stage','Object type','Run status','TP','FP','FN','Precision','Recall','Unsafe links','Scan latency (s)','Correction time (s)','Notes / evidence / annotation version'],blankRows(60,16),[170,100,240,115,140,130,140,75,75,75,105,105,115,130,145,370],1,'ScanRecords');
scan.getRange('A2:J61').format.fill=C.input;scan.getRange('M2:P61').format.fill=C.input;
scan.getRange('D2:D61').setNumberFormat('yyyy-mm-dd');scan.getRange('N2:O61').setNumberFormat('0.0');
scan.getRange('E2:E61').dataValidation={rule:{type:'list',values:['Raw output','Staff reviewed']}};
scan.getRange('F2:F61').dataValidation={rule:{type:'list',values:['Door','Destination','Corridor link']}};
scan.getRange('G2:G61').dataValidation={rule:{type:'list',values:['Success','Provider failure','Validation failure','Cancelled']}};
scan.getRange('H2:J61').dataValidation={rule:{type:'whole',operator:'greaterThanOrEqual',formula1:0}};
scan.getRange('M2:M61').dataValidation={rule:{type:'whole',operator:'greaterThanOrEqual',formula1:0}};
for(let r=2;r<=61;r++){
 scan.getRange(`K${r}`).formulas=[[`=IF(OR(G${r}<>"Success",COUNT(H${r}:J${r})<3),"",IF(H${r}+I${r}=0,"",H${r}/(H${r}+I${r})))`]];
 scan.getRange(`L${r}`).formulas=[[`=IF(OR(G${r}<>"Success",COUNT(H${r}:J${r})<3),"",IF(H${r}+J${r}=0,"",H${r}/(H${r}+J${r})))`]];
}
scan.getRange('K2:L61').setNumberFormat('0.0%');
layout(perf,['Condition ID','Run number','Date','App build','Device / browser','Graph ID / version','Node count','Edge count','Mode','Start ID','End ID','Algorithm time (ms)','UI response time (ms)','Route status','Distance (m)','Correct result?','Notes / evidence'],blankRows(180,17),[135,110,115,160,230,180,105,105,120,120,120,140,145,120,115,130,300],1,'BenchmarkRecords');
perf.getRange('A2:Q181').format.fill=C.input;perf.getRange('C2:C181').setNumberFormat('yyyy-mm-dd');perf.getRange('L2:M181').setNumberFormat('0.000');perf.getRange('O2:O181').setNumberFormat('0.00');
perf.getRange('I2:I181').dataValidation={rule:{type:'list',values:['Shortest','Accessible']}};
perf.getRange('P2:P181').dataValidation={rule:{type:'list',values:['Yes','No','Not checked']}};
title(guide,'Testing protocol','Prepared 17 October 2026. Amber cells accept observations. Other cells contain procedures or calculations.','B');
layout(guide,['Topic','Protocol / source'],guideRows,[230,980],5,'ProtocolNotes');
guide.tabColor='#B7A47A';

// Exercise calculation with disposable synthetic observations, then remove them.
sessions.getRange('A2:N4').values=[
 ['QA-ONLY',null,'Guest','Test','U01',1,1,'Unassisted',20,0,0,6,'Synthetic formula check only','Test'],
 ['QA-ONLY',null,'Guest','Test','U01',1,1,'Assisted',40,1,1,4,'Synthetic formula check only','Test'],
 ['QA-ONLY',null,'Guest','Test','U01',1,1,'Failed',180,3,0,2,'Synthetic formula check only','Test']
];
scan.getRange('G2:J2').values=[['Success',8,2,2]];
wb.recalculate();
assert.equal(taskSheet.getRange('G7').values[0][0],3);
assert.equal(taskSheet.getRange('H7').values[0][0],1);
assert.ok(Math.abs(taskSheet.getRange('I7').values[0][0]-1/3)<1e-9);
assert.equal(taskSheet.getRange('J7').values[0][0],20);
sessions.getRange('G3').values=[[2]];
assert.equal(taskSheet.getRange('G7').values[0][0],2);
sessions.getRange('G3').values=[[1]];
sessions.getRange('I2').clear({applyTo:'contents'});
assert.equal(taskSheet.getRange('J7').values[0][0],'');
sessions.getRange('I2').values=[[0]];
assert.equal(taskSheet.getRange('J7').values[0][0],0);
assert.equal(scan.getRange('K2').values[0][0],0.8);assert.equal(scan.getRange('L2').values[0][0],0.8);
scan.getRange('H2:J2').values=[[0,2,4]];
assert.equal(scan.getRange('K2').values[0][0],0);assert.equal(scan.getRange('L2').values[0][0],0);
scan.getRange('H2:J2').values=[[0,0,0]];
assert.equal(scan.getRange('K2').values[0][0],'');assert.equal(scan.getRange('L2').values[0][0],'');
sessions.getRange('A2:N4').clear({applyTo:'contents'});scan.getRange('G2:J2').clear({applyTo:'contents'});
wb.recalculate();
assert.equal(taskSheet.getRange('I7').values[0][0],'');
assert.equal(scan.getRange('K2').values[0][0],'');
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:20},summary:'Final formula scan',maxChars:1500})).ndjson);
console.log((await wb.inspect({kind:'table',range:'Usability tasks!G6:J8',include:'values,formulas',tableMaxRows:3,tableMaxCols:4,maxChars:2000})).ndjson);
for(const [sh,range] of [[tests,'A5:H10'],[taskSheet,'A6:F9'],[sessions,'A1:H5'],[scan,'G1:P5'],[perf,'A1:H5'],[guide,'A5:B10']]){
 const img=await wb.render({sheetName:sh.name,range,scale:1,format:'png'});
 await fs.writeFile(path.join(support,sh.name.replaceAll(' ','-')+'.png'),new Uint8Array(await img.arrayBuffer()));
}
const dest=path.join(out,'Indoor-Wayfinding-Test-Cases.xlsx');
await (await SpreadsheetFile.exportXlsx(wb)).save(dest);

const md=`# Indoor wayfinding research testing guide

Prepared 17 October 2026. This package contains ${cases.length} technical cases, 10 participant tasks, and blank observation logs. No participant or live AI accuracy results have been collected in this workbook.

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

- **Test cases:** ${cases.length} cases with setup, procedure, expected result, priority, status and evidence fields. All start Not run.
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
`;
await fs.writeFile(path.join(out,'Research-Testing-Guide.md'),md,'utf8');
console.log(JSON.stringify({workbook:dest,caseCount:cases.length,tasks:tasks.length,formulaChecks:'passed; synthetic observations removed',guide:path.join(out,'Research-Testing-Guide.md')}));
