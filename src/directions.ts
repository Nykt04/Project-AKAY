import { edgeById, floorName, nodeById } from './hotel';
import type { FloorId, PathKind, RouteResult } from './types';
export interface Direction { title: string; detail: string; floor: FloorId; distance: number; kind: PathKind | 'start' | 'arrive'; }
export function routeFeatures(route: RouteResult): string {
  if (route.status !== 'found') return route.status === 'unreachable' ? 'No suitable route' : 'Select both locations';
  if (route.distance===0) return 'Already at your destination';
  const kinds = new Set(route.edgeIds.map(id => edgeById[id]?.kind));
  return [kinds.has('stairs') ? 'Includes steps' : '', kinds.has('elevator') ? 'Via elevator' : '', kinds.has('ramp') ? 'Via ramp' : ''].filter(Boolean).join(' · ') || 'Level corridors';
}
export function routeDirections(route: RouteResult): Direction[] {
  if(route.status!=='found') return [];
  const first=nodeById[route.nodeIds[0]], last=nodeById[route.nodeIds.at(-1)!];
  if(route.distance===0) return [{title:`You are already at ${last.name.toLowerCase()}.`,detail:floorName(last.floor),floor:last.floor,distance:0,kind:'arrive'}];
  const directions: Direction[]=[{title:`From ${first.name.toLowerCase()}`,detail:`Start on the ${floorName(first.floor).toLowerCase()}.`,floor:first.floor,distance:0,kind:'start'}];
  let corridorDistance=0;
  const flush=(destination: string) => {if(corridorDistance){ const n=nodeById[destination];directions.push({title:`Continue to ${n.name.toLowerCase()}`,detail:`Follow the corridor for ${corridorDistance} m.`,floor:n.floor,distance:corridorDistance,kind:'corridor'});corridorDistance=0;}};
  route.edgeIds.forEach((id,i)=>{
    const edge=edgeById[id], from=nodeById[route.nodeIds[i]], to=nodeById[route.nodeIds[i+1]];
    if(edge.kind==='corridor'){corridorDistance+=edge.distance;return;}
    flush(from.id);
    const crossFloor=from.floor!==to.floor;
    directions.push({title:edge.kind==='elevator'?`Take the elevator to the ${floorName(to.floor).toLowerCase()}`:edge.kind==='stairs'?crossFloor?`Take the stairs to the ${floorName(to.floor).toLowerCase()}`:'Use the short flight of steps':'Take the ramp',detail:edge.kind==='elevator'?`${edge.distance} m of mapped vertical travel.`:`${edge.distance} m · ${crossFloor?`${floorName(from.floor)} to ${floorName(to.floor)}`:floorName(to.floor)}`,floor:to.floor,distance:edge.distance,kind:edge.kind});
  });
  flush(last.id);
  const final=directions.at(-1)!;
  if(final.kind==='corridor'){final.title=`Arrive at ${last.name.toLowerCase()}`;final.detail=`Continue ${final.distance} m to your destination.`;final.kind='arrive';}
  return directions;
}
