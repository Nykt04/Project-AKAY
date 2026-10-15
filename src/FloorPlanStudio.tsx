import { useEffect, useRef, useState } from 'react';
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple';
import { Scan } from '@phosphor-icons/react/dist/csr/Scan';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { Info } from '@phosphor-icons/react/dist/csr/Info';
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { type Building, saveBuilding } from './buildings';
import { activationErrors, calibratedGraph, connectionError, floorRaster, readFloorImage, reviewEdge } from './buildingEditor';
import { buildClearanceGrid, clearSegment, type ScanResult } from './scan';
import { edgeGeometry } from './geometry';
import type { Edge, MapNode, PathKind } from './types';
import { scanWithAi } from './aiScan';

type Tool = 'select'|'seed'|'scale'|'add'|'connect'|'move'|'block'|'open';
const categories:NonNullable<MapNode['category']>[]=['facility','entrance','room','restroom','elevator','stairs','dining','reception','lounge','conference','fitness'];
const tools: {id:Tool;label:string;help:string}[] = [
  {id:'select',label:'Select',help:'Select a node or a connection to inspect and edit it.'},
  {id:'seed',label:'Corridor seed',help:'Local scan only: click inside a clear corridor, then scan. Only its connected walking area will be traced.'},
  {id:'scale',label:'Set scale',help:'Click two points with a known real-world distance, then enter that distance in meters.'},
  {id:'add',label:'Add node',help:'Click on clear space to add a junction or destination. Use intermediate nodes to turn around corners.'},
  {id:'connect',label:'Connect',help:'Select two nodes to connect them. Straight connections through detected walls are rejected.'},
  {id:'move',label:'Move node',help:'Select a node first, then click its corrected position. Its connections will need review again.'},
  {id:'block',label:'Block area',help:'Paint detected free space as a wall or obstacle. Connections crossing it must be removed or corrected.'},
  {id:'open',label:'Open doorway',help:'Correct a falsely detected wall by painting an actual doorway. This changes the scan mask, not accessibility status.'},
];

