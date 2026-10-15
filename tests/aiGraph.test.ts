import test from 'node:test';
import assert from 'node:assert/strict';
import { aiGraphToDraft } from '../src/aiScan';
import { calibratedGraph } from '../src/buildingEditor';
import { findRoute } from '../src/routing';
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
  const mask={...grid,cells:[...grid.cells]};mask.cells[1*10+4]=0;
  const result=aiGraphToDraft(fixture(),floor,mask);
  assert.equal(result.edges[0].traversable,false);assert.match(result.message,/1 connections were blocked/);
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
