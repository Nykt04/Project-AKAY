import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../src/App';
import { FloorPlanStudio } from '../src/FloorPlanStudio';
import { BuildingContext, type Building } from '../src/buildings';

const building:Building={id:'office',name:'Civic Center',status:'ready',updatedAt:'2026-10-14T00:00:00.000Z',floors:[{id:7,name:'East wing',short:'E',description:'Uploaded floor plan',image:'data:image/png;base64,fixture',width:900,height:300,metersPerPixel:.1}],graph:{nodes:[{id:'a',name:'Main entry',floor:7,x:50,y:50,facility:true,category:'entrance'},{id:'b',name:'Service desk',floor:7,x:150,y:50,facility:true,category:'reception'}],edges:[{id:'ab',from:'a',to:'b',kind:'corridor',distance:10,accessible:true,traversable:true,reviewed:true}]}};
test('guest UI renders supplied establishment, image dimensions and graph without sample destinations',()=>{
  const html=renderToStaticMarkup(createElement(BuildingContext.Provider,{value:building},createElement(App)));
  assert.ok(html.includes('Civic Center'));assert.ok(html.includes('Service desk'));
  assert.ok(html.includes('viewBox="0 0 900 300"'));assert.ok(html.includes('50,50 150,50'));
  assert.ok(!html.includes('Linden Hotel'));assert.ok(!html.includes('Suite 201'));
});
test('an inaccessible custom connection is not rendered as a successful accessible route',()=>{
  const standardOnly={...building,graph:{...building.graph,edges:building.graph.edges.map(e=>({...e,accessible:false}))}};
  const html=renderToStaticMarkup(createElement(BuildingContext.Provider,{value:standardOnly},createElement(App)));
  assert.ok(html.includes('No accessible route available'));assert.ok(html.includes('some connections are not marked accessible'));
  assert.ok(!html.includes('class="selected-path"'));
});
test('studio exposes upload, calibration, review and keyboard editing controls',()=>{
  const html=renderToStaticMarkup(createElement(FloorPlanStudio,{initial:{...building,status:'draft'},onSaved:()=>{},onUse:()=>{},onSaving:()=>{}}));
  for(const label of ['Upload floor plan','Scan with AI','Local scan','Staff scan code','Send this floor image to Google','Mark two known points','Edit with coordinates','Use reviewed map','unreviewed'])assert.ok(html.includes(label),label);
  assert.ok(html.includes('Confirm step-free access'));
  assert.ok(!html.includes('>Corridor seed</button>'), 'AI mode must not offer a seed that it ignores');
});
