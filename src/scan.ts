import type { ClearanceGrid, Edge, MapNode } from './types';
export interface ScanInput {
  width: number; height: number; gray: number[]; imageWidth: number; imageHeight: number;
  threshold: number; padding: number; floor: number; seed?: [number,number];
}
export interface ScanResult { nodes: MapNode[]; edges: Edge[]; grid: ClearanceGrid; message: string; }
const around = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const orthogonal = [[0,1],[1,0],[0,-1],[-1,0]];

/** Segment coverage includes cell boundaries and forbids cutting diagonally across a wall corner. */
export function clearSegment(grid: ClearanceGrid, a: [number,number], b: [number,number]): boolean {
  if(!Number.isInteger(grid.width)||!Number.isInteger(grid.height)||grid.width<1||grid.height<1
    ||!Number.isFinite(grid.imageWidth)||!Number.isFinite(grid.imageHeight)||grid.imageWidth<=0||grid.imageHeight<=0
    ||grid.cells.length!==grid.width*grid.height||![...a,...b].every(Number.isFinite))return false;
  const x0=a[0]*grid.width/grid.imageWidth,y0=a[1]*grid.height/grid.imageHeight;
  const x1=b[0]*grid.width/grid.imageWidth,y1=b[1]*grid.height/grid.imageHeight;
  const dx=x1-x0,dy=y1-y0;
  // A line on a cell boundary touches BOTH cells. Checking only floor(x/y)
  // lets a path run along the blocked side of a wall or start on its corner.
  const free=(x:number,y:number) => {
    const rx=Math.round(x),ry=Math.round(y);
    const xs=Math.abs(x-rx)<1e-7?[rx-1,rx]:[Math.floor(x)];
    const ys=Math.abs(y-ry)<1e-7?[ry-1,ry]:[Math.floor(y)];
    return xs.every(xx=>ys.every(yy=>xx>=0&&yy>=0&&xx<grid.width&&yy<grid.height&&grid.cells[yy*grid.width+xx]===1));
  };
  if(!free(x0,y0)||!free(x1,y1))return false;
  if(!dx&&!dy)return true;
  const times=[0,1];
  if(dx)for(let x=Math.floor(Math.min(x0,x1))+1;x<=Math.max(x0,x1);x++)times.push((x-x0)/dx);
  if(dy)for(let y=Math.floor(Math.min(y0,y1))+1;y<=Math.max(y0,y1);y++)times.push((y-y0)/dy);
  times.sort((a,b)=>a-b);
  for(let i=1;i<times.length;i++){
    if(times[i]-times[i-1]<1e-9)continue;
    const t=(times[i-1]+times[i])/2;
    if(!free(x0+dx*t,y0+dy*t)||(i<times.length-1&&!free(x0+dx*times[i],y0+dy*times[i])))return false;
  }
  return true;
}

export function buildClearanceGrid(input:ScanInput):ClearanceGrid {
  const {width:w,height:h,gray,threshold,padding}=input;
  const cells=new Uint8Array(w*h);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    let free=true;
    for(let oy=-padding;oy<=padding&&free;oy++)for(let ox=-padding;ox<=padding;ox++){
      const xx=x+ox,yy=y+oy;
      if(xx<0||yy<0||xx>=w||yy>=h||gray[yy*w+xx]<threshold){free=false;break;}
    }
    cells[y*w+x]=free?1:0;
  }
  return {width:w,height:h,imageWidth:input.imageWidth,imageHeight:input.imageHeight,cells:[...cells]};
}

