import { useEffect, useId, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { FacilityIcon } from './FacilityIcon';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { NavigationArrow } from '@phosphor-icons/react/dist/csr/NavigationArrow';
import { useBuilding } from './buildings';

export function LocationPicker({label,value,onChange,invalid=false}:{label:string;value:string;onChange:(id:string)=>void;invalid?:boolean}) {
  const { facilities, floorName, nodeById } = useBuilding();
  const [open,setOpen]=useState(false), [query,setQuery]=useState(''), [active,setActive]=useState(0);
  const root=useRef<HTMLDivElement>(null), input=useRef<HTMLInputElement>(null), trigger=useRef<HTMLButtonElement>(null),id=useId();
  const selected=nodeById[value];
  const isStart = label.toLowerCase().includes('start');
  const matches=facilities.filter(n=>`${n.name} ${floorName(n.floor)}`.toLowerCase().includes(query.trim().toLowerCase()));
  const activeId=matches[active]?`${id}-${matches[active].id}`:undefined;

  useEffect(()=>{if(open){setQuery('');setActive(0);input.current?.focus();}},[open]);
  useEffect(()=>{if(open&&activeId)document.getElementById(activeId)?.scrollIntoView({block:'nearest'});},[open,activeId]);
  useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);

  const choose=(next:string)=>{onChange(next);setOpen(false);trigger.current?.focus();};

  return <div className={`location-picker ${isStart ? 'picker-start' : 'picker-dest'}`} ref={root} onBlur={event=>{
    if(!event.currentTarget.contains(event.relatedTarget as Node|null))setOpen(false);
  }}>
    <div className="picker-label-row">
      <label id={`${id}-label`}>
        <span className={`picker-node-indicator ${isStart ? 'is-start' : 'is-dest'}`} aria-hidden="true">
          {isStart ? <NavigationArrow size={12} weight="bold" /> : <MapPin size={12} weight="bold" />}
        </span>
        {label}
      </label>
    </div>
    <div className="location-trigger-wrapper">
      <button ref={trigger} type="button" className={`location-trigger ${selected ? 'has-selection' : ''}`} aria-haspopup="listbox" aria-expanded={open}
        aria-controls={open?`${id}-list`:undefined} aria-invalid={invalid||undefined} aria-labelledby={`${id}-label ${id}-value`}
        onClick={()=>setOpen(!open)} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);}}}>
        <span className="picker-facility-icon">
          <FacilityIcon category={selected?.category} size={18} />
        </span>
        <span id={`${id}-value`} className={!selected?'placeholder':''}>
          {selected ? (
            <>
              <span className="picker-location-name">{selected.name}</span>
              <span className="picker-location-floor">{floorName(selected.floor)}</span>
            </>
          ) : 'Choose a location'}
        </span>
        <CaretDown size={16} className={`picker-caret ${open ? 'is-open' : ''}`} aria-hidden="true"/>
      </button>
      {selected && (
        <button type="button" className="picker-clear-btn" aria-label={`Clear ${label.toLowerCase()}`} onClick={(e) => { e.stopPropagation(); onChange(''); }}>
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
    {open&&<div className="location-popover">
      <div className="search-row"><MagnifyingGlass size={16} aria-hidden="true"/>
        <input ref={input} role="combobox" aria-label={`Search ${label.toLowerCase()}`} aria-autocomplete="list" aria-expanded="true"
          aria-controls={`${id}-list`} aria-activedescendant={activeId} value={query} placeholder="Search facility or floor…"
          onChange={event=>{setQuery(event.target.value);setActive(0);}}
          onKeyDown={event=>{
            if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus();}
            if(event.key==='ArrowDown'){event.preventDefault();setActive(i=>Math.max(0,Math.min(i+1,matches.length-1)));}
            if(event.key==='ArrowUp'){event.preventDefault();setActive(i=>Math.max(i-1,0));}
            if(event.key==='Enter'){event.preventDefault();if(matches[active])choose(matches[active].id);}
          }}/>
        {query&&<button type="button" className="icon-button" aria-label="Clear search" onClick={()=>{setQuery('');setActive(0);input.current?.focus();}}><X size={16} aria-hidden="true"/></button>}
      </div>
      <p className="picker-result-count" role="status">{matches.length} {matches.length===1?'location':'locations'}{query?' found':' available'}</p>
      <ul id={`${id}-list`} role="listbox" aria-label={label} className="location-list">
        {matches.map((node,index)=><li role="option" aria-selected={value===node.id} id={`${id}-${node.id}`} key={node.id} className={active===index?'is-active':''}>
          <button type="button" tabIndex={-1} onClick={()=>choose(node.id)} onPointerMove={()=>setActive(index)}>
            <FacilityIcon category={node.category} size={18}/><span>{node.name}<small>{floorName(node.floor)}</small></span>{value===node.id&&<Check size={16} aria-hidden="true"/>}
          </button>
        </li>)}
        {!matches.length&&<li className="search-empty" role="presentation">No matching locations. Try a facility name or a floor.</li>}
      </ul>
      <div className="picker-footer"><span>Arrow keys to browse · Enter to select</span>{selected&&<button type="button" className="text-button" onClick={()=>choose('')}>Clear {label.toLowerCase()}</button>}</div>
    </div>}
  </div>;
}
