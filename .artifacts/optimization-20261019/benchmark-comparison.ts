import { performance } from 'node:perf_hooks';
import { findRoute } from '../src/routing';
import { scanFloor } from '../src/scan';
import type { HotelGraph } from '../src/types';

// Deterministic synthetic workloads. These are software benchmarks, not
// participant results, live AI latency or surveyed building measurements.
const graph: HotelGraph = {
  nodes: Array.from({length:500},(_,i)=>({id:`n${i}`,name:`Node ${i}`,floor:0,x:i,y:0})),
  edges: [],
};
for (let i=0;i<500;i++) for (const stride of [1,7,23]) if (i+stride<500) {
  graph.edges.push({id:`${i}-${stride}`,from:`n${i}`,to:`n${i+stride}`,distance:stride,
    kind:'corridor',accessible:true,traversable:true,reviewed:true});
}
const width=144,height=120;
const input={width,height,imageWidth:1440,imageHeight:1200,threshold:155,padding:0,floor:0,
  gray:Array.from({length:width*height},(_,i)=>{
    const x=i%width,y=Math.floor(i/width);
    return x>=10&&x<=130&&y>=10&&y<=22||x>=118&&x<=130&&y>=10&&y<=105?255:0;
  })};
const summarize=(values:number[])=>{
  const sorted=[...values].sort((a,b)=>a-b);
  return {medianMs:Number(((sorted[14]+sorted[15])/2).toFixed(3)),p95Ms:Number(sorted[28].toFixed(3))};
};
function measure(run:()=>void) {
  for(let i=0;i<5;i++)run();
  return Array.from({length:30},()=>{const start=performance.now();run();return performance.now()-start;});
}
async function benchmark() {
  let route=findRoute,scan=scanFloor;
  // Optional local snapshots let the identical harness compare before/after.
  if(process.argv[2]==='before') {
    route=(await import('../.artifacts/optimization-20261019/routing-before')).findRoute;
    scan=(await import('../.artifacts/optimization-20261019/scan-before')).scanFloor;
  }
  const routing=measure(()=>{
    const result=route(graph,'n0','n499','accessible');
    if(result.status!=='found'||result.distance!==499)throw new Error('Incorrect benchmark route');
  });
  const scanning=measure(()=>{const result=scan(input);if(!result.edges.length)throw new Error('Empty scan');});
  console.log(JSON.stringify({version:process.argv[2]??'current',node:process.version,runs:30,warmups:5,
    graph:{nodes:graph.nodes.length,edges:graph.edges.length},routing:summarize(routing),
    scan:{width,height,...summarize(scanning)}},null,2));
}
await benchmark();
