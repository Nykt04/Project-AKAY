import type { BuildingFloor } from './buildings';
import { NODE_CATEGORIES, type ClearanceGrid, type Edge, type MapNode } from './types';
import { type ScanResult } from './scan';
import { traceDraftConnections } from './tracePaths';

const categories: readonly string[] = ['junction', ...NODE_CATEGORIES];
const record=(value:unknown):Record<string,unknown>=>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('The AI returned an invalid graph object. No draft was applied.');
  return value as Record<string,unknown>;
};
const coordinate=(value:unknown,size:number)=>{
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>=1000)throw new Error('The AI returned a location outside the floor plan. No draft was applied.');
  return value*size/1000;
};
const identifier=(value:unknown)=>{
  if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(value))throw new Error('The AI returned an invalid location identifier. No draft was applied.');
  return value;
};

/** AI output is untrusted. It never supplies reviewed/accessibility flags or metric distances. */
export function aiGraphToDraft(value:unknown,floor:BuildingFloor,grid:ClearanceGrid):ScanResult {
  if(grid.imageWidth!==floor.width||grid.imageHeight!==floor.height)throw new Error('The obstacle map does not match this floor image. Scan this floor again before generating paths.');
  const data=record(value);
  if(!Array.isArray(data.nodes)||!Array.isArray(data.edges)||!Array.isArray(data.notes)||data.nodes.length>150||data.edges.length>250||data.notes.length>8)throw new Error('The AI returned an invalid or oversized graph. No draft was applied.');
  const notes=data.notes.map(note=>{if(typeof note!=='string')throw new Error('The AI returned invalid scan notes.');return note.slice(0,400);});
  if(data.nodes.length<2||data.edges.length===0)throw new Error(`The AI could not identify a connected floor plan. ${notes.join(' ')}`);
  const ids=new Set<string>();
  const nodes:MapNode[]=data.nodes.map(value=>{
    const node=record(value),id=identifier(node.id);
    if(ids.has(id))throw new Error('The AI returned duplicate locations. No draft was applied.');ids.add(id);
    if(typeof node.name!=='string'||!node.name.trim()||typeof node.category!=='string'||!categories.includes(node.category)||typeof node.destination!=='boolean')throw new Error('The AI returned an invalid location label or type. No draft was applied.');
    return {id:`f${floor.id}-ai-${id}`,name:node.name.trim().slice(0,70),floor:floor.id,x:coordinate(node.x,floor.width),y:coordinate(node.y,floor.height),category:node.category==='junction'?undefined:node.category as MapNode['category'],facility:node.destination&&node.category!=='junction'};
  });
  const lookup=Object.fromEntries(nodes.map(n=>[n.id,n])),pairs=new Set<string>();
  const edges:Edge[]=data.edges.map((value,i)=>{
    const edge=record(value),from=`f${floor.id}-ai-${identifier(edge.from)}`,to=`f${floor.id}-ai-${identifier(edge.to)}`;
    if(!lookup[from]||!lookup[to]||from===to)throw new Error('The AI returned a connection with invalid endpoints. No draft was applied.');
    const pair=[from,to].sort().join('|');if(pairs.has(pair))throw new Error('The AI returned duplicate connections. No draft was applied.');pairs.add(pair);
    if(!['corridor','stairs','ramp'].includes(String(edge.kind))||!Array.isArray(edge.via)||edge.via.length>30)throw new Error('The AI returned an invalid connection type or path. No draft was applied.');
    const via=edge.via.map(value=>{const point=record(value);return [coordinate(point.x,floor.width),coordinate(point.y,floor.height)] as [number,number];});
    return {id:`f${floor.id}-ai-e${i}`,from,to,kind:edge.kind as Edge['kind'],via,distance:0,accessible:false,reviewed:false,traversable:true};
  });
  const traced=traceDraftConnections(nodes,edges,grid);
  return {nodes,edges:traced.edges,grid,message:`AI proposed ${nodes.length} locations. ${traced.edges.length-traced.blocked} candidate connections follow detected open space; ${traced.repaired} were traced around obstacles. ${traced.blocked?`${traced.blocked} connections could not be traced safely and remain blocked. Move misplaced nodes or map actual doorways before retrying. `:''}All connections need review; distances need calibration.${notes.length?` AI notes (unverified): ${notes.join(' ')}`:''}`};
}

async function requestImage(floor:BuildingFloor):Promise<string> {
  const source=new Image();source.src=floor.image;await source.decode();
  const ratio=Math.min(1,1400/Math.max(source.naturalWidth,source.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(source.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(source.naturalHeight*ratio));
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);
  // Preserve thin wall/door lines in ordinary diagrams. Use JPEG only when the
  // lossless image exceeds the request budget (the obstacle mask stays lossless).
  let image=canvas.toDataURL('image/png');
  if(image.length>2_200_000)image=canvas.toDataURL('image/jpeg',.92);
  if(image.length>2_200_000)throw new Error('This plan is too detailed for AI upload. Export a smaller image, or use the local scan.');
  return image;
}
export async function scanWithAi(floor:BuildingFloor,grid:ClearanceGrid,accessCode:string):Promise<ScanResult> {
  const image=await requestImage(floor);
  let response:Response;
  try{response=await fetch('/api/scan-floor-plan',{method:'POST',headers:{'Content-Type':'application/json','x-scan-code':accessCode},body:JSON.stringify({image,consent:true}),signal:AbortSignal.timeout(65000)});}
  catch{throw new Error('The AI scanner could not be reached or timed out. Check your connection, or use the local scan.');}
  const data=await response.json().catch(()=>{throw new Error('The AI endpoint is unavailable on this host. Use the configured Vercel deployment or the local development server.');});
  if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'AI scanning failed. No draft was applied.');
  const draft=aiGraphToDraft(data.graph,floor,grid);
  if(!draft.edges.some(edge=>edge.traversable))throw new Error('No AI connections could be traced through detected open space. Your existing draft was kept. Try a clearer plan or Local scan, then map actual doorways and correct misplaced nodes.');
  return draft;
}
