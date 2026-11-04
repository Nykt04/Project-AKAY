import type { Building } from './buildings';

export const setupStages = [
  {title:'Place & floors',heading:'Start with your place.',help:'Name your establishment and add a clear floor plan for each floor.'},
  {title:'Find paths',heading:'Find the paths on your plan.',help:'Choose a scanning method. You will check the result before anyone uses it.'},
  {title:'Check the map',heading:'Make the map match your building.',help:'Check location names and doorways, then set the distance scale using a measurement you know.'},
  {title:'Review access',heading:'Check who can use each path.',help:'Confirm the real access conditions on every floor before opening visitor navigation.'},
] as const;
export type SetupStage = 0|1|2|3;

export function setupReadiness(building:Building) {
  const floorsReady=!!building.name.trim()&&building.floors.length>0&&building.floors.every(f=>f.name.trim());
  const pathsReady=building.graph.edges.length>0&&building.floors.every(f=>building.graph.nodes.some(n=>n.floor===f.id));
  const scaleReady=building.floors.length>0&&building.floors.every(f=>Number.isFinite(f.metersPerPixel)&&f.metersPerPixel! > 0);
  const labelsReady=building.graph.nodes.filter(n=>n.facility&&n.name.trim()).length>=2;
  return {floorsReady,pathsReady,scaleReady,labelsReady,canReview:floorsReady&&pathsReady&&scaleReady&&labelsReady};
}

export function initialSetupStage(building:Building):SetupStage {
  const ready=setupReadiness(building);
  if(!ready.floorsReady)return 0;
  if(!ready.pathsReady)return 1;
  if(building.status==='ready')return 3;
  return 2;
}
