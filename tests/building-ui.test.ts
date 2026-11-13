import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../src/App';
import { FloorPlanStudio } from '../src/FloorPlanStudio';
import { LocationPicker } from '../src/LocationPicker';
import { initialSetupStage, setupReadiness } from '../src/setupFlow';
import { BuildingContext, type Building } from '../src/buildings';
import { Workspace, SystemLoader, formatDocumentTitle } from '../src/Workspace';
import { ResearchView, buildResearchExport } from '../src/ResearchView';

const building:Building={id:'office',name:'Civic Center',status:'ready',updatedAt:'2026-10-14T00:00:00.000Z',floors:[{id:7,name:'East wing',short:'E',description:'Uploaded floor plan',image:'data:image/png;base64,fixture',width:900,height:300,metersPerPixel:.1}],graph:{nodes:[{id:'a',name:'Main entry',floor:7,x:50,y:50,facility:true,category:'entrance'},{id:'b',name:'Service desk',floor:7,x:150,y:50,facility:true,category:'reception'}],edges:[{id:'ab',from:'a',to:'b',kind:'corridor',distance:10,accessible:true,traversable:true,reviewed:true}]}};
test('default Civic Center sample renders 1200x1000 metric floor plan, Project AKAY brand and dynamic hero',()=>{
  const html=renderToStaticMarkup(createElement(App));
  assert.ok(html.includes('Project AKAY'));
  assert.ok(html.includes('Navigate Civic Center, step-free or shortest path.'));
  assert.ok(html.includes('Dijkstra'));
  assert.ok(html.includes('Main entrance'));
  assert.ok(html.includes('Public library'));
  assert.ok(html.includes('Souvenir shop'));
  assert.ok(html.includes('viewBox="0 0 1200 1000"'));
  assert.ok(html.includes('cta-arrow-badge'));
  assert.ok(!html.includes('demo-label')&&!html.includes('picker-selected-floor-tag'));
  assert.ok(!html.includes('Restaurant')&&!html.includes('Suite 201'));
});
test('guest UI renders supplied establishment, image dimensions and graph without sample destinations',()=>{
  const html=renderToStaticMarkup(createElement(BuildingContext.Provider,{value:building},createElement(App)));
  assert.ok(html.includes('Civic Center'));assert.ok(html.includes('Service desk'));
  assert.ok(html.includes('viewBox="0 0 900 300"'));assert.ok(html.includes('50,50 150,50'));
  assert.ok(!html.includes('Linden Hotel'));assert.ok(!html.includes('Suite 201'));
  for(const target of ['floor-map','route-directions']) {
    assert.ok(html.includes(`href="#${target}"`));
    assert.ok(html.includes(`id="${target}" tabindex="-1"`));
  }
});
test('an inaccessible custom connection is not rendered as a successful accessible route',()=>{
  const standardOnly={...building,graph:{...building.graph,edges:building.graph.edges.map(e=>({...e,accessible:false}))}};
  const html=renderToStaticMarkup(createElement(BuildingContext.Provider,{value:standardOnly},createElement(App)));
  assert.ok(html.includes('No accessible route available'));assert.ok(html.includes('some connections are not marked accessible'));
  assert.ok(!html.includes('class="selected-path"'));
  assert.ok(!html.includes('aria-label="Route shortcuts"'));
  assert.ok(!html.includes('id="route-directions"'));
});
test('map-check step exposes correction and calibration without competing upload or AI setup forms',()=>{
  const html=renderToStaticMarkup(createElement(FloorPlanStudio,{initial:{...building,status:'draft'},onSaved:()=>{},onUse:()=>{},onSaving:()=>{}}));
  for(const label of ['Mark two known points','Edit with coordinates','Continue to access review','Path corrections &amp; advanced tools'])assert.ok(html.includes(label),label);
  for(const label of ['aria-label="Upload floor plan"','Staff scan code','Scan with AI','Open visitor navigation','Confirm step-free access'])assert.ok(!html.includes(label),label);
});

test('a removed location leaves a recoverable selection instead of crashing the picker',()=>{
  const html=renderToStaticMarkup(createElement(BuildingContext.Provider,{value:building},
    createElement(LocationPicker,{label:'Destination',value:'removed-node',invalid:true,onChange:()=>{}})));
  assert.ok(html.includes('Choose a location'));
  assert.ok(html.includes('aria-invalid="true"'));
});

test('review screen keeps activation blocked until every connection is reviewed',()=>{
  const draft:Building={...building,status:'draft',graph:{...building.graph,edges:building.graph.edges.map(e=>({...e,reviewed:false}))}};
  const html=renderToStaticMarkup(createElement(FloorPlanStudio,{initial:{...draft,status:'ready'},onSaved:()=>{},onUse:()=>{},onSaving:()=>{}}));
  assert.ok(html.includes('1 connections still need review'));
  assert.ok(html.includes('Review every connection'));
  assert.match(html,/<button class="primary-button" disabled="">Open visitor navigation/);
  assert.ok(html.includes('Confirm step-free access'));
});

test('an empty establishment starts with upload guidance and no completion claim',()=>{
  const empty:Building={...building,status:'draft',floors:[],graph:{nodes:[],edges:[]}};
  const html=renderToStaticMarkup(createElement(FloorPlanStudio,{initial:empty,onSaved:()=>{},onUse:()=>{},onSaving:()=>{}}));
  assert.ok(html.includes('Start with your place.'));
  assert.ok(html.includes('aria-label="Upload floor plan"'));
  assert.match(html,/<button class="primary-button" disabled="">Continue to paths/);
  for(const label of ['Staff scan code','Mark two known points','Confirm step-free access','editor-toolbar','Open visitor navigation'])assert.ok(!html.includes(label),label);
});

