import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Buildings } from '@phosphor-icons/react/dist/csr/Buildings';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { SlidersHorizontal } from '@phosphor-icons/react/dist/csr/SlidersHorizontal';
import { Prohibit } from '@phosphor-icons/react/dist/csr/Prohibit';
import { QrCode } from '@phosphor-icons/react/dist/csr/QrCode';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ClosuresDialog, StartPointSheet } from './StaffTools';
import { readRouteParams } from './urlState';
import { App } from './App';
import { BuildingContext, loadBuildings, sampleBuilding, saveBuilding, type Building } from './buildings';
import { freshBuilding } from './buildingEditor';

const FloorPlanStudio = lazy(() => import('./FloorPlanStudio').then(module => ({ default: module.FloorPlanStudio })));

const PRELOADER_FLOORS = [
  {
    id: 0,
    code: 'LEVEL G',
    name: 'Ground Concourse',
    summary: 'Main entrance, reception desk, accessible ramp & dining hall',
    path: 'M 190,220 L 190,175 L 145,175 L 145,145 L 310,145 L 310,75 L 355,75',
    start: { x: 190, y: 220, label: 'Main entrance' },
    end: { x: 355, y: 75, label: 'Restaurant' },
  },
  {
    id: 1,
    code: 'LEVEL 01',
    name: 'First Floor Suites',
    summary: 'Elevator core, conference rooms & accessible east corridor',
    path: 'M 255,95 L 255,145 L 120,145 L 120,85',
    start: { x: 255, y: 95, label: 'Elevator' },
    end: { x: 120, y: 85, label: 'Meeting suite' },
  },
  {
    id: 2,
    code: 'LEVEL 02',
    name: 'Second Floor Gallery',
    summary: 'Step-free terrace access, quiet study & north wing rooms',
    path: 'M 255,95 L 255,145 L 365,145 L 365,195',
    start: { x: 255, y: 95, label: 'Elevator' },
    end: { x: 365, y: 195, label: 'East wing' },
  },
] as const;

