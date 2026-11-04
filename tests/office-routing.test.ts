import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {traceOpenPath} from '../src/tracePaths';
import {clearSegment} from '../src/scan';
import {connectionPath, connectionError} from '../src/buildingEditor';
import {findRoute} from '../src/routing';
import {aiGraphToDraft} from '../src/aiScan';
import type {ClearanceGrid, HotelGraph} from '../src/types';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/office-clearance.json',import.meta.url),'utf8'));
const grid:ClearanceGrid={width:fixture.width,height:fixture.height,imageWidth:fixture.imageWidth,imageHeight:fixture.imageHeight,cells:[...inflateSync(Buffer.from(fixture.deflatedCells,'base64'))]};
type Point=[number,number];
// Measured from the original 650x774 drawing, independently of Gemini's output.
// Targets are corridor-side door approaches, not room centers or accessibility claims.
const entrances:[string,Point][]=[['roof',[325,250]],['logistics',[290,307]],['manager',[350,280]],['meeting-one',[140,354]],['meeting-two',[250,347]],['financial',[350,365]],['reception',[350,450]],['working',[290,450]],['lift',[460,670]],['stairs',[570,650]],['restroom',[57,644]]];
// Independent, conservative interior rectangles of visible solid wall sections.
const walls=[[368,295,375,325],[368,385,375,430],[368,478,375,530],[375,529,605,534],[375,631,605,638],[274,250,281,293],[274,480,281,590]];
function assertWallsAvoided(path:Point[]){
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i];
    const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*4);
    for(let k=0;k<=steps;k++){
      const t=steps?k/steps:0,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
      assert.ok(!walls.some(([left,top,right,bottom])=>x>=left&&x<=right&&y>=top&&y<=bottom),`path crosses independently measured wall at ${x},${y}`);
    }
    assert.ok(clearSegment(grid,a,b));
  }
}
test('actual office plan: all 11 measured entrance approaches are reachable without crossing walls',()=>{
  for(const [name,end] of entrances){
    const path=traceOpenPath(grid,[325,660],end);
    assert.ok(path,`${name} must be reachable`);
    assertWallsAvoided(path);
  }
});
test('actual office plan: stair-to-manager path must go around the storage and reception walls',()=>{
  const start:Point=[570,650],end:Point=[350,280];
  assert.equal(clearSegment(grid,start,end),false);
  const path=traceOpenPath(grid,start,end);
  assert.ok(path&&path.length>2);
  assertWallsAvoided(path);
  // Must use the central corridor west of x368 before going north of the storage room.
  assert.ok(path.some(([x,y])=>x<368&&y>530));
});
test('actual office plan: storage with no drawn doorway stays unreachable, in either direction',()=>{
  assert.ok(clearSegment(grid,[500,600],[500,600]),'endpoint must be on empty room floor, not its printed label');
  assert.equal(traceOpenPath(grid,[325,660],[500,600]),null);
  assert.equal(traceOpenPath(grid,[500,600],[325,660]),null);
});
test('actual office plan: manually connected entrances use traced geometry and require review',()=>{
  const graph:HotelGraph={nodes:[{id:'s',name:'Stair approach',category:'stairs',facility:true,floor:0,x:570,y:650},{id:'m',name:'Manager entrance',category:'room',facility:true,floor:0,x:350,y:280}],edges:[],clearanceGrids:{0:grid}};
  assert.equal(connectionError(graph,'s','m',0),null);
  const path=connectionPath(graph,'s','m')!;
  assert.ok(path.length>2);assertWallsAvoided(path);
  const distance=path.slice(1).reduce((total,p,i)=>total+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);
  graph.edges=[{id:'sm',from:'s',to:'m',via:path.slice(1,-1),kind:'corridor',distance,traversable:true,reviewed:false,accessible:false}];
  assert.equal(findRoute(graph,'s','m','shortest').status,'unreachable');
  graph.edges[0].reviewed=true; // Test-only review; no real-world accessibility assertion.
  assert.equal(findRoute(graph,'s','m','shortest').distance,distance);
  assert.equal(findRoute(graph,'s','m','accessible').status,'unreachable');
});
test('recorded live office scan: bad Gemini coordinates cannot become guest routes',()=>{
  const response=JSON.parse(readFileSync(new URL('./fixtures/office-gemini-response.json',import.meta.url),'utf8'));
  const draft=aiGraphToDraft(response.graph,{id:0,name:'Office',short:'G',description:'Recorded live response',image:'',width:650,height:774},grid);
  assert.equal(draft.edges.filter(e=>e.traversable).length,4);
  assert.equal(draft.edges.filter(e=>!e.traversable).length,12);
  assert.ok(draft.edges.every(e=>e.reviewed===false&&e.accessible===false));
  const graph={nodes:draft.nodes,edges:draft.edges,clearanceGrids:{0:grid}};
  for(const a of draft.nodes)for(const b of draft.nodes)if(a.id!==b.id)
    for(const mode of ['shortest','accessible'] as const)assert.notEqual(findRoute(graph,a.id,b.id,mode).status,'found');
});
