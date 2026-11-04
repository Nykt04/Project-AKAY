import fs from 'node:fs/promises';
const path='src/FloorPlanStudio.tsx',source=(await fs.readFile(path,'utf8')).replaceAll('\r\n','\n');
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);if(a<0||b<0)throw new Error(`Missing section ${start}`);return source.slice(a,b).trim();}
const scan=section('<h2 id="studio-detect"','<h2 id="studio-calibrate"');
const scale=section('<h2 id="studio-calibrate"','</>}\n    </fieldset></aside>');
const toolbar=section('<div className="editor-toolbar"','<label className="check-label"><input type="checkbox" checked={showMask}');
const repair=section('<label className="check-label"><input type="checkbox" checked={showMask}','<div className="editor-scroll">');
const canvas=section('<div className="editor-scroll">','<details className="coordinate-editor">');
const coordinates=section('<details className="coordinate-editor">','<p className="editor-legend">');
const legend=section('<p className="editor-legend">','<div className="inspector">');
const inspector=section('<div className="inspector">','<section className="review-panel" id="studio-review"');
const review=section('<section className="review-panel" id="studio-review"','{draft.floors.length>1&&');
const floorLinks=section('{draft.floors.length>1&&','\n      </>}');
const next=`  return <main className="studio guided-studio" aria-label="Floor plan studio">
    <header className="studio-heading"><div><p className="setup-kicker">Establishment setup</p><h1 ref={stepHeading} tabIndex={-1}>{setupStages[stage].heading}</h1><p>{setupStages[stage].help}</p></div><span className="save-status"><FloppyDisk size={17} aria-hidden="true"/>{saveState}</span></header>
    <nav aria-label="Setup steps"><ol className="setup-navigation">{setupStages.map((step,i)=><li key={step.title}><button type="button" disabled={busy||(i>0&&!readiness.floorsReady)||(i===3&&!readiness.canReview)} aria-current={stage===i?'step':undefined} onClick={()=>changeStage(i as SetupStage)}><span aria-hidden="true">{i+1}</span>{step.title}</button></li>)}</ol></nav>
    {errors.length>0&&<div className="studio-errors" role="alert"><strong>Needs attention</strong><ul>{errors.slice(0,12).map((error,i)=><li key={i}>{error}</li>)}</ul>{errors.length>12&&<p>And {errors.length-12} more connections to correct.</p>}</div>}
    {message&&<p className="studio-status" role="status">{message}</p>}
    <div className="studio-layout"><aside className="studio-controls"><fieldset disabled={busy}>
      {stage===0&&<><label>Establishment name<input value={draft.name} maxLength={80} placeholder="e.g. Riverside Community Center" onChange={e=>commit(b=>({...b,name:e.target.value}))}/></label>
        <h2 id="studio-upload">Add floor plans</h2>
        <label className="upload-control"><UploadSimple size={24} aria-hidden="true"/><strong>{floor?'Add another floor':'Choose a floor plan'}</strong><span>PNG, JPG or WebP · up to 12 MB</span><input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload floor plan" onChange={e=>{upload(e.target.files?.[0]);e.target.value='';}}/></label>
        <p className="field-hint">Use a clear top-down drawing. Export PDF or CAD plans as images first.</p>
      </>}
      {floor&&<label>{draft.floors.length>1?'Working on floor':'Floor'}<select value={floorId} onChange={e=>{setFloorId(Number(e.target.value));setReviewChecked(false);setAiConsent(false);setSeed(undefined);setScalePoints([]);setSelected('');setReplaceChecked(false);setZoom(1);setTool('select');}}>{draft.floors.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
      {stage===0&&floor&&<label>Floor name<input value={floor.name} maxLength={60} placeholder="e.g. Ground floor" onChange={e=>commit(b=>({...b,floors:b.floors.map(f=>f.id===floorId?{...f,name:e.target.value,short:e.target.value.slice(0,8)}:f)}))}/></label>}
      {stage===0&&<p className="field-hint">Your draft saves in this browser as you work. You can come back to add more floors.</p>}
      {stage===1&&floor&&<>${scan}
        {scanMethod==='local'&&<button className="secondary-button" onClick={()=>setTool('seed')}>Choose a corridor on the plan</button>}
        <button className="text-button" onClick={()=>changeStage(2)}>Draw paths myself instead</button>
      </>}
      {stage===2&&floor&&<>${scale}<p className="field-hint">On the map, select a location to name it. Use Add location or Draw connection if the scan missed something.</p></>}
      {stage===3&&floor&&<><h2>Access review</h2><p className="field-hint">{unreviewed} connections still need review across {draft.floors.length} {draft.floors.length===1?'floor':'floors'}. Check this floor, then switch floors above.</p>${review}</>}
    </fieldset></aside>
    <section className="studio-main" aria-label={stage===0?'Floor plan preview':'Plan editor'}>
      {!floor?<div className="upload-empty"><UploadSimple size={46} weight="light" aria-hidden="true"/><h2>Your floor plan will appear here.</h2><p>Start with one floor. You will add paths and access details in the next steps.</p></div>:<>
        <div className="editor-title"><div><h2>{floor.name}</h2><p>{stage===0?'Uploaded plan':nodes.length+' locations · '+edges.length+' connections'}</p></div>{stage>0&&<div className="editor-zoom"><button aria-label="Zoom editor out" disabled={zoom<=1} onClick={()=>setZoom(v=>Math.max(1,v-.25))}>−</button><span>{Math.round(zoom*100)}%</span><button aria-label="Zoom editor in" disabled={zoom>=3} onClick={()=>setZoom(v=>Math.min(3,v+.25))}>+</button></div>}</div>
        {stage===0?<img className="setup-floor-preview" src={floor.image} alt={'Uploaded plan for '+floor.name}/>:<>
          {stage===2&&<>${toolbar}<details className="setup-advanced"><summary>Path corrections & advanced tools</summary>
            <div className="editor-toolbar">{tools.filter(t=>['block','open','seed'].includes(t.id)&&(t.id!=='seed'||scanMethod==='local')).map(t=><button key={t.id} disabled={busy} aria-pressed={tool===t.id} onClick={()=>setTool(t.id)}>{t.label}</button>)}</div>
            ${repair}</details></>}
          ${canvas}
          {stage===2&&<>${coordinates}</>}
          {stage>=2&&<>${legend}${inspector}</>}
          {stage===3&&<>${floorLinks}</>}
        </>}
      </>}
      {stage===3&&<div className="setup-readiness" role="status">{finalIssues.length?<><h2>Finish these checks to open navigation.</h2><details open={finalIssues.length<=4}><summary>{finalIssues.length} {finalIssues.length===1?'item needs':'items need'} attention</summary><ul>{finalIssues.slice(0,12).map((issue,i)=><li key={i}>{issue}</li>)}</ul></details><button className="text-button" onClick={()=>changeStage(2)}>Return to map corrections</button></>:<><h2>The map is ready for visitors.</h2><p>Open navigation to try the reviewed routes. Your map stays in this browser.</p></>}</div>}
    </section></div>
    <footer className="setup-footer"><div>{stage>0&&<button className="secondary-button" disabled={busy} onClick={()=>changeStage((stage-1) as SetupStage)}>Back</button>}<button className="text-button" onClick={backup}>Download backup</button></div><div className="setup-next">
      {stage===0&&<><p>{!readiness.floorsReady?'Enter the place name, upload a plan and name each floor.':draft.floors.length+' floor plans added. Next, find the paths.'}</p><button className="primary-button" disabled={busy||!readiness.floorsReady} onClick={()=>changeStage(1)}>Continue to paths <ArrowRight size={18} aria-hidden="true"/></button></>}
      {stage===1&&<><p>{readiness.pathsReady?'Paths are available. Check their positions next.':'Scan a floor plan, or choose to draw paths yourself.'}</p><button className="secondary-button" disabled={busy||!readiness.pathsReady} onClick={()=>changeStage(2)}>Continue to map check <ArrowRight size={18} aria-hidden="true"/></button></>}
      {stage===2&&<><p>{!readiness.pathsReady?'Add paths on every floor.':!readiness.scaleReady?'Set the distance scale on every floor.':!readiness.labelsReady?'Name at least two visitor destinations.':'Next, confirm access conditions for each path.'}</p><button className="primary-button" disabled={busy||!readiness.canReview} onClick={()=>changeStage(3)}>Continue to access review <ArrowRight size={18} aria-hidden="true"/></button></>}
      {stage===3&&<><p>{finalIssues.length?'Complete the listed checks before visitor use.':'All required checks are complete.'}</p><button className="primary-button" disabled={busy||finalIssues.length>0} onClick={activate}>Open visitor navigation <ArrowRight size={18} aria-hidden="true"/></button></>}
    </div></footer>
  </main>;
}
`;
let result=source.slice(0,source.indexOf('  return <main className="studio"'))+next;
result=result.replace("tools.filter(t=>scanMethod==='local'||t.id!=='seed')","tools.filter(t=>['select','add','connect','move'].includes(t.id))");
result=result.replace("setSelected('');setTool('select');setReplaceChecked(false);setMessage(result.message);","setSelected('');setTool('select');setReplaceChecked(false);setStage(2);setMessage(result.message);");
result=result.replace("label:'Select'","label:'Inspect'").replace("label:'Add node'","label:'Add location'").replace("label:'Connect'","label:'Draw connection'").replace("label:'Move node'","label:'Move location'");
await fs.writeFile(path,result);
