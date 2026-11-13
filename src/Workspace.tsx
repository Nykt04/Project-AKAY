import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Buildings } from '@phosphor-icons/react/dist/csr/Buildings';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { SlidersHorizontal } from '@phosphor-icons/react/dist/csr/SlidersHorizontal';
import { Prohibit } from '@phosphor-icons/react/dist/csr/Prohibit';
import { QrCode } from '@phosphor-icons/react/dist/csr/QrCode';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { ClosuresDialog, StartPointSheet } from './StaffTools';
import { readRouteParams } from './urlState';
import { App } from './App';
import { BUILT_IN_SAMPLES, BuildingContext, deleteBuilding, loadBuildings, resolveBuiltInSample, sampleBuilding, saveBuilding, type Building } from './buildings';
import { freshBuilding } from './buildingEditor';

const FloorPlanStudio = lazy(() => import('./FloorPlanStudio').then(module => ({ default: module.FloorPlanStudio })));

const PRELOADER_STAGES = [
  {
    id: 0,
    code: '01 GRAPH',
    name: 'Dijkstra Shortest Path',
    summary: 'Evaluates weighted meter edges across corridors, ramps, and stairs',
    path: 'M 190,220 L 190,175 L 310,175 L 310,145 L 120,145 L 120,85',
    start: { x: 190, y: 220, label: 'Main gate' },
    end: { x: 120, y: 85, label: 'Target wing' },
  },
  {
    id: 1,
    code: '02 ACCESS',
    name: 'BP 344 Step-Free Filter',
    summary: 'Excludes stairs and unverified links for wheelchair-accessible routes',
    path: 'M 120,95 L 120,145 L 310,145 L 310,85',
    start: { x: 120, y: 95, label: 'Entrance ramp' },
    end: { x: 310, y: 85, label: 'Elevator' },
  },
  {
    id: 2,
    code: '03 STUDIO',
    name: 'Multi-Establishment Plans',
    summary: 'Upload floor plans, calibrate meter scale, and review doorway access',
    path: 'M 120,95 L 120,145 L 365,145 L 365,85',
    start: { x: 120, y: 95, label: 'Floor plan' },
    end: { x: 365, y: 85, label: 'Verified graph' },
  },
] as const;

