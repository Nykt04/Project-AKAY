import fs from 'node:fs/promises';
const path='src/FloorPlanStudio.tsx',source=await fs.readFile(path,'utf8');
const before='{stage===2&&<><details className="coordinate-editor">';
if(source.split(before).length!==2)throw new Error('Missing coordinate editor');
await fs.writeFile(path,source.replace(before,'{(stage===2||(stage===1&&tool===\'seed\'))&&<><details className="coordinate-editor">'));
