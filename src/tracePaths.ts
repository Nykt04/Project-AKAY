import type { ClearanceGrid, Edge, MapNode } from './types';
import { clearSegment } from './scan';
import { edgeGeometry } from './geometry';

type Point = [number, number];
type Entry = {cell:number;cost:number;score:number};

/** Four-neighbor A*: never erases walls, snaps endpoints or cuts diagonal corners. */
export function traceOpenPath(grid:ClearanceGrid,start:Point,end:Point):Point[]|null {
  const {width:w,height:h,imageWidth:iw,imageHeight:ih,cells}=grid;
  if(!clearSegment(grid,start,start)||!clearSegment(grid,end,end))return null;
  if(clearSegment(grid,start,end))return [start,end];
  const sx=iw/w,sy=ih/h;
  const cell=(p:Point)=>Math.floor(p[1]/sy)*w+Math.floor(p[0]/sx);
  const center=(i:number):Point=>[(i%w+.5)*sx,(Math.floor(i/w)+.5)*sy];
  const first=cell(start),last=cell(end);
  if(!clearSegment(grid,start,center(first))||!clearSegment(grid,center(last),end))return null;
  const heuristic=(i:number)=>Math.abs(i%w-last%w)*sx+Math.abs(Math.floor(i/w)-Math.floor(last/w))*sy;
  // Reject large unexplained detours. Staff must map additional corridor junctions.
  const limit=Math.hypot(end[0]-start[0],end[1]-start[1])*3+4*Math.max(sx,sy);
  const cost=new Float64Array(w*h).fill(Infinity),parent=new Int32Array(w*h).fill(-1);
  const heap:Entry[]=[];
  const push=(entry:Entry)=>{
    let index=heap.length;heap.push(entry);
    while(index){const p=(index-1)>>1;if(heap[p].score<=entry.score)break;heap[index]=heap[p];index=p;}
    heap[index]=entry;
  };
  const pop=()=>{
    const top=heap[0],tail=heap.pop()!;
    if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].score<heap[child].score)child++;if(heap[child].score>=tail.score)break;heap[i]=heap[child];i=child;}heap[i]=tail;}
    return top;
  };
  cost[first]=0;push({cell:first,cost:0,score:heuristic(first)});
  while(heap.length){
    const item=pop(),i=item.cell;if(item.cost!==cost[i])continue;
    if(i===last){
      const indices:number[]=[];for(let at=last;at!==-1;at=parent[at])indices.push(at);
      const raw:Point[]=[start,...indices.reverse().map(center),end],path:Point[]=[start];
      // Shorten only across segments certified against the unchanged obstacle mask.
      for(let at=0;at<raw.length-1;){let next=raw.length-1;while(next>at+1&&!clearSegment(grid,raw[at],raw[next]))next--;path.push(raw[next]);at=next;}
      return path;
    }
    const x=i%w,y=Math.floor(i/w);
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
      const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;
      const next=yy*w+xx;if(cells[next]!==1)continue;
      const nextCost=item.cost+(dx?sx:sy);
      if(nextCost>=cost[next]||nextCost+heuristic(next)>limit)continue;
      cost[next]=nextCost;parent[next]=i;push({cell:next,cost:nextCost,score:nextCost+heuristic(next)});
    }
  }
  return null;
}

/** Repair draft geometry only. Permission/accessibility always require a new review. */
export function traceDraftConnections(nodes:MapNode[],edges:Edge[],grid:ClearanceGrid,topology=edges) {
  const lookup=Object.fromEntries(nodes.map(n=>[n.id,n]));
  const degree=new Map<string,number>();
  for(const e of topology){degree.set(e.from,(degree.get(e.from)??0)+1);degree.set(e.to,(degree.get(e.to)??0)+1);}
  const rooms=new Set(nodes.filter(n=>n.category==='room'||(n.facility&&!['entrance','stairs','elevator'].includes(n.category??''))).map(n=>n.id));
  const roomCells=nodes.filter(n=>rooms.has(n.id)).map(n=>({id:n.id,cell:Math.floor(n.y*grid.height/grid.imageHeight)*grid.width+Math.floor(n.x*grid.width/grid.imageWidth)}));
  const guardedCells=[...grid.cells],guarded:ClearanceGrid={...grid,cells:guardedCells};
  let repaired=0;
  const result=edges.map(edge=>{
    const pending={...edge,reviewed:false,accessible:false};
    // All room/facility destinations are terminal, regardless of the model's category.
    if([edge.from,edge.to].some(id=>rooms.has(id)&&(degree.get(id)??0)>1))return {...pending,traversable:false};
    const from=lookup[edge.from],to=lookup[edge.to];
    if(!from||!to||from.floor!==to.floor)return {...pending,traversable:false};
    const proposed=edgeGeometry(edge,lookup);
    // Preserve model-supplied doorway/turn anchors; never reroute past a missing door.
    const path:Point[]=[proposed[0]];
    for(let i=1;i<proposed.length;i++){
      const leg=traceOpenPath(grid,proposed[i-1],proposed[i]);
      if(!leg)return {...pending,traversable:false};
      path.push(...leg.slice(1));
    }
    // Do not use any other labeled destination as an intermediate path point.
    const blockedIdx:number[]=[];
    for(const r of roomCells)if(r.id!==edge.from&&r.id!==edge.to&&guardedCells[r.cell]){guardedCells[r.cell]=0;blockedIdx.push(r.cell);}
    const crossesOtherRoom=path.slice(1).some((p,i)=>!clearSegment(guarded,path[i],p));
    for(const idx of blockedIdx)guardedCells[idx]=grid.cells[idx];
    if(crossesOtherRoom)return {...pending,traversable:false};
    if(!proposed.slice(1).every((p,i)=>clearSegment(grid,proposed[i],p)))repaired++;
    const distance=path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);
    return {...pending,traversable:true,via:path.slice(1,-1),distance};
  });
  return {edges:result,repaired,blocked:result.filter(e=>!e.traversable).length};
}