export function SystemLoader({ buildingName, exiting, onSkip }: { buildingName: string; exiting: boolean; onSkip: () => void }) {
  const [progress, setProgress] = useState(0);
  const [manualStage, setManualStage] = useState<number | null>(null);

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

  const activeIdx = manualStage ?? (progress < 36 ? 0 : progress < 72 ? 1 : 2);
  const activeStage = PRELOADER_STAGES[activeIdx];
  const venue = buildingName.trim();

  return (
    <div
      className={`civic-preloader ${exiting ? 'is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={venue ? `Loading ${venue} — Project AKAY` : 'Loading Project AKAY'}
    >
      <div className="preloader-topbar">
        <div className="preloader-brand">
          <span className="preloader-mark" aria-hidden="true" />
          <strong>Project AKAY</strong>
          <span>{venue ? `${venue} · Accessibility-Aware Indoor Facility Finder` : 'Accessibility-Aware Indoor Facility Finder'}</span>
        </div>
        <button type="button" className="preloader-skip" onClick={onSkip}>
          Skip <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="preloader-body">
        <div className="preloader-editorial">
          <h2>Clear, step-free indoor routes for every establishment.</h2>
          <p>Calibrating floor geometry, doorway anchors, and Dijkstra routing weights.</p>

          <div className="preloader-floor-list" role="tablist" aria-label="Routing overview">
            {PRELOADER_STAGES.map((stage, idx) => {
              const isCurrent = idx === activeIdx;
              return (
                <button
                  key={stage.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  className={`preloader-floor-item ${isCurrent ? 'is-active' : ''}`}
                  onPointerEnter={() => setManualStage(idx)}
                  onClick={() => setManualStage(idx)}
                >
                  <span className="preloader-floor-code">{stage.code}</span>
                  <span className="preloader-floor-text">
                    <strong>{stage.name}</strong>
                    <small>{stage.summary}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="preloader-drafting-stage" aria-hidden="true">
          <div className="drafting-card">
            <div className="drafting-card-header">
              <span>ARCHITECTURAL GRAPH · {activeStage.code}</span>
              <span>SCALE IN METERS</span>
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
                key={activeStage.id}
                d={activeStage.path}
                className="drafting-route-line"
              />

              {/* Start & End Pins */}
              <g transform={`translate(${activeStage.start.x}, ${activeStage.start.y})`}>
                <circle r="7" className="drafting-pin-halo" />
                <circle r="4" className="drafting-pin-start" />
              </g>
              <g transform={`translate(${activeStage.end.x}, ${activeStage.end.y})`}>
                <circle r="9" className="drafting-pin-pulse" />
                <circle r="5" className="drafting-pin-end" />
              </g>
            </svg>

            <div className="drafting-card-footer">
              <span>Origin: <strong>{activeStage.start.label}</strong></span>
              <span>Destination: <strong>{activeStage.end.label}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="preloader-bottombar">
        <div className="preloader-status-meta">
          <span>STATUS</span>
          <strong>{progress < 100 ? 'Loading floor plans & Dijkstra graph…' : 'Ready'}</strong>
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

function readDeletedSamples(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem('deleted-sample-facilities') ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function Workspace() {
  const [deletedSamples, setDeletedSamples] = useState<string[]>(readDeletedSamples);
  const [library,setLibrary]=useState<Building[]>([]),[selected,setSelected]=useState<string>(() => resolveBuiltInSample(readRouteParams().est, deletedSamples)?.id ?? sampleBuilding.id);
  const [editing,setEditing]=useState(false),[loading,setLoading]=useState(()=> {
    const est = typeof window !== 'undefined' ? readRouteParams().est : undefined;
    return !!est && est !== 'sample' && est !== sampleBuilding.id && !resolveBuiltInSample(est, deletedSamples);
  }),[error,setError]=useState('');
  const [saving,setSaving]=useState(false),[tool,setTool]=useState<'closures'|'codes'|null>(null);
  const openTool=(next:'closures'|'codes')=>{setTool(next);if(toolsMenu.current)toolsMenu.current.open=false;};
  const toolsMenu=useRef<HTMLDetailsElement>(null);
  const current = BUILT_IN_SAMPLES.find(b => b.id === selected && !deletedSamples.includes(b.id))
    ?? library.find(b=>b.id===selected)
    ?? sampleBuilding;

  useEffect(()=>{loadBuildings().then(list=>{setLibrary(list);const est=readRouteParams().est;const builtin=resolveBuiltInSample(est,deletedSamples);if(builtin)setSelected(builtin.id);else{const shared=list.find(b=>b.id===est&&b.status==='ready');if(shared)setSelected(shared.id);}}).catch(()=>setError('Saved establishments could not be loaded. Browser storage must be available to save your plans.')).finally(()=>setLoading(false));},[deletedSamples]);
  const onSaved=useCallback((building:Building)=>setLibrary(old=>[...old.filter(b=>b.id!==building.id),building]),[]);
  const customBuildings = library.filter(b => !BUILT_IN_SAMPLES.some(s => s.id === b.id) && b.id !== sampleBuilding.id);
  useEffect(()=>{document.title=`${current.name||'New establishment'} · Project AKAY`;},[current.name]);
  const create=async()=>{
    const building=freshBuilding();setError('');
    try{await saveBuilding(building);onSaved(building);setSelected(building.id);setEditing(true);if(toolsMenu.current)toolsMenu.current.open=false;}
    catch{setError('Could not create a saved establishment. Check that browser storage is available.');}
  };

  const deleteFacility = async (building: Building) => {
    if (building.id === sampleBuilding.id) return;
    const name = building.name || 'this establishment';
    if (!window.confirm(`Are you sure you want to delete the facility "${name}"?`)) return;

    setError('');
    if (toolsMenu.current) toolsMenu.current.open = false;

    try {
      if (BUILT_IN_SAMPLES.some(s => s.id === building.id)) {
        const updated = [...new Set([...deletedSamples, building.id])];
        setDeletedSamples(updated);
        try { localStorage.setItem('deleted-sample-facilities', JSON.stringify(updated)); } catch {}
      } else {
        await deleteBuilding(building.id);
        setLibrary(prev => prev.filter(b => b.id !== building.id));
      }
      setSelected(sampleBuilding.id);
      setEditing(false);
    } catch {
      setError('Could not delete this facility. Browser storage might be unavailable.');
    }
  };

  const inStudio = editing && !current.sample;
  return <>
    {loading&&<SystemLoader buildingName={current.name||''} exiting={false} onSkip={()=>setLoading(false)}/>}
    <nav className={`workspace-bar ${inStudio ? 'is-studio-bar' : 'is-integrated-bar'}`} aria-label="Establishment workspace">
      <a className="workspace-brand" href="#workspace-content"><Buildings size={18}/><span>Project AKAY</span><small>Indoor Facility Finder</small></a>
      <div className="workspace-controls-cluster">
        <label className="workspace-picker">
          <span>Facility</span>
          <select
            disabled={loading||saving}
            value={current.id}
            onChange={e=>{
              const nextId=e.target.value;
              setSelected(nextId);
              if(BUILT_IN_SAMPLES.some(s=>s.id===nextId)||nextId===sampleBuilding.id){
                setEditing(false);
              }else{
                const b=library.find(item=>item.id===nextId);
                setEditing(b?.status==='draft');
              }
            }}
          >
            <optgroup label="Built-in samples">
              <option value={sampleBuilding.id}>Civic Center</option>
              {BUILT_IN_SAMPLES.filter(s => !deletedSamples.includes(s.id)).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
            {customBuildings.length > 0 && (
              <optgroup label="Saved establishments">
                {customBuildings.map(b=><option key={b.id} value={b.id}>{b.name||'Untitled establishment'}{b.status==='draft'?' (draft)':''}</option>)}
              </optgroup>
            )}
          </select>
        </label>
        <button
          type="button"
          className="workspace-new-btn"
          disabled={loading||saving}
          aria-label="New establishment"
          title="Add new establishment"
          onClick={create}
        >
          <Plus size={14} aria-hidden="true"/>
          <span>New</span>
        </button>
        {current.id !== sampleBuilding.id && (
          <button
            type="button"
            className="workspace-delete-facility-btn"
            disabled={loading||saving}
            title={`Delete ${current.name || 'facility'}`}
            aria-label={`Delete ${current.name || 'facility'}`}
            onClick={()=>deleteFacility(current)}
          >
            <Trash size={14} aria-hidden="true"/>
            <span>Delete</span>
          </button>
        )}
        <details className="workspace-tools" ref={toolsMenu}><summary aria-busy={saving}>{saving?'Saving…':<><SlidersHorizontal size={16} aria-hidden="true"/>Map tools</>}</summary><div className="workspace-actions">
          {!current.sample&&<button className="secondary-button" disabled={saving} onClick={()=>{if(editing&&current.status==='draft')setSelected(sampleBuilding.id);setEditing(v=>!v);if(toolsMenu.current)toolsMenu.current.open=false;}}>{editing?'Exit setup':'Manage floor plans'}</button>}
          <button className="secondary-button" disabled={loading||saving} onClick={create}><Plus size={16}/>New establishment</button>
          {current.id !== sampleBuilding.id && (
            <button
              type="button"
              className="secondary-button danger-button"
              disabled={loading||saving}
              onClick={()=>deleteFacility(current)}
            >
              <Trash size={16} aria-hidden="true"/>Delete facility
            </button>
          )}
          {BUILT_IN_SAMPLES.filter(s => deletedSamples.includes(s.id)).map(s => (
            <button
              key={s.id}
              type="button"
              className="secondary-button"
              onClick={()=>{
                const next = deletedSamples.filter(id => id !== s.id);
                setDeletedSamples(next);
                try {
                  if (next.length) localStorage.setItem('deleted-sample-facilities', JSON.stringify(next));
                  else localStorage.removeItem('deleted-sample-facilities');
                } catch {}
                setSelected(s.id);
                if (toolsMenu.current) toolsMenu.current.open = false;
              }}
            >
              Restore {s.name}
            </button>
          ))}
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
      {inStudio?<StudioBoundary key={current.id}><Suspense fallback={<SystemLoader buildingName={current.name||'Floor Plan Studio'} exiting={false} onSkip={()=>{}}/>}><FloorPlanStudio initial={current} onSaved={onSaved} onSaving={setSaving} onUse={b=>{onSaved(b);setSaving(false);setEditing(false);}}/></Suspense></StudioBoundary>:
        <BuildingContext.Provider value={current}><App key={`${current.id}:${current.updatedAt}`}/></BuildingContext.Provider>}
    </div>
  </>;
}