function CivicLoader({ buildingName, exiting, onSkip }: { buildingName: string; exiting: boolean; onSkip: () => void }) {
  const [progress, setProgress] = useState(0);
  const [manualFloor, setManualFloor] = useState<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 1350;
    let raf = 0, doneTimer = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, Math.round(((now - start) / duration) * 100));
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
      else doneTimer = window.setTimeout(onSkip, 180);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(doneTimer); };
  }, [onSkip]);

  const activeIdx = manualFloor ?? (progress < 36 ? 0 : progress < 72 ? 1 : 2);
  const activeFloor = PRELOADER_FLOORS[activeIdx];

  return (
    <div
      className={`civic-preloader ${exiting ? 'is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${buildingName}`}
    >
      <div className="preloader-topbar">
        <div className="preloader-brand">
          <span className="preloader-mark" aria-hidden="true" />
          <strong>{buildingName}</strong>
          <span>Indoor Wayfinding</span>
        </div>
        <button type="button" className="preloader-skip" onClick={onSkip}>
          Skip <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="preloader-body">
        <div className="preloader-editorial">
          <h2>Clear, step-free indoor routes across every floor.</h2>
          <p>Calibrating floor geometry, doorway anchors, and accessible corridor connections.</p>

          <div className="preloader-floor-list" role="tablist" aria-label="Floor preview">
            {PRELOADER_FLOORS.map((f, idx) => {
              const isCurrent = idx === activeIdx;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  className={`preloader-floor-item ${isCurrent ? 'is-active' : ''}`}
                  onPointerEnter={() => setManualFloor(idx)}
                  onClick={() => setManualFloor(idx)}
                >
                  <span className="preloader-floor-code">{f.code}</span>
                  <span className="preloader-floor-text">
                    <strong>{f.name}</strong>
                    <small>{f.summary}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="preloader-drafting-stage" aria-hidden="true">
          <div className="drafting-card">
            <div className="drafting-card-header">
              <span>ARCHITECTURAL PLAN · {activeFloor.code}</span>
              <span>SCALE 1:100 · METERS</span>
            </div>

            <svg className="drafting-svg" viewBox="0 0 460 260">
              {/* Outer Building Footprint */}
              <rect x="40" y="28" width="380" height="204" rx="4" className="drafting-wall-outer" />

              {/* Interior Architectural Partitions */}
              <g className="drafting-partitions">
                <rect x="56" y="44" width="110" height="68" className="drafting-room" />
                <rect x="182" y="44" width="96" height="68" className="drafting-room" />
                <rect x="294" y="44" width="110" height="68" className="drafting-room" />
                <line x1="56" y1="145" x2="404" y2="145" className="drafting-corridor-axis" />
                <rect x="56" y="164" width="104" height="52" className="drafting-room" />
                <rect x="176" y="164" width="108" height="52" className="drafting-room" />
                <rect x="300" y="164" width="104" height="52" className="drafting-room" />
              </g>

              {/* Traced Wayfinding Route */}
              <path
                key={activeFloor.id}
                d={activeFloor.path}
                className="drafting-route-line"
              />

              {/* Start & End Pins */}
              <g transform={`translate(${activeFloor.start.x}, ${activeFloor.start.y})`}>
                <circle r="7" className="drafting-pin-halo" />
                <circle r="4" className="drafting-pin-start" />
              </g>
              <g transform={`translate(${activeFloor.end.x}, ${activeFloor.end.y})`}>
                <circle r="9" className="drafting-pin-pulse" />
                <circle r="5" className="drafting-pin-end" />
              </g>
            </svg>

            <div className="drafting-card-footer">
              <span>Origin: <strong>{activeFloor.start.label}</strong></span>
              <span>Destination: <strong>{activeFloor.end.label}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="preloader-bottombar">
        <div className="preloader-status-meta">
          <span>STATUS</span>
          <strong>{progress < 100 ? 'Loading floor plans & route graph…' : 'Ready'}</strong>
        </div>
        <div className="preloader-counter" aria-hidden="true">
          {String(progress).padStart(2, '0')}<span>%</span>
        </div>
        <div className="preloader-rule" aria-hidden="true">
          <div className="preloader-rule-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

class StudioBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="workspace-error" role="alert">
      <p>The floor-plan editor could not load. Reload to try again. Your saved maps remain in this browser.</p>
      <button className="secondary-button" onClick={() => window.location.reload()}>Reload editor</button>
    </div> : this.props.children;
  }
}

export function Workspace() {
  const [library,setLibrary]=useState<Building[]>([]),[selected,setSelected]=useState(sampleBuilding.id);
  const [editing,setEditing]=useState(false),[loading,setLoading]=useState(()=>typeof window!=='undefined'&&!!readRouteParams().est&&readRouteParams().est!=='sample'&&readRouteParams().est!==sampleBuilding.id),[error,setError]=useState('');
  const [saving,setSaving]=useState(false),[tool,setTool]=useState<'closures'|'codes'|null>(null);
  const [booting,setBooting]=useState(()=>typeof window!=='undefined'),[bootExiting,setBootExiting]=useState(false);
  const openTool=(next:'closures'|'codes')=>{setTool(next);if(toolsMenu.current)toolsMenu.current.open=false;};
  const toolsMenu=useRef<HTMLDetailsElement>(null);
  const current=library.find(b=>b.id===selected)??sampleBuilding;

  const dismissLoader=useCallback(()=>{
    setBootExiting(true);
    window.setTimeout(()=>{setBooting(false);setBootExiting(false);},420);
  },[]);

  useEffect(()=>{
    const t1=window.setTimeout(()=>setBootExiting(true),1550);
    const t2=window.setTimeout(()=>{setBooting(false);setBootExiting(false);},1970);
    return ()=>{window.clearTimeout(t1);window.clearTimeout(t2);};
  },[]);

  useEffect(()=>{loadBuildings().then(list=>{setLibrary(list);const est=readRouteParams().est;const shared=list.find(b=>b.id===est&&b.status==='ready');if(shared)setSelected(shared.id);}).catch(()=>setError('Saved establishments could not be loaded. Browser storage must be available to save your plans.')).finally(()=>setLoading(false));},[]);
  const onSaved=useCallback((building:Building)=>setLibrary(old=>[...old.filter(b=>b.id!==building.id),building]),[]);
  useEffect(()=>{document.title=`${current.name||'New establishment'} · Indoor wayfinding`;},[current.name]);
  const create=async()=>{
    const building=freshBuilding();setError('');
    try{await saveBuilding(building);onSaved(building);setSelected(building.id);setEditing(true);if(toolsMenu.current)toolsMenu.current.open=false;}
    catch{setError('Could not create a saved establishment. Check that browser storage is available.');}
  };
  const inStudio = editing && !current.sample;
  return <>
    {(booting||loading)&&<CivicLoader buildingName={current.name||'Civic Center'} exiting={bootExiting&&!loading} onSkip={dismissLoader}/>}
    <nav className={`workspace-bar ${inStudio ? 'is-studio-bar' : 'is-integrated-bar'}`} aria-label="Establishment workspace">
      <a className="workspace-brand" href="#workspace-content"><Buildings size={20}/><span>Indoor wayfinding<small>Accessible paths, place by place</small></span></a>
      <div className="workspace-controls-cluster">
        <label className="workspace-picker"><span>Facility</span><select disabled={loading||saving} value={current.id} onChange={e=>{setSelected(e.target.value);const b=library.find(item=>item.id===e.target.value);setEditing(b?.status==='draft');}}><option value={sampleBuilding.id}>Civic Center · sample</option>{library.map(b=><option key={b.id} value={b.id}>{b.name||'Untitled establishment'}{b.status==='draft'?' · draft':''}</option>)}</select></label>
        <details className="workspace-tools" ref={toolsMenu}><summary><SlidersHorizontal size={16} aria-hidden="true"/>Map tools</summary><div className="workspace-actions">
          {!current.sample&&<button className="secondary-button" disabled={saving} onClick={()=>{if(editing&&current.status==='draft')setSelected(sampleBuilding.id);setEditing(v=>!v);if(toolsMenu.current)toolsMenu.current.open=false;}}>{editing?'Exit setup':'Manage floor plans'}</button>}
          <button className="secondary-button" disabled={loading||saving} onClick={create}><Plus size={16}/>New establishment</button>
          {!editing&&current.status==='ready'&&<>
            <button className="secondary-button" onClick={()=>openTool('closures')}><Prohibit size={16}/>Service closures</button>
            <button className="secondary-button" onClick={()=>openTool('codes')}><QrCode size={16}/>Start-point QR codes</button>
          </>}
        </div></details>
      </div>
    </nav>
    {error&&<p className="workspace-error" role="alert">{error}</p>}
    {tool==='closures'&&<ClosuresDialog building={current} onClose={()=>setTool(null)}/>}
    {tool==='codes'&&<StartPointSheet building={current} onClose={()=>setTool(null)}/>}
    <div id="workspace-content" tabIndex={-1} className="workspace-stage-ready">
      {inStudio?<StudioBoundary key={current.id}><Suspense fallback={<CivicLoader buildingName={current.name||'Floor Plan Studio'} exiting={false} onSkip={()=>{}}/>}><FloorPlanStudio initial={current} onSaved={onSaved} onSaving={setSaving} onUse={b=>{onSaved(b);setSaving(false);setEditing(false);}}/></Suspense></StudioBoundary>:
        <BuildingContext.Provider value={current}><App key={`${current.id}:${current.updatedAt}`}/></BuildingContext.Provider>}
    </div>
  </>;
}
