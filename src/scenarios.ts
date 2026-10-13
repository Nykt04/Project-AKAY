import { hotel } from './hotel';
import { findRoute, validateGraph } from './routing';
import type { HotelGraph, RouteMode, RouteResult } from './types';

export interface Scenario { name: string; start: string; end: string; mode: RouteMode; expected: string; check: (r: RouteResult) => boolean; graph?: HotelGraph; }
const mini: HotelGraph = {
  nodes: ['a','b','c','d','z'].map((id,i) => ({ id, name:id, floor:0, x:i*10, y:0 })),
  edges: [['a','b',2],['a','c',2],['b','d',3],['c','d',3]].map(([a,b,d]) => ({ id:`${a}-${b}`, from:String(a), to:String(b), distance:Number(d), kind:'corridor', accessible:true, traversable:true }))
};
export const scenarios: Scenario[] = [
  { name:'Shortest route via steps', start:'reception', end:'restaurant', mode:'shortest', expected:'24 m; uses steps', check:r => r.distance===24 && r.edgeIds.includes('reception--g-s') },
  { name:'Accessible route via ramp', start:'reception', end:'restaurant', mode:'accessible', expected:'38 m; uses ramp', check:r => r.distance===38 && r.edgeIds.includes('g-d--g-e') },
  { name:'Same-floor corridor', start:'reception', end:'lounge', mode:'accessible', expected:'19 m; no stairs', check:r => r.distance===19 },
  { name:'Cross-floor elevator', start:'lift-0', end:'lift-2', mode:'accessible', expected:'16 m; two elevator links', check:r => r.distance===16 && r.edgeIds.length===2 },
  { name:'Cross-floor stairs', start:'stairs-0', end:'stairs-2', mode:'shortest', expected:'10 m; two stair links', check:r => r.distance===10 },
  { name:'Stairs-only destination', start:'reception', end:'reading-room', mode:'accessible', expected:'No accessible route', check:r => r.status==='unreachable' },
  { name:'Disconnected destination', start:'reception', end:'private-room', mode:'shortest', expected:'No public route', check:r => r.status==='unreachable' },
  { name:'Already at destination', start:'reception', end:'reception', mode:'accessible', expected:'0 m; no connections', check:r => r.distance===0 && r.nodeIds.length===1 && r.edgeIds.length===0 },
  { name:'Missing selection', start:'', end:'restaurant', mode:'shortest', expected:'Invalid selection', check:r => r.status==='invalid' },
  { name:'Equal-distance alternatives', start:'a', end:'d', mode:'shortest', graph:mini, expected:'5 m; deterministic a → b → d', check:r => r.distance===5 && r.nodeIds.join(',')==='a,b,d' },
  { name:'Zero-length connection', start:'a', end:'b', mode:'shortest', graph:{...mini,edges:[{...mini.edges[0],distance:0}]}, expected:'0 m; valid connected route', check:r => r.distance===0 && r.edgeIds.length===1 },
  { name:'Closed connection excluded', start:'a', end:'b', mode:'shortest', graph:{...mini,edges:[{...mini.edges[0],traversable:false}]}, expected:'No traversable route', check:r => r.status==='unreachable' },
  { name:'Negative weight rejected', start:'a', end:'b', mode:'shortest', graph:{...mini,edges:[{...mini.edges[0],distance:-1}]}, expected:'Invalid graph', check:r => r.status==='invalid' },
];
export function routeInvariant(graph: HotelGraph, r: RouteResult) {
  if (r.status !== 'found') return r.distance === null && r.edgeIds.length===0 && r.nodeIds.length===0;
  const selected = r.edgeIds.map(id => graph.edges.find(e => e.id===id));
  return r.nodeIds.length===r.edgeIds.length+1 && selected.every((e,i) => e && e.traversable && ((e.from===r.nodeIds[i] && e.to===r.nodeIds[i+1]) || (e.to===r.nodeIds[i] && e.from===r.nodeIds[i+1])) && (r.mode==='shortest' || (e.accessible && e.kind!=='stairs'))) && selected.reduce((sum,e) => sum + e!.distance,0)===r.distance;
}
export function runScenarios() { return scenarios.map(s => { const graph=s.graph??hotel; const result=findRoute(graph,s.start,s.end,s.mode); return { name:s.name, expected:s.expected, mode:s.mode, result, passed:s.check(result) && routeInvariant(graph,result) }; }); }
export const graphIsValid = () => validateGraph(hotel).length===0;