test('scan step provides consent and no-key alternative without exposing editing or access review',()=>{
  const initial:Building={...building,status:'draft',graph:{nodes:[],edges:[]}};
  const html=renderToStaticMarkup(createElement(FloorPlanStudio,{initial,onSaved:()=>{},onUse:()=>{},onSaving:()=>{}}));
  for(const label of ['Staff scan code','Send this floor image to Google','Local scan','Draw paths myself instead'])assert.ok(html.includes(label),label);
  assert.match(html,/<button class="primary-button scan-button"[^>]*disabled=""/);
  assert.ok(!html.includes('Mark two known points'));
  assert.ok(!html.includes('Confirm step-free access'));
});

test('setup readiness requires named floors, paths, scale on every floor and destinations',()=>{
  const draft:Building={...building,status:'draft'};
  assert.equal(initialSetupStage({...draft,name:''}),0);
  assert.equal(initialSetupStage({...draft,graph:{nodes:[],edges:[]}}),1);
  assert.equal(initialSetupStage(draft),2);
  assert.equal(initialSetupStage(building),3);
  assert.equal(setupReadiness(draft).canReview,true);
  assert.equal(setupReadiness({...draft,floors:[...draft.floors,{...draft.floors[0],id:8,name:'Upper floor',metersPerPixel:undefined}]}).canReview,false);
  assert.equal(setupReadiness({...draft,graph:{...draft.graph,nodes:draft.graph.nodes.map(n=>({...n,facility:false}))}}).canReview,false);
  assert.equal(setupReadiness({...draft,floors:draft.floors.map(f=>({...f,name:''}))}).canReview,false);
});

test('rejected draft connections are explained and inspectable without drawing misleading wall-crossing lines',()=>{
  const initial:Building={...building,status:'draft',graph:{...building.graph,edges:building.graph.edges.map(e=>({...e,reviewed:false,traversable:false}))}};
  const html=renderToStaticMarkup(createElement(FloorPlanStudio,{initial,onSaved:()=>{},onUse:()=>{},onSaving:()=>{}}));
  assert.ok(html.includes('Trace draft paths around walls'));
  assert.ok(html.includes('Show rejected connections (1)'));
  assert.ok(html.includes('connections are blocked, not usable paths'));
  assert.ok(html.includes('Main entry → Service desk'),'rejected edge stays available in the inspector');
  assert.ok(!html.includes('class="editor-edge blocked'));
});


test('Project AKAY workspace and preloader present general multi-establishment chrome without Civic-only loader floors', () => {
  const loaderHtml = renderToStaticMarkup(createElement(SystemLoader, { buildingName: '', exiting: false, onSkip: () => {} }));
  assert.ok(loaderHtml.includes('Project AKAY'));
  assert.ok(loaderHtml.includes('Accessibility-Aware Indoor Facility Finder'));
  assert.ok(loaderHtml.includes('Dijkstra Shortest Path'));
  assert.ok(!loaderHtml.includes('Rescue &amp; fire truck bays'));

  const workspaceHtml = renderToStaticMarkup(createElement(Workspace));
  assert.ok(workspaceHtml.includes('Project AKAY'));
  assert.ok(workspaceHtml.includes('optgroup label="Built-in samples"'));
  assert.ok(workspaceHtml.includes('aria-label="New establishment"'));
});


test('guest UI adapts hero dynamically for arbitrary establishments and falls back cleanly on blank names', () => {
  const custom: Building = { ...building, name: 'St. Luke Medical Pavilion' };
  const customHtml = renderToStaticMarkup(createElement(BuildingContext.Provider, { value: custom }, createElement(App)));
  assert.ok(customHtml.includes('Project AKAY'));
  assert.ok(customHtml.includes('Navigate St. Luke Medical Pavilion, step-free or shortest path.'));
  assert.ok(!customHtml.includes('Civic Center'));

  const unnamed: Building = { ...building, name: '   ' };
  const unnamedHtml = renderToStaticMarkup(createElement(BuildingContext.Provider, { value: unnamed }, createElement(App)));
  assert.ok(unnamedHtml.includes('Navigate this establishment, step-free or shortest path.'));
});


test('ResearchView labels samples generically and exports Project AKAY metadata for the active facility', () => {
  const campusSample: Building = { ...building, id: 'multi-building-campus', name: 'Multi-Building Campus (BP 344)', sample: true };
  const sampleHtml = renderToStaticMarkup(createElement(BuildingContext.Provider, { value: campusSample },
    createElement(ResearchView, { routes: null, onBack: () => {} })));
  assert.ok(sampleHtml.includes('Project AKAY'));
  assert.ok(sampleHtml.includes('built-in sample establishment'));
  assert.ok(!sampleHtml.includes('sample civic facility'));

  const exported = buildResearchExport('Multi-Building Campus (BP 344)', []);
  assert.equal(exported.filename, 'project-akay-routing-results.json');
  assert.equal(exported.payload.system, 'Project AKAY — Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm');
  assert.equal(exported.payload.facility, 'Multi-Building Campus (BP 344)');
  assert.equal(exported.payload.benchmarkSample, 'Civic Center');
});

test('document title helper trims whitespace-only establishment names to Project AKAY fallback', () => {
  assert.equal(formatDocumentTitle(''), 'New establishment · Project AKAY');
  assert.equal(formatDocumentTitle('   '), 'New establishment · Project AKAY');
  assert.equal(formatDocumentTitle('North Wing'), 'North Wing · Project AKAY');
});