export function scanFloor(input: ScanInput): ScanResult {
  const {width:w,height:h,gray,threshold,padding,floor}=input;
  if(w<5||h<5||w*h>40000||gray.length!==w*h)throw new Error('Invalid scan image.');
  const grid=buildClearanceGrid(input), cells=Uint8Array.from(grid.cells);
  const seen=new Uint8Array(cells.length),components:number[][]=[];
  for(let i=0;i<cells.length;i++)if(cells[i]&&!seen[i]){
    const queue=[i];seen[i]=1;
    for(let p=0;p<queue.length;p++){
      const pos=queue[p],x=pos%w,y=Math.floor(pos/w);
      for(const [dx,dy] of orthogonal){
        const xx=x+dx,yy=y+dy,j=yy*w+xx;
        if(xx>=0&&yy>=0&&xx<w&&yy<h&&cells[j]&&!seen[j]){seen[j]=1;queue.push(j);}
      }
    }
    components.push(queue);
  }
  let region:number[]|undefined;
  if(input.seed){
    const sx=Math.floor(input.seed[0]*w/input.imageWidth),sy=Math.floor(input.seed[1]*h/input.imageHeight);
    region=sx>=0&&sx<w&&sy>=0&&sy<h?components.find(c=>c.includes(sy*w+sx)):undefined;
    if(!region)throw new Error('That point is on a detected wall. Choose a clear corridor or lower the wall threshold.');
  }else{
    const internal=components.filter(c=>!c.some(i=>i%w<=1||i%w>=w-2||Math.floor(i/w)<=1||Math.floor(i/w)>=h-2));
    region=internal.sort((a,b)=>b.length-a.length)[0];
    if(!region)throw new Error('No enclosed walking area detected. Select a corridor on the plan, then scan again.');
  }
  if(region.length<12)throw new Error('This area is too small. Choose a corridor or adjust the scan settings.');
  // Keep all detected free space available for staff corrections; skeletonize just the chosen component.
  const skeleton=new Uint8Array(w*h);for(const i of region)skeleton[i]=1;
  const offsets=around.map(([dx,dy])=>dy*w+dx),n=new Uint8Array(8);
  for(let iteration=0;iteration<200;iteration++){
    let removed=0;
    for(let pass=0;pass<2;pass++){
      const erase:number[]=[];
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        const i=y*w+x;if(!skeleton[i])continue;
        let total=0,transitions=0;
        for(let k=0;k<8;k++){n[k]=skeleton[i+offsets[k]];total+=n[k];}
        for(let k=0;k<8;k++)if(!n[k]&&n[(k+1)%8])transitions++;
        if(total<2||total>6||transitions!==1)continue;
        const valid=pass===0?!(n[0]*n[2]*n[4])&&!(n[2]*n[4]*n[6]):!(n[0]*n[2]*n[6])&&!(n[0]*n[4]*n[6]);
        if(valid)erase.push(i);
      }
      for(const i of erase)skeleton[i]=0;removed+=erase.length;
    }
    if(!removed)break;
  }
  const point=(i:number):[number,number]=>[(i%w+.5)*input.imageWidth/w,(Math.floor(i/w)+.5)*input.imageHeight/h];
  // The skeleton is now immutable. Reuse these geometry checks during degree
  // detection, component traversal and edge tracing, only within this scan.
  const neighborCache = new Map<number, number[]>();
  const neighbors=(i:number)=>{
    const cached=neighborCache.get(i);
    if(cached)return cached;
    const x=i%w,y=Math.floor(i/w),origin=point(i),adjacent:number[]=[];
    for(const [dx,dy] of around){
      const xx=x+dx,yy=y+dy,j=yy*w+xx;
      if(xx>=0&&yy>=0&&xx<w&&yy<h&&skeleton[j]&&clearSegment(grid,origin,point(j)))adjacent.push(j);
    }
    neighborCache.set(i,adjacent);
    return adjacent;
  };
  const pixels=[...skeleton.keys()].filter(i=>skeleton[i]);
  const keys=new Set(pixels.filter(i=>neighbors(i).length!==2));
  // A closed ring still needs graph vertices.
  const visited=new Set<number>();
  for(const first of pixels)if(!visited.has(first)){
    const queue=[first];visited.add(first);let hasKey=false;
    for(let p=0;p<queue.length;p++){const i=queue[p];hasKey ||= keys.has(i);for(const j of neighbors(i))if(!visited.has(j)){visited.add(j);queue.push(j);}}
    if(!hasKey){keys.add(queue[0]);keys.add(queue[Math.floor(queue.length/2)]);}
  }
  const nodes:MapNode[]=[...keys].map((i,k)=>({id:`f${floor}-n${i}`,name:`Junction ${k+1}`,floor,x:point(i)[0],y:point(i)[1]}));
  const walked=new Set<string>(),edges:Edge[]=[];
  const mark=(a:number,b:number)=>`${Math.min(a,b)}:${Math.max(a,b)}`;
  for(const start of keys)for(const neighbor of neighbors(start)){
    if(walked.has(mark(start,neighbor)))continue;
    const chain=[start];let previous=start,current=neighbor;
    walked.add(mark(previous,current));
    for(let guard=0;guard<pixels.length;guard++){
      chain.push(current);if(keys.has(current))break;
      const next=neighbors(current).find(j=>j!==previous);if(next===undefined)break;
      previous=current;current=next;walked.add(mark(previous,current));
    }
    if(!keys.has(current)||current===start)continue;
    const path=chain.map(point);
    const distance=path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);
    edges.push({id:`f${floor}-e${edges.length}`,from:`f${floor}-n${start}`,to:`f${floor}-n${current}`,distance,kind:'corridor',accessible:false,traversable:true,reviewed:false,via:path.slice(1,-1)});
  }
  if(!edges.length)throw new Error('No usable pathways were found. Try another corridor seed or a clearer plan. You can also draw connections manually.');
  if(nodes.length>600)throw new Error('This plan produced too much detail. Increase wall padding or upload a cleaner drawing.');
  return {nodes,edges,grid,message:`Detected ${nodes.length} candidate nodes and ${edges.length} connections. Review rooms, doorways and access conditions before use.`};
}
