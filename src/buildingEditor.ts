import type { Building, BuildingFloor } from './buildings';
import type { Edge, HotelGraph } from './types';
import { edgeGeometry } from './geometry';
import { validateGraph } from './routing';
import type { ScanInput } from './scan';
import { clearSegment } from './scan';

export function connectionError(graph:HotelGraph,fromId:string,toId:string,floorId:number):string|null {
  const from=graph.nodes.find(n=>n.id===fromId),to=graph.nodes.find(n=>n.id===toId);
  if(!from||!to||from.floor!==floorId||to.floor!==floorId)return 'Select two existing nodes on this floor. Use Connect floors for elevator or stair transitions.';
  if(from.id===to.id)return 'Choose two different nodes.';
  if(graph.edges.some(e=>(e.from===from.id&&e.to===to.id)||(e.from===to.id&&e.to===from.id)))return 'These nodes already have a connection. Inspect it to change its access condition.';
  const grid=graph.clearanceGrids?.[floorId];
  if(!grid||!clearSegment(grid,[from.x,from.y],[to.x,to.y]))return 'This connection crosses a detected wall. Add a turning point, or correct an actual doorway using Open doorway.';
  return null;
}

export const freshBuilding = (): Building => ({id:crypto.randomUUID(),name:'New establishment',floors:[],graph:{nodes:[],edges:[],clearanceGrids:{}},status:'draft',updatedAt:new Date().toISOString()});
export function calibratedGraph(graph: HotelGraph, floors: BuildingFloor[]): HotelGraph {
  const nodes=Object.fromEntries(graph.nodes.map(n=>[n.id,n]));
  return {...graph,edges:graph.edges.map(edge=>{
    if(nodes[edge.from]?.floor!==nodes[edge.to]?.floor)return edge;
    const floor=floors.find(f=>f.id===nodes[edge.from]?.floor);
    const points=edgeGeometry(edge,nodes);
    const pixels=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
    return {...edge,distance:Math.round(pixels*(floor?.metersPerPixel??1)*100)/100};
  })};
}
export function activationErrors(building: Building): string[] {
  const errors:string[]=[];
  if(!building.name.trim())errors.push('Give this establishment a name.');
  if(!building.floors.length)errors.push('Upload at least one floor plan.');
  for(const floor of building.floors){
    if(!floor.name.trim())errors.push('Give every floor a name.');
    if(!building.graph.clearanceGrids?.[floor.id])errors.push(`Missing obstacle mask for ${floor.name}. Upload this plan again.`);
    if(!floor.metersPerPixel||!Number.isFinite(floor.metersPerPixel)||floor.metersPerPixel<=0)errors.push(`Calibrate the distance scale for ${floor.name}.`);
    if(!building.graph.nodes.some(n=>n.floor===floor.id))errors.push(`Add or scan nodes on ${floor.name}.`);
  }
  for(const node of building.graph.nodes){
    if(!building.floors.some(f=>f.id===node.floor))errors.push(`Unknown floor for ${node.name}.`);
    if(node.category==='room'&&building.graph.edges.filter(e=>e.traversable&&(e.from===node.id||e.to===node.id)).length>1)errors.push(`${node.name}: guest rooms must be terminal destinations, not corridor shortcuts.`);
    if(node.facility&&!node.name.trim())errors.push('Give every guest destination a name.');
  }
  if(building.graph.nodes.filter(n=>n.facility&&n.name.trim()).length<2)errors.push('Label at least two destination nodes.');
  if(!building.graph.edges.some(e=>e.traversable))errors.push('Add at least one usable connection.');
  if(building.graph.edges.some(e=>e.reviewed!==true))errors.push('Review every connection, including its accessibility or blocked status.');
  errors.push(...validateGraph(building.graph));
  return [...new Set(errors)];
}
export function reviewEdge(edge: Edge, access: 'unknown'|'accessible'|'standard'|'blocked'): Edge {
  return {...edge,reviewed:access!=='unknown',accessible:access==='accessible'&&edge.kind!=='stairs',traversable:access!=='blocked'};
}
export async function readFloorImage(file: File, id: number): Promise<{floor:BuildingFloor;scan:Pick<ScanInput,'width'|'height'|'gray'|'imageWidth'|'imageHeight'>}> {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPG or WebP floor plan. PDF and CAD files need to be exported as an image first.');
  if(file.size>12*1024*1024)throw new Error('Choose an image smaller than 12 MB.');
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();image.src=url;await image.decode();
    if(image.naturalWidth*image.naturalHeight>40000000)throw new Error('This image is too large. Export a smaller plan (under 40 megapixels).');
    const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
    const width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);
    return {floor:{id,name:`Floor ${id+1}`,short:String(id+1),description:'Uploaded floor plan',image:canvas.toDataURL('image/png'),width,height},scan:rasterData(ctx,width,height)};
  }finally{URL.revokeObjectURL(url);}
}
export function rasterData(ctx: CanvasRenderingContext2D,width:number,height:number) {
  const ratio=Math.min(1,144/Math.max(width,height)),w=Math.max(5,Math.round(width*ratio)),h=Math.max(5,Math.round(height*ratio));
  const pixels=ctx.getImageData(0,0,width,height).data,gray:number[]=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let darkest=255;
    for(let yy=Math.floor(y*height/h);yy<Math.ceil((y+1)*height/h);yy++)for(let xx=Math.floor(x*width/w);xx<Math.ceil((x+1)*width/w);xx++){
      const p=(yy*width+xx)*4;darkest=Math.min(darkest,.2126*pixels[p]+.7152*pixels[p+1]+.0722*pixels[p+2]);
    }
    gray.push(darkest);
  }
  return {width:w,height:h,gray,imageWidth:width,imageHeight:height};
}
export async function floorRaster(floor:BuildingFloor){
  const image=new Image();image.src=floor.image;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=floor.width;canvas.height=floor.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
  return rasterData(ctx,floor.width,floor.height);
}
