import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { Printer } from '@phosphor-icons/react/dist/csr/Printer';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { buildingData, sampleEstParam, type Building } from './buildings';
import { closableEdges, closureLabel, useClosures } from './closures';
import { routeUrl } from './urlState';
import { FacilityIcon } from './FacilityIcon';

/** Native modal dialog shell shared by the staff tools. */
function StaffDialog({title,subtitle,onClose,children,className=''}:{title:string;subtitle:string;onClose:()=>void;children:ReactNode;className?:string}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=ref.current;if(d&&!d.open)d.showModal();},[]);
  return <dialog ref={ref} className={`staff-dialog ${className}`} onClose={onClose} onCancel={onClose} aria-labelledby="staff-dialog-title">
    <header><div><p className="setup-kicker">Staff tools</p><h2 id="staff-dialog-title">{title}</h2><p>{subtitle}</p></div><button type="button" className="icon-button" aria-label="Close" onClick={()=>ref.current?.close()}><X size={20}/></button></header>
    {children}
  </dialog>;
}

export function ClosuresDialog({building,onClose}:{building:Building;onClose:()=>void}){
  const {hotel,nodeById,floorName}=useMemo(()=>buildingData(building),[building]);
  const [closed,setClosed]=useClosures(building.id);
  const edges=closableEdges(hotel);
  const groups=(['elevator','ramp','stairs'] as const).map(kind=>({kind,edges:edges.filter(e=>e.kind===kind)})).filter(g=>g.edges.length);
  const toggle=(id:string)=>setClosed(closed.includes(id)?closed.filter(c=>c!==id):[...closed,id]);
  return <StaffDialog title="Service closures" subtitle="Mark an elevator, ramp or stair connection as temporarily out of service. Routes on this device avoid it immediately." onClose={onClose}>
    {!groups.length?<p className="dialog-empty">This map has no elevator, ramp or stair connections to close.</p>:groups.map(g=><fieldset key={g.kind} className="closure-group"><legend>{g.kind==='elevator'?'Elevators':g.kind==='ramp'?'Ramps':'Stairs and steps'}</legend>
      {g.edges.map(e=><label key={e.id} className="closure-toggle"><input type="checkbox" checked={closed.includes(e.id)} onChange={()=>toggle(e.id)}/><span>{closureLabel(e,nodeById,floorName)}</span><em>{closed.includes(e.id)?'Closed':'Open'}</em></label>)}
    </fieldset>)}
    <footer><p><Warning size={15} aria-hidden="true"/>Closures are stored in this browser only and are not shared with other devices.</p>{closed.length>0&&<button type="button" className="secondary-button" onClick={()=>setClosed([])}>Reopen all</button>}</footer>
  </StaffDialog>;
}

export function StartPointSheet({building,onClose}:{building:Building;onClose:()=>void}){
  const {facilities,floorName}=useMemo(()=>buildingData(building),[building]);
  const points=facilities.filter(n=>n.category!=='room');
  const [codes,setCodes]=useState<Record<string,string>>({}),[failed,setFailed]=useState(false);
  const est=sampleEstParam(building);
  useEffect(()=>{
    let alive=true;
    import('qrcode').then(async QR=>{
      const entries=await Promise.all(points.map(async n=>[n.id,await QR.toString(routeUrl({est,from:n.id}),{type:'svg',margin:1,errorCorrectionLevel:'M',color:{dark:'#234e3c',light:'#fffdf7'}})] as const));
      if(alive)setCodes(Object.fromEntries(entries));
    }).catch(()=>alive&&setFailed(true));
    return()=>{alive=false;};
  },[building.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return <StaffDialog className="qr-dialog" title="“You are here” codes" subtitle="Print and post these at each location. Scanning one opens the map with that place already set as the starting point." onClose={onClose}>
    {!building.sample&&<p className="dialog-warning"><Warning size={16} aria-hidden="true"/>This establishment is saved only in this browser. Codes will open its map on this device, but visitors’ phones need a published copy of the map.</p>}
    {failed&&<p className="dialog-warning">QR codes could not be generated. The links below still work.</p>}
    <div className="qr-grid">{points.map(n=><figure key={n.id} className="qr-card">
      {codes[n.id]?<div className="qr-code" dangerouslySetInnerHTML={{__html:codes[n.id]}}/>:<div className="qr-code qr-loading" aria-hidden="true"/>}
      <figcaption><span><FacilityIcon category={n.category} size={16}/>{n.name}</span><small>{floorName(n.floor)} · {building.name}</small><strong>You are here</strong></figcaption>
    </figure>)}</div>
    <footer><p>{points.length} start points</p><button type="button" className="primary-button compact" onClick={()=>window.print()}><Printer size={17} aria-hidden="true"/>Print codes</button></footer>
  </StaffDialog>;
}
