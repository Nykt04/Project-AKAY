import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {aiGraphToDraft} from '../src/aiScan';
import {buildClearanceGrid} from '../src/scan';
import {findRoute} from '../src/routing';
const data=JSON.parse(await fs.readFile('.artifacts/live-ai-result.json','utf8'));
const mask=JSON.parse(await fs.readFile('.artifacts/live-ai-mask.json','utf8'));
const floor={id:0,name:'Sample ground floor',short:'G',description:'Live AI test',image:'',width:mask.imageWidth,height:mask.imageHeight};
const draft=aiGraphToDraft(data.graph,floor,buildClearanceGrid(mask));
assert.ok(draft.edges.every(e=>e.reviewed===false&&e.accessible===false));
const graph={nodes:draft.nodes,edges:draft.edges,clearanceGrids:{0:draft.grid}};
let attempts=0;
for(const a of draft.nodes)for(const b of draft.nodes){
 if(a.id===b.id)continue;
 for(const mode of ['shortest','accessible'] as const){assert.notEqual(findRoute(graph,a.id,b.id,mode).status,'found');attempts++;}
}
const result={model:data.model,locations:draft.nodes.length,connections:draft.edges.length,blockedConnections:draft.edges.filter(e=>!e.traversable).length,unreviewedConnections:draft.edges.filter(e=>!e.reviewed).length,accessibleConnections:draft.edges.filter(e=>e.accessible).length,preReviewRoutingChecks:attempts,labels:draft.nodes.filter(n=>n.facility).map(n=>n.name),message:draft.message};
await fs.writeFile('.artifacts/live-ai-verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
