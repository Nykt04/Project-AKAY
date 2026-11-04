import fs from 'node:fs/promises';
const path='src/FloorPlanStudio.tsx';
let source=await fs.readFile(path,'utf8');
const old='{edges.map(e=><polyline';
if(source.split(old).length!==2)throw new Error('Expected one edge renderer');
source=source.replace(old,'{edges.filter(e=>e.traversable||showBlocked||selected===e.id).map(e=><polyline');
await fs.writeFile(path,source);
