import { formatDistance } from './format';
import { hotel, floors as sampleFloors } from './hotel';
import type { HotelGraph, FloorId, MapNode, PathKind, RouteResult } from './types';
/** `edgeIds` lists the route connections covered by a step, so the map can highlight that segment. */
export interface Direction { title: string; detail: string; floor: FloorId; distance: number; kind: PathKind | 'start' | 'arrive'; edgeIds: string[]; }
export function routeFeatures(route: RouteResult, graph: HotelGraph = hotel): string {
  if (route.status !== 'found') return route.status === 'unreachable' ? 'No suitable route' : 'Select both locations';
  if (route.distance===0) return 'Already at your destination';
  const edgeById = Object.fromEntries(graph.edges.map(e=>[e.id,e]));
  const kinds = new Set(route.edgeIds.map(id => edgeById[id]?.kind));
  return [kinds.has('stairs') ? 'Includes steps' : '', kinds.has('elevator') ? 'Via elevator' : '', kinds.has('ramp') ? 'Via ramp' : ''].filter(Boolean).join(' · ') || 'Level corridors';
}
/**
 * ============================================================================
 * [ALGORITHM OUTPUT TRANSLATION: TURN-BY-TURN DIRECTIONS]
 * Converts Dijkstra's settled `nodeIds` and `edgeIds` into human-readable
 * navigation steps (corridor merges, ramp/stair calls, and floor transfers).
 * ============================================================================
 */
export function routeDirections(route: RouteResult, graph: HotelGraph = hotel, floors: readonly {id:number;name:string}[] = sampleFloors): Direction[] {
  if(route.status!=='found') return [];
  const nodeById=Object.fromEntries(graph.nodes.map(n=>[n.id,n])), edgeById=Object.fromEntries(graph.edges.map(e=>[e.id,e]));
  const floorName=(id:number)=>floors.find(f=>f.id===id)?.name??'Unknown floor';
  const first=nodeById[route.nodeIds[0]], last=nodeById[route.nodeIds.at(-1)!];
  if(route.distance===0) return [{title:`You are already at ${last.name.toLowerCase()}.`,detail:floorName(last.floor),floor:last.floor,distance:0,kind:'arrive',edgeIds:[]}];
  const directions: Direction[]=[{title:`From ${first.name.toLowerCase()}`,detail:`Start on the ${floorName(first.floor).toLowerCase()}.`,floor:first.floor,distance:0,kind:'start',edgeIds:[]}];
  let corridorDistance=0, corridorEdges:string[]=[];
  const flush=(destination: string) => {if(!corridorDistance){corridorEdges=[];return;} const n=nodeById[destination];directions.push({title:`Continue to ${n.name.toLowerCase()}`,detail:`Follow the corridor for ${formatDistance(corridorDistance)} m.`,floor:n.floor,distance:corridorDistance,kind:'corridor',edgeIds:corridorEdges});corridorDistance=0;corridorEdges=[];};
  let vertical:{kind:'elevator'|'stairs';fromNode:MapNode;startFloor:FloorId;toNode:MapNode;distance:number;edgeIds:string[]}|null=null;
  const flushVertical=()=>{
    if(!vertical)return;
    const {kind,fromNode,startFloor,toNode,distance,edgeIds}=vertical;
    const generic=/^(elevator|lift|stairs|stairwell|staircase)$/i.test(fromNode.name.trim());
    const specific=!generic&&(fromNode.category===kind||/elevator|lift|stair|escalator/i.test(fromNode.name));
    const label=specific?fromNode.name.toLowerCase():kind==='elevator'?'the elevator':'the stairs';
    directions.push({
      title:`Take ${label} to the ${floorName(toNode.floor).toLowerCase()}`,
      detail:kind==='elevator'?`${formatDistance(distance)} m of mapped vertical travel.`:`${formatDistance(distance)} m · ${floorName(startFloor)} to ${floorName(toNode.floor)}`,
      floor:toNode.floor,
      distance,
      kind,
      edgeIds,
    });
    vertical=null;
  };
  route.edgeIds.forEach((id,i)=>{
    const edge=edgeById[id], from=nodeById[route.nodeIds[i]], to=nodeById[route.nodeIds[i+1]];
    if(edge.kind==='corridor'){flushVertical();corridorDistance=Math.round((corridorDistance+edge.distance)*100)/100;corridorEdges.push(id);return;}
    flush(from.id);
    const crossFloor=from.floor!==to.floor;
    if(crossFloor&&(edge.kind==='elevator'||edge.kind==='stairs')){
      if(vertical&&vertical.kind===edge.kind&&vertical.toNode.id===from.id){
        vertical.toNode=to;
        vertical.distance=Math.round((vertical.distance+edge.distance)*100)/100;
        vertical.edgeIds.push(id);
      }else{
        flushVertical();
        vertical={kind:edge.kind,fromNode:from,startFloor:from.floor,toNode:to,distance:edge.distance,edgeIds:[id]};
      }
      return;
    }
    flushVertical();
    directions.push({title:edge.kind==='elevator'?`Take the elevator to the ${floorName(to.floor).toLowerCase()}`:edge.kind==='stairs'?'Use the short flight of steps':'Take the ramp',detail:edge.kind==='elevator'?`${formatDistance(edge.distance)} m of mapped vertical travel.`:`${formatDistance(edge.distance)} m · ${floorName(to.floor)}`,floor:to.floor,distance:edge.distance,kind:edge.kind,edgeIds:[id]});
  });
  flush(last.id);
  flushVertical();
  const final=directions.at(-1)!;
  if(final.kind==='corridor'){final.title=`Arrive at ${last.name.toLowerCase()}`;final.detail=`Continue ${formatDistance(final.distance)} m to your destination.`;final.kind='arrive';}
  return directions;
}
