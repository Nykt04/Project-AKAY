import { formatDistance } from './format';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowsIn } from '@phosphor-icons/react/dist/csr/ArrowsIn';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import { Elevator } from '@phosphor-icons/react/dist/csr/Elevator';
import { FlagCheckered } from '@phosphor-icons/react/dist/csr/FlagCheckered';
import { NavigationArrow } from '@phosphor-icons/react/dist/csr/NavigationArrow';
import { Prohibit } from '@phosphor-icons/react/dist/csr/Prohibit';
import { FacilityIcon } from './FacilityIcon';
import { MapTrifold } from '@phosphor-icons/react/dist/csr/MapTrifold';
import gsap from 'gsap';
import { edgeGeometry, type Point } from './geometry';
import { useBuilding } from './buildings';
import type { Edge, FloorId, RouteResult } from './types';

/** Snapshot of a Dijkstra run at one step, drawn over the research map. */
export interface TraceOverlay { current: string; settled: Map<string, number>; frontier: Map<string, number>; tree: Set<string>; relaxed: Set<string> }

const MAX_ZOOM = 3, PAD = 70;

export function HotelMap({floor,onFloor,route,alternative,onDestination,onStart,research=false,focusEdgeIds=null,fitKey='',closed=[],trace=null}:{
  floor:FloorId;onFloor:(id:FloorId)=>void;route:RouteResult|null;alternative:RouteResult|null;onDestination:(id:string)=>void;
  onStart?:(id:string)=>void;research?:boolean;focusEdgeIds?:string[]|null;fitKey?:string;closed?:readonly string[];trace?:TraceOverlay|null;
}){
  const { building, edgeById, facilities, floorName, floors, hotel, nodeById } = useBuilding();
  const plan=floors.find(f=>f.id===floor)??floors[0];
  const edgePoints=(edge:Edge)=>edgeGeometry(edge,nodeById).map(p=>p.join(',')).join(' ');
  const [zoom,setZoom]=useState(1), [failed,setFailed]=useState(false), [menu,setMenu]=useState<string|null>(null);
  const [switchingFloor,setSwitchingFloor]=useState(false);
  const svg=useRef<SVGSVGElement>(null), scroll=useRef<HTMLDivElement>(null), pendingCenter=useRef<Point|null>(null), drag=useRef<{x:number;y:number;left:number;top:number;moved:boolean}|null>(null);
  const onThisFloor=(e:Edge)=>nodeById[e.from]?.floor===floor&&nodeById[e.to]?.floor===floor;
  const localEdges=(result:RouteResult|null)=>result?.status==='found'?result.edgeIds.map(id=>edgeById[id]).filter(onThisFloor):[];
  const selectedEdges=localEdges(route), alternativeEdges=localEdges(alternative),start=route?.status==='found'?route.nodeIds[0]:undefined,end=route?.status==='found'?route.nodeIds.at(-1):undefined;
  const focusEdges=(focusEdgeIds??[]).map(id=>edgeById[id]).filter(Boolean);
  const routeFloors=route?.status==='found'?[...new Set(route.nodeIds.map(id=>nodeById[id].floor))]:[];
  const closedEdges=closed.map(id=>edgeById[id]).filter(Boolean);
  const closedNodes=[...new Set(closedEdges.filter(e=>!onThisFloor(e)).flatMap(e=>[e.from,e.to]).filter(id=>nodeById[id]?.floor===floor))];

  // Route drawing animation (skipped for reduced motion).
  useEffect(()=>{const context=gsap.context(()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;svg.current?.querySelectorAll<SVGPolylineElement>('.selected-path').forEach(path=>{const length=path.getTotalLength();gsap.fromTo(path,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:.8,ease:'power2.out',onComplete:()=>{path.style.strokeDasharray='';path.style.strokeDashoffset='';}});});},svg);return()=>context.revert();},[route,floor]);
  useEffect(()=>{setSwitchingFloor(true);const t=setTimeout(()=>setSwitchingFloor(false),220);return()=>clearTimeout(t);},[floor]);

  /** Points the camera should frame: the focused step if any, otherwise the route on this floor. */
  const framePoints=():Point[]=>{
    const pick=focusEdges.length?focusEdges:route?.status==='found'?route.edgeIds.map(id=>edgeById[id]):[];
    const points:Point[]=[];
    for(const e of pick){
      if(onThisFloor(e))points.push(...edgeGeometry(e,nodeById));
      else for(const id of [e.from,e.to])if(nodeById[id]?.floor===floor)points.push([nodeById[id].x,nodeById[id].y]);
    }
    return points;
  };
  const scrollToCenter=([x,y]:Point,z:number)=>{
    const el=scroll.current;if(!el)return;
    const scale=el.clientWidth*z/plan.width;
    const behavior:ScrollBehavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
    el.scrollTo({left:x*scale-el.clientWidth/2,top:y*scale-el.clientHeight/2,behavior});
  };
  // Zoom to fit the route (or the current step) whenever the floor, route or step changes.
  useEffect(()=>{
    setFailed(false);setMenu(null);
    const el=scroll.current;if(!el)return;
    const isMobileOverview=el.clientWidth>0&&el.clientWidth<=768&&!focusEdges.length;
    const points=research||trace||isMobileOverview?[]:framePoints();
    if(!points.length){pendingCenter.current=null;setZoom(1);el.scrollTo(0,0);return;}
    const xs=points.map(p=>p[0]), ys=points.map(p=>p[1]);
    const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
    const width=Math.max(maxX-minX+PAD*2,plan.width*.3), height=Math.max(maxY-minY+PAD*2,plan.height*.3);
    const maxHeight=parseFloat(getComputedStyle(el).maxHeight)||window.innerHeight*.72;
    const fit=Math.min(plan.width/width,(maxHeight/el.clientWidth)*plan.width/height);
    const next=Math.round(Math.max(1,Math.min(MAX_ZOOM,fit))*4)/4;
    const center:Point=[(minX+maxX)/2,(minY+maxY)/2];
    if(next===zoom)scrollToCenter(center,next);else{pendingCenter.current=center;setZoom(next);}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[floor,fitKey,research,!!trace]);
  useLayoutEffect(()=>{if(pendingCenter.current){scrollToCenter(pendingCenter.current,zoom);pendingCenter.current=null;}},[zoom]);
  useEffect(()=>{if(!menu)return;const close=(e:PointerEvent)=>{if(!(e.target as Element).closest?.('.map-pick-menu,.map-label'))setMenu(null);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenu(null);};document.addEventListener('pointerdown',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key);};},[menu]);

  // Mouse drag panning when zoomed in; touch keeps native scrolling.
  const onPointerDown=(e:ReactPointerEvent<HTMLDivElement>)=>{if(e.pointerType!=='mouse'||zoom<=1||e.button!==0||(e.target as Element).closest('button'))return;const el=scroll.current!;drag.current={x:e.clientX,y:e.clientY,left:el.scrollLeft,top:el.scrollTop,moved:false};};
  const onPointerMove=(e:ReactPointerEvent<HTMLDivElement>)=>{const d=drag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.hypot(dx,dy)<4)return;d.moved=true;scroll.current!.scrollTo(d.left-dx,d.top-dy);};
  const endDrag=()=>{drag.current=null;};
  const zoomBy=(delta:number)=>{const el=scroll.current;const next=Math.max(1,Math.min(MAX_ZOOM,zoom+delta));if(!el||next===zoom)return;const s=el.clientWidth*zoom/plan.width;pendingCenter.current=[(el.scrollLeft+el.clientWidth/2)/s,(el.scrollTop+el.clientHeight/2)/s];setZoom(next);};
  const pick=(id:string)=>{if(onStart)setMenu(m=>m===id?null:id);else onDestination(id);};
  const menuNode=menu?nodeById[menu]:undefined;

  return <section id="floor-map" tabIndex={-1} className={`map-panel ${research?'research-map':''}`} aria-label="Building floor map">
    <div className="map-heading"><div className="map-title"><span className="map-title-icon"><MapTrifold size={26} aria-hidden="true"/></span><div><h2>{floorName(floor)}</h2><p>{plan.description}</p></div></div>
      <div className="floor-tabs" role="group" aria-label="Choose floor">{floors.map(f=><button key={f.id} type="button" aria-label={`Show ${f.name.toLowerCase()}`} aria-pressed={floor===f.id} onClick={()=>onFloor(f.id)}>{f.short}{routeFloors.length>1&&routeFloors.includes(f.id)&&<span className="floor-route-dot"/>}</button>)}</div></div>
    {routeFloors.length>1&&<div className="floor-notice"><Elevator size={17}/>Your route continues across {routeFloors.length} floors. Use step-by-step directions to follow each floor.</div>}
    {routeFloors.length>0&&!routeFloors.includes(floor)&&<div className="map-floor-hint"><span>The selected route does not pass through this floor.</span><button className="text-button" onClick={()=>onFloor(routeFloors[0])}>Show route floor</button></div>}
    <div className={`map-scroll ${zoom>1?'is-zoomed':''}`} ref={scroll} tabIndex={0} role="region" aria-label="Scrollable floor plan; use zoom controls below" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerLeave={endDrag} onClickCapture={e=>{if(drag.current?.moved){e.stopPropagation();e.preventDefault();}}}>
      <div className={`map-canvas ${switchingFloor?'floor-switching':''}`} style={{width:`${zoom*100}%`,aspectRatio:`${plan.width}/${plan.height}`}}>
        <img className="floor-image" src={plan.image} alt="" draggable={false} onError={()=>setFailed(true)}/>
        {failed&&<div className="map-error">Map artwork could not load. The text directions remain available.</div>}
        <svg ref={svg} className="map-overlay" viewBox={`0 0 ${plan.width} ${plan.height}`} aria-hidden="true">
          {research&&hotel.edges.filter(onThisFloor).map(e=><g key={e.id}><polyline className={`graph-edge ${e.kind==='stairs'?'graph-stairs':''}`} points={edgePoints(e)}/>{!trace&&<text className="edge-weight" x={(nodeById[e.from].x+nodeById[e.to].x)/2+8} y={(nodeById[e.from].y+nodeById[e.to].y)/2-8}>{formatDistance(e.distance ?? 0)} m</text>}</g>)}
          {trace&&hotel.edges.filter(e=>onThisFloor(e)&&(trace.tree.has(e.id)||trace.relaxed.has(e.id))).map(e=><polyline key={`t-${e.id}`} className={trace.relaxed.has(e.id)?'trace-relaxed':'trace-tree'} points={edgePoints(e)}/>)}
          {closedEdges.filter(onThisFloor).map(e=><polyline key={`c-${e.id}`} className="closed-edge" points={edgePoints(e)}/>)}
          {!trace&&alternativeEdges.map(e=><polyline key={e.id} className="alternative-path" points={edgePoints(e)}/>)}
          {!trace&&selectedEdges.map(e=><polyline key={`halo-${e.id}`} className="path-halo" points={edgePoints(e)}/>)}
          {!trace&&selectedEdges.map(e=><polyline key={e.id} className="selected-path" points={edgePoints(e)}/>)}
          {!trace&&selectedEdges.map(e=><polyline key={`flow-${e.id}`} className="route-flow-line" points={edgePoints(e)}/>)}
          {!trace&&focusEdges.filter(onThisFloor).map(e=><polyline key={`f-${e.id}`} className="focus-path" points={edgePoints(e)}/>)}
          {research&&hotel.nodes.filter(n=>n.floor===floor).map(n=>{
            const settled=trace?.settled.get(n.id), frontier=trace?.frontier.get(n.id), isCurrent=trace?.current===n.id;
            const cls=isCurrent?'trace-current':settled!==undefined?'trace-settled':frontier!==undefined?'trace-frontier':'graph-node';
            const label=trace?(settled??frontier)!==undefined?`${formatDistance((settled??frontier)!)} m`:'':n.id;
            return <g key={n.id}><circle cx={n.x} cy={n.y} r={isCurrent?9:trace&&cls!=='graph-node'?6:4} className={cls}/>{label&&<text x={n.x+8} y={n.y-8} className={trace?'trace-label':'graph-label'}>{label}</text>}</g>;
          })}
          {!trace&&[...new Set([start,end])].filter(Boolean).map(id=>{
            const n=nodeById[id!];
            if(n.floor!==floor)return null;
            const isStart=id===start;
            return <g key={id} className={`map-endpoint ${isStart?'is-start':'is-destination'}`}>
              {isStart&&<circle cx={n.x} cy={n.y} r={14} className="start-radar-pulse"/>}
              <circle cx={n.x} cy={n.y} r={10} className="endpoint-halo"/>
              <circle cx={n.x} cy={n.y} r={7} className={id===end?'destination-dot':'start-dot'}/>
            </g>;
          })}
        </svg>
        {!research&&closedNodes.map(id=><span key={`cn-${id}`} className="map-annotation closed-annotation" style={{left:`${nodeById[id].x/plan.width*100}%`,top:`${(nodeById[id].y+34)/plan.height*100}%`}}><Prohibit size={12} aria-hidden="true"/>Out of service</span>)}
        {!research&&facilities.filter(n=>n.floor===floor).map(n=><button type="button" key={n.id} className={`map-label ${n.id===start||n.id===end?'endpoint-label':''}`} style={{left:`${(n.labelX??n.x)/plan.width*100}%`,top:`${(n.labelY??n.y)/plan.height*100}%`}} onClick={()=>pick(n.id)} aria-haspopup={onStart?'menu':undefined} aria-expanded={onStart?menu===n.id:undefined} aria-label={onStart?`${n.name}, ${floorName(floor)}: set as start or destination`:`Set destination to ${n.name}, ${floorName(floor)}`}><FacilityIcon category={n.category} size={23}/><span>{n.name}</span>{building.sample&&n.id==='reading-room'&&<small>Steps only</small>}{building.sample&&n.id==='private-room'&&<small>No public connection</small>}</button>)}
        {menuNode&&menuNode.floor===floor&&<div className="map-pick-menu" role="menu" aria-label={`${menuNode.name} options`} style={{left:`${(menuNode.labelX??menuNode.x)/plan.width*100}%`,top:`${(menuNode.labelY??menuNode.y)/plan.height*100}%`}}>
          <button role="menuitem" type="button" autoFocus onClick={()=>{onStart?.(menuNode.id);setMenu(null);}}><NavigationArrow size={16} aria-hidden="true"/>Start here</button>
          <button role="menuitem" type="button" onClick={()=>{onDestination(menuNode.id);setMenu(null);}}><FlagCheckered size={16} aria-hidden="true"/>Go here</button>
        </div>}
        {!research&&building.sample&&floor===0&&<><span className="map-annotation ramp-label" style={{left:'76.5%',top:'48%'}}>Ramp</span><span className="map-annotation" style={{left:'15%',top:'36%'}}>Steps</span></>}
      </div>
    </div>
    <div className="map-footer"><div className="map-legend">
      {trace?<><span><i className="legend-dot current"/>Settling now</span><span><i className="legend-dot settled"/>Settled (final distance)</span><span><i className="legend-dot frontier"/>In the queue</span><span><i className="legend-line tree"/>Best-known paths</span></>:<>
      <span><i className="legend-line"/>{route?.mode==='shortest'?'Shortest route':'Accessible route'}{route?.distance!=null?` (${formatDistance(route.distance ?? 0)} m)`:''}</span>
      {alternative?.status==='found'&&<span><i className="legend-line dashed"/>{alternative.mode==='shortest'?'Shortest route':'Accessible route'} ({formatDistance(alternative.distance ?? 0)} m)</span>}
      {focusEdges.length>0&&<span><i className="legend-line focus"/>Current step</span>}
      {closedEdges.length>0&&<span><i className="legend-line closed"/>Closed</span>}
      {research&&<span>Nodes and distances shown</span>}</>}
    </div><div className="zoom-controls"><button className="icon-button" aria-label="Zoom in" disabled={zoom>=MAX_ZOOM} onClick={()=>zoomBy(.5)}><Plus size={20}/></button><button className="icon-button" aria-label="Zoom out" disabled={zoom<=1} onClick={()=>zoomBy(-.5)}><Minus size={20}/></button><button className="icon-button reset-zoom" aria-label="Reset map zoom" onClick={()=>{pendingCenter.current=null;setZoom(1);scroll.current?.scrollTo(0,0);}}><ArrowsIn size={17}/></button></div></div>
    <p className="map-disclosure">{building.sample?'Sample layout and distances.':'Distances use the uploaded plan’s calibrated scale.'} {onStart?'Select a place on the map to start or end there.':'Select your starting point manually.'}</p>
    {!research&&<div className="facility-directory"><h3>Explore this floor</h3><div className="facility-shortcuts" aria-label="Facilities on this floor">{facilities.filter(n=>n.floor===floor && n.category!=='stairs' && n.category!=='elevator').map(n=><button key={n.id} type="button" onClick={()=>onDestination(n.id)} aria-label={`Choose ${n.name} as destination`}><FacilityIcon category={n.category} size={18}/>{n.name}</button>)}</div></div>}
  </section>;
}