export function FloorPlanStudio({initial,onSaved,onUse,onSaving}:{initial:Building;onSaved:(b:Building)=>void;onUse:(b:Building)=>void;onSaving:(saving:boolean)=>void}) {
  const [draft,setDraft]=useState(initial),[floorId,setFloorId]=useState(initial.floors[0]?.id??0);
  const [tool,setTool]=useState<Tool>('select'),[selected,setSelected]=useState(''),[seed,setSeed]=useState<[number,number]>();
  const [scalePoints,setScalePoints]=useState<[number,number][]>([]),[knownDistance,setKnownDistance]=useState('');
  const [threshold,setThreshold]=useState(155),[padding,setPadding]=useState(0),[busy,setBusy]=useState(false);
  const [message,setMessage]=useState(''),[errors,setErrors]=useState<string[]>([]),[saveState,setSaveState]=useState('Saved in this browser');
  const [reviewChecked,setReviewChecked]=useState(false),[replaceChecked,setReplaceChecked]=useState(false),[showMask,setShowMask]=useState(false);
  const [linkFrom,setLinkFrom]=useState(''),[linkTo,setLinkTo]=useState(''),[linkKind,setLinkKind]=useState<'elevator'|'stairs'>('elevator'),[linkDistance,setLinkDistance]=useState(''),[linkAccessible,setLinkAccessible]=useState(false);
  const [zoom,setZoom]=useState(1),[revision,setRevision]=useState(0);
  const [pointX,setPointX]=useState(''),[pointY,setPointY]=useState(''),[connectTo,setConnectTo]=useState('');
  const [persistedAt,setPersistedAt]=useState(initial.updatedAt);
  const [scanMethod,setScanMethod]=useState<'local'|'ai'>('ai'),[scanCode,setScanCode]=useState(''),[aiConsent,setAiConsent]=useState(false);
  const history=useRef<Building[]>([]),worker=useRef<Worker|null>(null),saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null),saveQueue=useRef(Promise.resolve()),latestSaved=useRef(initial.updatedAt);
  const floor=draft.floors.find(f=>f.id===floorId),nodes=draft.graph.nodes.filter(n=>n.floor===floorId),lookup=Object.fromEntries(draft.graph.nodes.map(n=>[n.id,n]));
  const edges=draft.graph.edges.filter(e=>lookup[e.from]?.floor===floorId&&lookup[e.to]?.floor===floorId),grid=draft.graph.clearanceGrids?.[floorId];
  const node=draft.graph.nodes.find(n=>n.id===selected),edge=draft.graph.edges.find(e=>e.id===selected);
  const connectors=draft.graph.nodes.filter(n=>n.category==='stairs'||n.category==='elevator');
  const unreviewed=draft.graph.edges.filter(e=>e.reviewed!==true).length;
  const currentRevision=useRef(draft.updatedAt);currentRevision.current=draft.updatedAt;
  const currentDraft=useRef(draft);currentDraft.current=draft;
  useEffect(()=>{onSaving(busy||draft.updatedAt!==persistedAt);},[busy,draft.updatedAt,persistedAt,onSaving]);
  useEffect(()=>{
    const beforeUnload=(event:BeforeUnloadEvent)=>{if(busy||draft.updatedAt!==persistedAt){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',beforeUnload);return()=>window.removeEventListener('beforeunload',beforeUnload);
  },[busy,draft.updatedAt,persistedAt]);

  const commit=(change:(b:Building)=>Building)=>{
    onSaving(true);
    const old=currentDraft.current,next=change(old);
    history.current=[...history.current.slice(-19),old];
    const updated:Building={...next,graph:calibratedGraph(next.graph,next.floors),status:'draft',updatedAt:new Date(Math.max(Date.now(),Date.parse(old.updatedAt)+1)).toISOString()};
    currentDraft.current=updated;setDraft(updated);
    setErrors([]);setReviewChecked(false);setRevision(v=>v+1);
  };
  useEffect(()=>{
    if(draft.updatedAt===latestSaved.current)return;
    setSaveState('Saving…');
    saveTimer.current=setTimeout(()=>{
      saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{try{await saveBuilding(draft);latestSaved.current=draft.updatedAt;setPersistedAt(draft.updatedAt);if(currentRevision.current===draft.updatedAt)setSaveState('Saved in this browser');onSaved(draft);}catch{setSaveState('Save failed — browser storage may be full. Download a backup before leaving.');}});
    },450);
    return()=>{if(saveTimer.current)clearTimeout(saveTimer.current);};
  },[draft,onSaved]);
  useEffect(()=>()=>worker.current?.terminate(),[]);
  const updateEdge=(change:(e:Edge)=>Edge)=>commit(b=>({...b,graph:{...b.graph,edges:b.graph.edges.map(e=>e.id===selected?change(e):e)}}));
  const updateNode=(patch:Partial<MapNode>)=>commit(b=>({...b,graph:{...b.graph,nodes:b.graph.nodes.map(n=>n.id===selected?{...n,...patch}:n),edges:b.graph.edges.map(e=>(('x' in patch||'y' in patch||'category' in patch)&&(e.from===selected||e.to===selected))?{...e,reviewed:false}:e)}}));
  const upload=async(file?:File)=>{
    if(!file)return;setBusy(true);setErrors([]);
    try{
      const id=Math.max(-1,...draft.floors.map(f=>f.id))+1;
      const result=await readFloorImage(file,id),mask=buildClearanceGrid({...result.scan,threshold,padding,floor:id});
      commit(b=>({...b,floors:[...b.floors,result.floor],graph:{...b.graph,clearanceGrids:{...b.graph.clearanceGrids,[id]:mask}}}));
      setFloorId(id);setSeed(undefined);setSelected('');setScalePoints([]);setZoom(1);
      setAiConsent(false);setMessage('Floor uploaded. Choose AI scanning for labeled locations, or Local scan for pathway detection without sending the image.');
    }catch(error){setErrors([error instanceof Error?error.message:'Could not read this image.']);}finally{setBusy(false);}
  };
  const scan=async()=>{
    if(!floor)return;
    if(scanMethod==='ai'&&(!aiConsent||!scanCode)){setErrors(['Enter the staff scan code and confirm sending this image to Google.']);return;}
    setBusy(true);setErrors([]);setMessage(scanMethod==='ai'?'AI is identifying locations and draft pathways. This can take up to a minute…':'Detecting free space and tracing candidate pathways…');
    try{
      const raster=await floorRaster(floor);
      let result:ScanResult;
      if(scanMethod==='ai')result=await scanWithAi(floor,buildClearanceGrid({...raster,threshold,padding,floor:floor.id}),scanCode);
      else {
        const active=new Worker(new URL('./scan.worker.ts',import.meta.url),{type:'module'});worker.current=active;
        result=await new Promise<ScanResult>((resolve,reject)=>{
        const timeout=setTimeout(()=>{active.terminate();reject(new Error('The scan took too long. Try a simpler or smaller plan.'));},20000);
        active.onmessage=e=>{clearTimeout(timeout);active.terminate();e.data.error?reject(new Error(e.data.error)):resolve(e.data.result);};
        active.onerror=()=>{clearTimeout(timeout);active.terminate();reject(new Error('The scanner could not start. Reload and try again.'));};
        active.postMessage({...raster,threshold,padding,floor:floor.id,seed});
        });
      }
      commit(b=>{
        const retained=b.graph.nodes.filter(n=>n.floor!==floor.id),ids=new Set(retained.map(n=>n.id));
        return {...b,graph:{...b.graph,nodes:[...retained,...result.nodes],edges:[...b.graph.edges.filter(e=>ids.has(e.from)&&ids.has(e.to)),...result.edges],clearanceGrids:{...b.graph.clearanceGrids,[floor.id]:result.grid}}};
      });
      setSelected('');setTool('select');setReplaceChecked(false);setMessage(result.message);
    }catch(error){setErrors([error instanceof Error?error.message:'Scanning failed.']);setMessage('No generated paths were applied. Adjust the settings or draw connections manually.');}finally{setBusy(false);worker.current=null;}
  };
  const connect=(id:string)=>{
    if(!node||node.floor!==floorId){setSelected(id);return;}
    const error=connectionError(draft.graph,node.id,id,floorId);if(error){setErrors([error]);return;}
    commit(b=>({...b,graph:{...b.graph,edges:[...b.graph.edges,{id:crypto.randomUUID(),from:node.id,to:id,distance:0,kind:'corridor',accessible:false,traversable:true,reviewed:false}]}}));
    setSelected(id);setMessage('Connection added. Review its access condition.');
  };
  const pick=(id:string)=>{if(busy)return;if(tool==='connect'&&lookup[id])connect(id);else setSelected(id);};
  useEffect(()=>{setConnectTo('');},[selected,floorId,draft.graph.nodes]);
  const canvasPoint=(event:React.PointerEvent<SVGSVGElement>):[number,number]=>{
    const rect=event.currentTarget.getBoundingClientRect();return [(event.clientX-rect.left)/rect.width*floor!.width,(event.clientY-rect.top)/rect.height*floor!.height];
  };
  const paint=(point:[number,number])=>{
    if(!grid)return;const x=Math.floor(point[0]*grid.width/grid.imageWidth),y=Math.floor(point[1]*grid.height/grid.imageHeight);
    commit(b=>{const cells=[...b.graph.clearanceGrids![floorId].cells];
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const xx=x+ox,yy=y+oy;if(xx>=0&&yy>=0&&xx<grid.width&&yy<grid.height)cells[yy*grid.width+xx]=tool==='open'?1:0;}
      return {...b,graph:{...b.graph,clearanceGrids:{...b.graph.clearanceGrids,[floorId]:{...grid,cells}},edges:b.graph.edges.map(e=>lookup[e.from]?.floor===floorId||lookup[e.to]?.floor===floorId?{...e,reviewed:false}:e)}};
    });
  };
  const applyPoint=(point:[number,number])=>{
    if(busy||!floor)return;
    if(point.some(v=>!Number.isFinite(v))||point[0]<0||point[1]<0||point[0]>=floor.width||point[1]>=floor.height){setErrors(['Enter a point within the floor image bounds.']);return;}
    if(tool==='seed'){setSeed(point);setMessage('Local corridor seed set. Select Scan pathways.');}
    else if(tool==='scale')setScalePoints(p=>p.length===2?[point]:[...p,point]);
    else if(tool==='block'||tool==='open')paint(point);
    else if(tool==='add'||tool==='move'){
      if(grid&&!clearSegment(grid,point,point)){setErrors(['This point is on a detected obstacle. Choose clear space or correct the mask.']);return;}
      if(tool==='move'){if(node)updateNode({x:point[0],y:point[1],labelX:undefined,labelY:undefined});else setErrors(['Select a node before moving it.']);}
      else{const id=crypto.randomUUID();commit(b=>({...b,graph:{...b.graph,nodes:[...b.graph.nodes,{id,name:`Junction ${nodes.length+1}`,floor:floorId,x:point[0],y:point[1]}]}}));setSelected(id);}
    }
  };
  const calibrate=()=>{
    const meters=Number(knownDistance);if(!floor||scalePoints.length!==2||!Number.isFinite(meters)||meters<=0)return;
    const pixels=Math.hypot(scalePoints[1][0]-scalePoints[0][0],scalePoints[1][1]-scalePoints[0][1]);
    if(pixels<1){setErrors(['Choose two different points.']);return;}
    commit(b=>({...b,floors:b.floors.map(f=>f.id===floorId?{...f,metersPerPixel:meters/pixels}:f)}));setScalePoints([]);setTool('select');setMessage('Distance scale saved. Connection lengths are now calculated in meters.');
  };
  const removeSelection=()=>{commit(b=>({...b,graph:{...b.graph,nodes:b.graph.nodes.filter(n=>n.id!==selected),edges:b.graph.edges.filter(e=>e.id!==selected&&e.from!==selected&&e.to!==selected)}}));setSelected('');};
  const activate=async()=>{
    const issues=activationErrors(draft);setErrors(issues);if(issues.length)return;
    setBusy(true);if(saveTimer.current)clearTimeout(saveTimer.current);
    try{await saveQueue.current;const ready={...draft,status:'ready' as const,updatedAt:new Date().toISOString()};await saveBuilding(ready);latestSaved.current=ready.updatedAt;setPersistedAt(ready.updatedAt);setDraft(ready);onSaved(ready);onUse(ready);}
    catch{setErrors(['Could not save the reviewed map. Free browser storage or download a backup and try again.']);}finally{setBusy(false);}
  };
  const backup=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({schemaVersion:1,building:draft})],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='indoor-map-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const addFloorLink=()=>{
    const from=lookup[linkFrom],to=lookup[linkTo],distance=Number(linkDistance);
    if(!from||!to||from.floor===to.floor||from.category!==linkKind||to.category!==linkKind||!Number.isFinite(distance)||distance<=0){setErrors(['Choose matching elevator or stair nodes on different floors and enter a positive mapped distance.']);return;}
    commit(b=>({...b,graph:{...b.graph,edges:[...b.graph.edges,{id:crypto.randomUUID(),from:from.id,to:to.id,distance,kind:linkKind,accessible:linkKind==='elevator'&&linkAccessible,traversable:true,reviewed:true}]}}));setMessage('Floor connection added.');
  };

  return <main className="studio" aria-label="Floor plan studio">
    <header className="studio-heading"><div><h1>Make your building navigable.</h1><p>Upload a plan. Review its pathways. Help people find their way.</p></div><span className="save-status"><FloppyDisk size={17}/>{saveState}</span></header>
    <div className="studio-intro"><label>Establishment name<input value={draft.name} disabled={busy} maxLength={80} onChange={e=>commit(b=>({...b,name:e.target.value}))}/></label><div className="studio-actions"><button className="secondary-button" onClick={backup}>Download backup</button><button className="primary-button" disabled={busy} onClick={activate}>Use reviewed map <ArrowRight size={18}/></button></div></div>
    <ol className="studio-steps"><li><b>1</b>Upload floors</li><li><b>2</b>Scan & correct</li><li><b>3</b>Label & calibrate</li><li><b>4</b>Confirm access</li></ol>
    {errors.length>0&&<div className="studio-errors" role="alert"><strong>Needs attention</strong><ul>{errors.slice(0,12).map((error,i)=><li key={i}>{error}</li>)}</ul>{errors.length>12&&<p>And {errors.length-12} more connections to correct.</p>}</div>}
    <p className="studio-status" role="status">{busy?'Working… ':''}{message}</p>
    <div className="studio-layout"><aside className="studio-controls"><fieldset disabled={busy}>
      <h2>Your floor plans</h2>
      <label className="upload-control"><UploadSimple size={24}/><strong>Upload a floor plan</strong><span>PNG, JPG or WebP · up to 12 MB</span><input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload floor plan" onChange={e=>{upload(e.target.files?.[0]);e.target.value='';}}/></label>
      <p className="field-hint">Use a clear top-down drawing. Export PDF or CAD plans as images first.</p>
      {floor&&<><label>Current floor<select value={floorId} onChange={e=>{setFloorId(Number(e.target.value));setReviewChecked(false);setAiConsent(false);setSeed(undefined);setScalePoints([]);setSelected('');setReplaceChecked(false);setZoom(1);}}>{draft.floors.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
        <label>Floor name<input value={floor.name} maxLength={60} onChange={e=>commit(b=>({...b,floors:b.floors.map(f=>f.id===floorId?{...f,name:e.target.value,short:e.target.value.slice(0,8)}:f)}))}/></label>
        <h2>Detect pathways</h2>
        <label>Scanning method<select value={scanMethod} onChange={e=>{const method=e.target.value as 'local'|'ai';setScanMethod(method);if(method==='ai'&&tool==='seed')setTool('select');}}><option value="ai">AI scan · locations &amp; pathways</option><option value="local">Local scan · pathways only</option></select></label>
        {scanMethod==='ai'&&<><p className="field-hint">Gemini proposes room labels, door connections and corridor paths. AI can miss or misread details; every result stays a draft.</p><label>Staff scan code<input type="password" autoComplete="off" value={scanCode} onChange={e=>setScanCode(e.target.value)} placeholder="Code from the project owner"/></label><label className="check-label"><input type="checkbox" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)}/>Send this floor image to Google for AI analysis.</label><p className="field-hint">Google’s free tier has usage limits and may use submitted content to improve its products. Use a plan you are allowed to share. <a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer">Free-tier details</a></p><details><summary>Set up AI scanning</summary><p className="field-hint">The project owner adds GEMINI_API_KEY and AI_SCAN_ACCESS_CODE in Vercel’s environment settings, then redeploys. The staff code is separate from the API key. Do not enter the API key here. Local scan works without setup.</p></details></>}
        <p className="field-hint">The obstacle check uses light areas between dark walls. Local scan traces these areas; AI scan proposes labeled routes against the same mask. Text, furniture and door symbols can require correction. Colored renderings are less reliable.</p>
        <label>Wall threshold <output>{threshold}</output><input type="range" min="40" max="230" value={threshold} onChange={e=>setThreshold(Number(e.target.value))}/></label>
        <label>Wall padding<select value={padding} onChange={e=>setPadding(Number(e.target.value))}><option value={0}>None — preserve narrow doors</option><option value={1}>1 scan cell</option><option value={2}>2 scan cells</option></select></label>
        {seed&&scanMethod==='local'&&<button className="text-button" onClick={()=>setSeed(undefined)}>Clear corridor seed</button>}
        {nodes.length>0&&<label className="check-label"><input type="checkbox" checked={replaceChecked} onChange={e=>setReplaceChecked(e.target.checked)}/>Replace this floor’s nodes, links and obstacle corrections when rescanning</label>}
        <button className="primary-button scan-button" disabled={(nodes.length>0&&!replaceChecked)||(scanMethod==='ai'&&(!aiConsent||!scanCode))} onClick={scan}><Scan size={20}/>{busy?'Scanning…':scanMethod==='ai'?'Scan with AI':'Scan pathways'}</button>
        <h2>Distance scale</h2><p className="field-hint">{floor.metersPerPixel?`Calibrated · ${(floor.metersPerPixel*100).toFixed(2)} m per 100 image pixels`:'Not calibrated. Image pixels are not meters.'}</p>
        <button className="secondary-button" onClick={()=>{setTool('scale');setScalePoints([]);}}>Mark two known points</button>
        <label>Distance between points (m)<input type="number" min="0.01" step="any" value={knownDistance} onChange={e=>setKnownDistance(e.target.value)}/></label><button className="secondary-button" disabled={scalePoints.length!==2||Number(knownDistance)<=0} onClick={calibrate}>Apply scale ({scalePoints.length}/2 points)</button>
      </>}
    </fieldset></aside>
    <section className="studio-main" aria-label="Plan editor">
      {!floor?<div className="upload-empty"><UploadSimple size={46} weight="light"/><h2>Start with your floor plan.</h2><p>Each establishment keeps its own plans, destinations and accessibility settings. Maps are saved in this browser. AI scanning sends the selected image to Google only when you confirm.</p></div>:<>
        <div className="editor-title"><div><h2>{floor.name}</h2><p>{nodes.length} nodes · {edges.length} connections · {unreviewed} unreviewed across all floors</p></div><div className="editor-zoom"><button aria-label="Zoom editor out" disabled={zoom<=1} onClick={()=>setZoom(v=>Math.max(1,v-.25))}>−</button><span>{Math.round(zoom*100)}%</span><button aria-label="Zoom editor in" disabled={zoom>=3} onClick={()=>setZoom(v=>Math.min(3,v+.25))}>+</button></div></div>
        <div className="editor-toolbar" role="group" aria-label="Editing tool">{tools.filter(t=>scanMethod==='local'||t.id!=='seed').map(t=><button key={t.id} disabled={busy} aria-pressed={tool===t.id} onClick={()=>setTool(t.id)}>{t.label}</button>)}<button disabled={!history.current.length||busy} onClick={()=>{const previous=history.current.pop();if(previous){setDraft({...previous,status:'draft',updatedAt:new Date().toISOString()});setRevision(revision+1);setReviewChecked(false);setErrors([]);}}}>Undo</button></div>
        <p className="tool-help"><Info size={16}/>{tools.find(t=>t.id===tool)?.help}</p>
        <label className="check-label"><input type="checkbox" checked={showMask} onChange={e=>setShowMask(e.target.checked)}/>Show detected obstacles (red)</label>
        <div className="editor-scroll"><div className="editor-canvas" style={{width:`${zoom*100}%`,aspectRatio:`${floor.width}/${floor.height}`}}><img src={floor.image} alt={`Uploaded plan for ${floor.name}`} draggable={false}/>
          <svg viewBox={`0 0 ${floor.width} ${floor.height}`} aria-label="Editable routing graph" onPointerDown={e=>applyPoint(canvasPoint(e))} onPointerMove={e=>{if(e.buttons===1&&(tool==='open'||tool==='block')&&!busy)paint(canvasPoint(e));}}>
            {showMask&&grid&&<path className="obstacle-mask" d={grid.cells.map((free,i)=>free?'':`M${i%grid.width*floor.width/grid.width},${Math.floor(i/grid.width)*floor.height/grid.height}h${floor.width/grid.width}v${floor.height/grid.height}h-${floor.width/grid.width}z`).join('')}/>}
            {edges.map(e=><polyline key={e.id} points={edgeGeometry(e,lookup).map(p=>p.join(',')).join(' ')} className={`editor-edge ${!e.traversable?'blocked':e.reviewed?e.accessible?'accessible':'standard':'unreviewed'} ${selected===e.id?'chosen':''}`} role="button" tabIndex={0} aria-label={`Connection ${lookup[e.from].name} to ${lookup[e.to].name}`} onPointerDown={event=>{if(['select','connect','move'].includes(tool)){event.stopPropagation();pick(e.id);}}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();pick(e.id);}}}/>) }
            {nodes.map(n=><g key={n.id} role="button" tabIndex={0} aria-label={`Node ${n.name}`} onPointerDown={event=>{if(['select','connect','move'].includes(tool)){event.stopPropagation();pick(n.id);}}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();pick(n.id);}}}><circle cx={n.x} cy={n.y} r={selected===n.id?9:6} className={`editor-node ${n.facility?'facility':''} ${selected===n.id?'chosen':''}`}/>{n.facility&&<text x={n.x+10} y={n.y-10} className="editor-node-label">{n.name}</text>}</g>)}
            {seed&&scanMethod==='local'&&<circle cx={seed[0]} cy={seed[1]} r={11} className="seed-point"/>}
            {scalePoints.length===2&&<line x1={scalePoints[0][0]} y1={scalePoints[0][1]} x2={scalePoints[1][0]} y2={scalePoints[1][1]} className="scale-line"/>}
            {scalePoints.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={8} className="seed-point"/>)}
          </svg></div></div>
        <details className="coordinate-editor"><summary>Edit with coordinates (keyboard alternative)</summary><p className="field-hint">Image coordinates: X from 0 to {floor.width-1}, Y from 0 to {floor.height-1}. Choose a tool above, then apply a point. Select nodes using the inspector below.</p><div className="inspector-fields"><label>X coordinate<input type="number" value={pointX} onChange={e=>setPointX(e.target.value)}/></label><label>Y coordinate<input type="number" value={pointY} onChange={e=>setPointY(e.target.value)}/></label></div><button className="secondary-button" disabled={busy||pointX===''||pointY===''||tool==='select'||tool==='connect'} onClick={()=>applyPoint([Number(pointX),Number(pointY)])}>Apply {tools.find(t=>t.id===tool)?.label} at point</button>{node&&<><label>Connect selected node to<select value={connectTo} onChange={e=>setConnectTo(e.target.value)}><option value="">Choose another node</option>{nodes.filter(n=>n.id!==node.id).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label><button className="secondary-button" disabled={busy||!connectTo} onClick={()=>connect(connectTo)}>Add connection</button></>}</details>
        <p className="editor-legend"><span>Dashed amber: unreviewed</span><span>Green: accessible</span><span>Slate: standard only</span><span>Red: blocked</span></p>
        <div className="inspector"><fieldset disabled={busy}><label>Inspect a node or connection<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose an item, or select it on the map</option><optgroup label="Nodes">{nodes.map(n=><option key={n.id} value={n.id}>{n.name}{n.facility?' · destination':''}</option>)}</optgroup><optgroup label="Connections">{edges.map(e=><option key={e.id} value={e.id}>{lookup[e.from].name} → {lookup[e.to].name}</option>)}</optgroup></select></label>
          {node&&<div className="inspector-fields"><label>Location name<input value={node.name} maxLength={70} onChange={e=>updateNode({name:e.target.value})}/></label><label>Location type<select value={node.category??''} onChange={e=>updateNode({category:(e.target.value||undefined) as MapNode['category']})}><option value="">Corridor junction</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="check-label"><input type="checkbox" checked={!!node.facility} onChange={e=>updateNode({facility:e.target.checked,category:node.category??'facility'})}/>Show in guest destination list</label></div>}
          {edge&&<div className="inspector-fields"><label>Connection type<select value={edge.kind} onChange={e=>updateEdge(old=>({...old,kind:e.target.value as PathKind,accessible:false,reviewed:false}))}><option value="corridor">Corridor / doorway</option><option value="ramp">Ramp</option><option value="stairs">Stairs / steps</option></select></label><label>Reviewed access condition<select value={!edge.reviewed?'unknown':!edge.traversable?'blocked':edge.accessible?'accessible':'standard'} onChange={e=>updateEdge(old=>reviewEdge(old,e.target.value as 'unknown'|'accessible'|'standard'|'blocked'))}><option value="unknown">Not reviewed</option><option value="accessible" disabled={edge.kind==='stairs'}>Confirmed accessible</option><option value="standard">Standard route only</option><option value="blocked">Blocked / not a public pathway</option></select></label><p>{floor.metersPerPixel?`${edge.distance.toFixed(2)} m`:'Calibrate the plan to calculate meters.'}</p></div>}
          {selected&&<button className="text-button danger-text" onClick={removeSelection}>Remove selected {node?'node and its connections':'connection'}</button>}
        </fieldset></div>
        <section className="review-panel"><h2>Review this floor</h2><p>Check every line against the actual corridors and doors. Remove shortcuts through private rooms. Accessibility requires confirmation of real conditions, including steps, clearances and ramps.</p><label className="check-label"><input type="checkbox" disabled={busy} checked={reviewChecked} onChange={e=>setReviewChecked(e.target.checked)}/>I have checked all displayed connections on this floor.</label><div className="review-actions"><button className="secondary-button" disabled={!reviewChecked||busy} onClick={()=>commit(b=>({...b,graph:{...b.graph,edges:b.graph.edges.map(e=>edges.some(local=>local.id===e.id)?reviewEdge(e,!e.traversable?'blocked':'standard'):e)}}))}>Confirm as standard routes</button><button className="secondary-button" disabled={!reviewChecked||busy} onClick={()=>commit(b=>({...b,graph:{...b.graph,edges:b.graph.edges.map(e=>edges.some(local=>local.id===e.id)?reviewEdge(e,!e.traversable?'blocked':e.kind==='stairs'?'standard':'accessible'):e)}}))}>Confirm step-free access</button></div></section>
        {draft.floors.length>1&&<section className="review-panel"><h2>Connect floors</h2><p>Label elevator or stair nodes on each floor, then link matching landings. Different floor drawings do not need to share the same coordinates.</p><fieldset disabled={busy}><div className="inspector-fields"><label>Connector type<select value={linkKind} onChange={e=>{setLinkKind(e.target.value as 'elevator'|'stairs');setLinkAccessible(false);}}><option value="elevator">Elevator</option><option value="stairs">Stairs</option></select></label><label>From<select value={linkFrom} onChange={e=>setLinkFrom(e.target.value)}><option value="">Choose connector</option>{connectors.filter(n=>n.category===linkKind).map(n=><option key={n.id} value={n.id}>{draft.floors.find(f=>f.id===n.floor)?.name}: {n.name}</option>)}</select></label><label>To<select value={linkTo} onChange={e=>setLinkTo(e.target.value)}><option value="">Choose connector</option>{connectors.filter(n=>n.category===linkKind).map(n=><option key={n.id} value={n.id}>{draft.floors.find(f=>f.id===n.floor)?.name}: {n.name}</option>)}</select></label><label>Mapped vertical distance (m)<input type="number" min="0.01" step="any" value={linkDistance} onChange={e=>setLinkDistance(e.target.value)}/></label></div>{linkKind==='elevator'&&<label className="check-label"><input type="checkbox" checked={linkAccessible} onChange={e=>setLinkAccessible(e.target.checked)}/>Elevator access and both landings are confirmed accessible</label>}<button className="secondary-button" onClick={addFloorLink}>Add reviewed floor connection</button></fieldset>
          <ul className="floor-link-list">{draft.graph.edges.filter(e=>lookup[e.from]?.floor!==lookup[e.to]?.floor).map(e=><li key={e.id}>{lookup[e.from]?.name} → {lookup[e.to]?.name} · {e.kind} · {e.distance} m <label>Reviewed access condition<select disabled={busy} value={!e.reviewed?'unknown':!e.traversable?'blocked':e.accessible?'accessible':'standard'} onChange={event=>{const value=event.target.value as 'unknown'|'accessible'|'standard'|'blocked';commit(b=>({...b,graph:{...b.graph,edges:b.graph.edges.map(old=>old.id===e.id?reviewEdge(old,value):old)}}));}}><option value="unknown">Not reviewed</option><option value="accessible" disabled={e.kind==='stairs'}>Confirmed accessible</option><option value="standard">Standard route only</option><option value="blocked">Blocked</option></select></label> <button className="text-button" onClick={()=>commit(b=>({...b,graph:{...b.graph,edges:b.graph.edges.filter(old=>old.id!==e.id)}}))}>Remove</button></li>)}</ul>
        </section>}
      </>}
    </section></div>
  </main>;
}
