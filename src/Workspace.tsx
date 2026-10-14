import { useCallback, useEffect, useState } from 'react';
import { Buildings } from '@phosphor-icons/react/dist/csr/Buildings';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { App } from './App';
import { FloorPlanStudio } from './FloorPlanStudio';
import { BuildingContext, loadBuildings, sampleBuilding, saveBuilding, type Building } from './buildings';
import { freshBuilding } from './buildingEditor';

export function Workspace() {
  const [library,setLibrary]=useState<Building[]>([]),[selected,setSelected]=useState(sampleBuilding.id);
  const [editing,setEditing]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const current=library.find(b=>b.id===selected)??sampleBuilding;
  useEffect(()=>{loadBuildings().then(setLibrary).catch(()=>setError('Saved establishments could not be loaded. Browser storage must be available to save your plans.')).finally(()=>setLoading(false));},[]);
  const onSaved=useCallback((building:Building)=>setLibrary(old=>[...old.filter(b=>b.id!==building.id),building]),[]);
  useEffect(()=>{document.title=`${current.name} · Indoor wayfinding`;},[current.name]);
  const create=async()=>{
    const building=freshBuilding();setError('');
    try{await saveBuilding(building);onSaved(building);setSelected(building.id);setEditing(true);}
    catch{setError('Could not create a saved establishment. Check that browser storage is available.');}
  };
  return <>
    <nav className="workspace-bar" aria-label="Establishment workspace">
      <a className="workspace-brand" href="#workspace-content"><Buildings size={23}/><span>Indoor wayfinding<small>Accessible paths, place by place</small></span></a>
      <label className="workspace-picker">Establishment<select disabled={loading||saving} value={current.id} onChange={e=>{setSelected(e.target.value);const b=library.find(item=>item.id===e.target.value);setEditing(b?.status==='draft');}}><option value={sampleBuilding.id}>Linden Hotel · sample</option>{library.map(b=><option key={b.id} value={b.id}>{b.name||'Untitled establishment'}{b.status==='draft'?' · draft':''}</option>)}</select></label>
      <div className="workspace-actions">
        {!current.sample&&<button className="secondary-button" disabled={saving||current.status==='draft'&&editing} onClick={()=>setEditing(v=>!v)}>{editing?'Guest view':'Manage floor plans'}</button>}
        <button className="secondary-button" disabled={loading||saving} onClick={create}><Plus size={17}/>New establishment</button>
      </div>
    </nav>
    {error&&<p className="workspace-error" role="alert">{error}</p>}
    <div id="workspace-content" tabIndex={-1}>
      {editing&&!current.sample?<FloorPlanStudio key={current.id} initial={current} onSaved={onSaved} onSaving={setSaving} onUse={b=>{onSaved(b);setSaving(false);setEditing(false);}}/>:
        <BuildingContext.Provider value={current}><App key={`${current.id}:${current.updatedAt}`}/></BuildingContext.Provider>}
    </div>
  </>;
}
