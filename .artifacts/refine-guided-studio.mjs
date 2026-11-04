import fs from 'node:fs/promises';
const path='src/FloorPlanStudio.tsx';
let source=(await fs.readFile(path,'utf8')).replaceAll('\r\n','\n');
function replace(old,next){if(source.split(old).length!==2)throw new Error(`Expected one ${old}`);source=source.replace(old,next);}
const start=source.indexOf('{misplacedNodes.length>0&&'),end=source.indexOf('</details></>}',start);
if(start<0||end<0)throw new Error('Missing diagnostic block');
const diagnostics=source.slice(start,end);
source=source.slice(0,start)+source.slice(end);
replace('</details></>}\n          <div className="editor-scroll">','</details></>}\n          {stage>=2&&<>'+diagnostics+'</>}\n          <div className="editor-scroll" id="setup-map" tabIndex={-1}>');
replace('<details className="setup-advanced">','<details className="setup-advanced" onToggle={event=>{if(!event.currentTarget.open&&[\'block\',\'open\',\'seed\'].includes(tool))setTool(\'select\');}}>');
replace('<h2>Access review</h2><p className="field-hint">','<p className="field-hint">');
replace("setTool('scale');setScalePoints([]);","setTool('scale');setScalePoints([]);document.getElementById('setup-map')?.scrollIntoView({block:'start'});");
replace('Inspect a node or connection','Inspect a location or path');
replace('<optgroup label="Nodes">','<optgroup label="Locations">');
replace("node?'node and its connections':'connection'","node?'location and its connections':'connection'");
replace('Number(knownDistance)<=0','(!Number.isFinite(Number(knownDistance))||Number(knownDistance)<=0)');
source=source.replaceAll('use Move node','use Move location');
await fs.writeFile(path,source);
