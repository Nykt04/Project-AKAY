import test from 'node:test';
import assert from 'node:assert/strict';
import { aiGraphToDraft } from '../src/aiScan';
import { calibratedGraph } from '../src/buildingEditor';
import { findRoute } from '../src/routing';
import { clearSegment } from '../src/scan';
import { edgeGeometry } from '../src/geometry';
import { traceOpenPath, traceDraftConnections } from '../src/tracePaths';
import type { BuildingFloor } from '../src/buildings';
const floor:BuildingFloor={id:5,name:'Office',short:'5',description:'Test',image:'',width:100,height:100,metersPerPixel:.1};
const grid={width:10,height:10,imageWidth:100,imageHeight:100,cells:Array(100).fill(1)};
const fixture=()=>({nodes:[{id:'a',name:'Entrance',x:150,y:150,category:'entrance',destination:true},{id:'b',name:'Office',x:750,y:150,category:'room',destination:true}],edges:[{from:'a',to:'b',kind:'corridor',via:[],accessible:true,reviewed:true,distance:1}],notes:['Fixture only']});
test('AI graph ignores supplied accessibility, review and distance claims; calibration derives meters',()=>{
  const result=aiGraphToDraft(fixture(),floor,grid),edge=result.edges[0];
  assert.equal(result.nodes[0].x,15);assert.equal(result.nodes[0].floor,5);
  assert.equal(edge.accessible,false);assert.equal(edge.reviewed,false);assert.equal(edge.distance,60);
  const graph=calibratedGraph({nodes:result.nodes,edges:result.edges,clearanceGrids:{5:grid}},[floor]);
  assert.equal(graph.edges[0].distance,6);
  assert.equal(findRoute(graph,result.nodes[0].id,result.nodes[1].id,'shortest').status,'unreachable');
});
test('AI wall crossings are visibly blocked instead of silently routed',()=>{
  const mask={...grid,cells:[...grid.cells]};for(let y=0;y<10;y++)mask.cells[y*10+4]=0;
  const result=aiGraphToDraft(fixture(),floor,mask);
  assert.equal(result.edges[0].traversable,false);assert.match(result.message,/1 connections could not be traced safely/);
});

test('a diagonal room connection is traced through the actual doorway without changing the wall mask',()=>{
  const mask={...grid,cells:[...grid.cells]};
  for(let y=0;y<10;y++)mask.cells[y*10+4]=0;
  mask.cells[5*10+4]=1; // Only opening in the separating wall.
  const original=[...mask.cells],result=aiGraphToDraft(fixture(),floor,mask),edge=result.edges[0];
  assert.equal(edge.traversable,true);assert.equal(edge.reviewed,false);assert.equal(edge.accessible,false);
  const points=edgeGeometry(edge,Object.fromEntries(result.nodes.map(n=>[n.id,n])));
  assert.ok(points.length>2,'must bend toward the door, not draw the original diagonal');
  assert.ok(points.some(p=>p[1]>=50),'route reaches the doorway row');
  assert.ok(points.slice(1).every((p,i)=>clearSegment(mask,points[i],p)));
  assert.deepEqual(mask.cells,original,'tracing must not open walls');
  assert.ok(edge.distance>60);
  assert.equal(edge.distance,points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0));
});

test('misplaced nodes and doorway anchors remain blocked instead of snapping through walls',()=>{
  const mask={...grid,cells:[...grid.cells]};mask.cells[11]=0;
  assert.equal(traceOpenPath(mask,[15,15],[75,15]),null);
  const data=fixture();data.edges[0].via=[{x:450,y:150}] as never;
  const anchoredMask={...grid,cells:[...grid.cells]};anchoredMask.cells[14]=0;
  assert.equal(aiGraphToDraft(data,floor,anchoredMask).edges[0].traversable,false);
});

test('tracing cannot cut diagonal corners or cross a disconnected wall',()=>{
  const mask={width:3,height:3,imageWidth:30,imageHeight:30,cells:[1,0,0,0,1,0,0,0,1]};
  assert.equal(traceOpenPath(mask,[5,5],[15,15]),null);
});

test('facility labels cannot become corridor shortcuts, even when one connection was already reviewed',()=>{
  const data=fixture();data.nodes[1].category='facility';
  data.nodes.push({id:'c',name:'Hall',x:750,y:750,category:'junction',destination:false});
  data.edges.push({...data.edges[0],from:'b',to:'c'});
  const result=aiGraphToDraft(data,floor,grid);
  assert.ok(result.edges.every(e=>!e.traversable));
  const all=result.edges.map((e,i)=>({...e,reviewed:i===0,traversable:true}));
  const traced=traceDraftConnections(result.nodes,[all[1]],grid,all);
  assert.equal(traced.edges[0].traversable,false);
});
test('AI room shortcuts are blocked',()=>{
  const data=fixture();data.nodes.push({id:'c',name:'Corridor',x:750,y:750,category:'junction',destination:false});
  data.edges.push({...data.edges[0],from:'b',to:'c'});
  assert.ok(aiGraphToDraft(data,floor,grid).edges.every(e=>!e.traversable));
});
test('AI invalid coordinates, duplicate IDs, missing endpoints and unknown kinds reject the entire draft',()=>{
  const mutations=[(data:ReturnType<typeof fixture>)=>{data.nodes[0].x=1001;},(data:ReturnType<typeof fixture>)=>{data.nodes[1].id='a';},(data:ReturnType<typeof fixture>)=>{data.edges[0].to='missing';},(data:ReturnType<typeof fixture>)=>{data.edges[0].kind='teleport';}];
  for(const mutate of mutations){const data=fixture();mutate(data);assert.throws(()=>aiGraphToDraft(data,floor,grid));}
});
test('empty and oversized AI results never replace the draft',()=>{
  assert.throws(()=>aiGraphToDraft({nodes:[],edges:[],notes:['Not a floor plan']},floor,grid),/could not identify/);
  const data=fixture();data.nodes=Array(151).fill(data.nodes[0]);assert.throws(()=>aiGraphToDraft(data,floor,grid),/oversized/);
});
test('AI scan cannot use an obstacle mask from a differently sized image',()=>{
  assert.throws(()=>aiGraphToDraft(fixture(),floor,{...grid,imageWidth:200}),/does not match/);
});
