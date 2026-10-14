import test from 'node:test';
import assert from 'node:assert/strict';
import { scanFloor, clearSegment, type ScanInput } from '../src/scan';
import { activationErrors, calibratedGraph, connectionError, reviewEdge } from '../src/buildingEditor';
import { findRoute, validateGraph } from '../src/routing';
import { edgeGeometry } from '../src/geometry';
import type { Building } from '../src/buildings';
import type { ClearanceGrid, HotelGraph } from '../src/types';

// Independently specified L-shaped white corridor, surrounded by solid black walls.
function corridor():ScanInput {
  const width=48,height=40;
  const gray=Array.from({length:width*height},(_,i)=>{
    const x=i%width,y=Math.floor(i/width);
    return (x>=6&&x<=39&&y>=6&&y<=12)||(x>=33&&x<=39&&y>=6&&y<=33)?255:0;
  });
  return {width,height,gray,imageWidth:480,imageHeight:400,threshold:155,padding:0,floor:4};
}
function draftFromScan():Building {
  const result=scanFloor(corridor());
  return {id:'test',name:'Test office',updatedAt:'',status:'draft',floors:[{id:4,name:'Office floor',short:'4',description:'Test fixture',image:'',width:480,height:400,metersPerPixel:.1}],graph:{nodes:result.nodes.map((n,i)=>({...n,facility:i<2,name:i<2?['Entrance','Office'][i]:n.name,category:i<2?'facility':undefined})),edges:result.edges.map(e=>reviewEdge(e,'accessible')),clearanceGrids:{4:result.grid}}};
}
test('scan follows a right-angle corridor and never connects through its inner wall',()=>{
  const input=corridor(),result=scanFloor(input),lookup=Object.fromEntries(result.nodes.map(n=>[n.id,n]));
  assert.ok(result.nodes.length>=2);assert.ok(result.edges.length>0);
  assert.ok(result.nodes.some(n=>n.x<130&&n.y<130));
  assert.ok(result.nodes.some(n=>n.x>330&&n.y>280));
  for(const edge of result.edges){
    assert.equal(edge.reviewed,false);assert.equal(edge.accessible,false);
    const path=edgeGeometry(edge,lookup);
    for(let i=1;i<path.length;i++){
      assert.ok(clearSegment(result.grid,path[i-1],path[i]));
      // Separate geometric oracle; do not simply trust the scanner's own mask.
      for(let j=0;j<=100;j++){
        const x=(path[i-1][0]+(path[i][0]-path[i-1][0])*j/100)/10;
        const y=(path[i-1][1]+(path[i][1]-path[i-1][1])*j/100)/10;
        assert.ok((x>=6&&x<40&&y>=6&&y<13)||(x>=33&&x<40&&y>=6&&y<34));
      }
    }
  }
  assert.equal(clearSegment(result.grid,[95,95],[365,305]),false);
});
test('reviewed scanned graph routes around the corner with distance equal to calibrated segments',()=>{
  const b=draftFromScan();b.graph=calibratedGraph(b.graph,b.floors);
  assert.deepEqual(activationErrors(b),[]);
  const start=b.graph.nodes.find(n=>n.x<130)!,end=b.graph.nodes.find(n=>n.y>280)!;
  const route=findRoute(b.graph,start.id,end.id,'accessible');
  assert.equal(route.status,'found');assert.ok(route.distance!>40&&route.distance!<60);
  assert.equal(route.distance,route.edgeIds.reduce((sum,id)=>sum+b.graph.edges.find(e=>e.id===id)!.distance,0));
});
test('blank and solid plans do not fabricate a graph',()=>{
  const input=corridor();
  assert.throws(()=>scanFloor({...input,gray:input.gray.map(()=>255)}),/No enclosed/);
  assert.throws(()=>scanFloor({...input,gray:input.gray.map(()=>0)}),/No enclosed/);
  assert.throws(()=>scanFloor({...input,seed:[0,0]}),/detected wall/);
});
test('a corridor seed chooses only its connected region',()=>{
  const input=corridor();
  for(let y=23;y<=29;y++)for(let x=6;x<=24;x++)input.gray[y*input.width+x]=255;
  const result=scanFloor({...input,seed:[125,265]});
  assert.ok(result.nodes.every(n=>n.x<250&&n.y>220));
});
test('cell coverage rejects thin walls and diagonal corner cutting',()=>{
  const grid:ClearanceGrid={width:3,height:3,imageWidth:30,imageHeight:30,cells:[1,0,1,1,0,1,1,0,1]};
  assert.equal(clearSegment(grid,[5,5],[25,5]),false);
  assert.equal(clearSegment({...grid,cells:[1,0,1,0,1,1,1,1,1]},[5,5],[15,15]),false);
  assert.equal(clearSegment(grid,[5,5],[5,25]),true);
});
test('unreviewed paths cannot be used by either routing mode',()=>{
  const b=draftFromScan();b.graph.edges=b.graph.edges.map(e=>({...e,reviewed:false}));
  for(const mode of ['shortest','accessible'] as const)assert.equal(findRoute(b.graph,b.graph.nodes[0].id,b.graph.nodes[1].id,mode).status,'unreachable');
  assert.ok(activationErrors(b).some(e=>e.includes('Review every')));
});
test('activation requires scale, named destinations, obstacle masks and reviewed connections',()=>{
  const b=draftFromScan();b.floors[0].metersPerPixel=undefined;b.graph.nodes.forEach(n=>n.facility=false);
  assert.ok(activationErrors(b).some(e=>e.includes('Calibrate')));
  assert.ok(activationErrors(b).some(e=>e.includes('two destination')));
  b.graph.clearanceGrids={};assert.ok(activationErrors(b).some(e=>e.includes('obstacle mask')));
});
test('scale uses full polyline length, and preserves entered vertical distance',()=>{
  const graph:HotelGraph={nodes:[{id:'a',name:'A',floor:0,x:0,y:0},{id:'b',name:'B',floor:0,x:30,y:40},{id:'c',name:'C',floor:1,x:9,y:9}],edges:[{id:'ab',from:'a',to:'b',via:[[30,0]],distance:0,kind:'corridor',accessible:true,traversable:true},{id:'bc',from:'b',to:'c',distance:7,kind:'elevator',accessible:true,traversable:true}]};
  const result=calibratedGraph(graph,[{id:0,name:'G',short:'G',description:'',image:'',width:100,height:100,metersPerPixel:.2}]);
  assert.equal(result.edges[0].distance,14);assert.equal(result.edges[1].distance,7);
});
test('uploaded floor transitions may have different drawing coordinates',()=>{
  const graph:HotelGraph={nodes:[{id:'a',name:'Lift A',floor:4,x:5,y:5,category:'elevator'},{id:'b',name:'Lift B',floor:7,x:75,y:75,category:'elevator'}],edges:[{id:'ab',from:'a',to:'b',distance:9,kind:'elevator',accessible:true,traversable:true,reviewed:true}],clearanceGrids:{}};
  assert.deepEqual(validateGraph(graph),[]);assert.equal(findRoute(graph,'a','b','accessible').distance,9);
  graph.edges[0].kind='corridor';assert.ok(validateGraph(graph).some(e=>e.includes('floor transition')));
});
test('review never makes stairs accessible and blocked paths are excluded',()=>{
  const b=draftFromScan(),edge={...b.graph.edges[0],kind:'stairs' as const};
  assert.equal(reviewEdge(edge,'accessible').accessible,false);
  assert.equal(reviewEdge(edge,'blocked').traversable,false);
});
test('manual connection rejects deleted targets, different floors and existing links',()=>{
  const b=draftFromScan(),from=b.graph.nodes[0],to=b.graph.nodes[1];
  assert.match(connectionError(b.graph,from.id,'deleted',4)!,/existing nodes/);
  b.graph.nodes.push({...to,id:'other-floor',floor:7});
  assert.match(connectionError(b.graph,from.id,'other-floor',4)!,/existing nodes/);
  const edge=b.graph.edges[0];
  assert.match(connectionError(b.graph,edge.from,edge.to,4)!,/already have/);
});
