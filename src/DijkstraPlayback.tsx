import { useEffect, useMemo, useState } from 'react';
import { Play } from '@phosphor-icons/react/dist/csr/Play';
import { Pause } from '@phosphor-icons/react/dist/csr/Pause';
import { SkipBack } from '@phosphor-icons/react/dist/csr/SkipBack';
import { SkipForward } from '@phosphor-icons/react/dist/csr/SkipForward';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { Path } from '@phosphor-icons/react/dist/csr/Path';
import { Info } from '@phosphor-icons/react/dist/csr/Info';
import { HotelMap, type TraceOverlay } from './HotelMap';
import { useBuilding } from './buildings';
import { findRoute, type TraceStep } from './routing';
import { formatDistance } from './format';
import type { FloorId, HotelGraph, RouteMode, RouteResult } from './types';

const speeds = { slow: 1100, normal: 600, fast: 250 } as const;

/** Replays a recorded Dijkstra run on the research map, one settled node at a time. */
export function DijkstraPlayback({graph,start,end,mode,floor,onFloor,route,alternative,onDestination}:{
  graph:HotelGraph;start:string;end:string;mode:RouteMode;floor:FloorId;onFloor:(id:FloorId)=>void;
  route:RouteResult|null;alternative:RouteResult|null;onDestination:(id:string)=>void;
}){
  const { nodeById } = useBuilding();
  const [runMode,setRunMode]=useState<RouteMode>(mode), [index,setIndex]=useState(-1), [playing,setPlaying]=useState(false), [speed,setSpeed]=useState<keyof typeof speeds>('normal');
  const ready=!!(nodeById[start]&&nodeById[end]);

  // ALGORITHM USAGE & TRACE CAPTURE:
  // Runs findRoute() passing an empty steps array (`TraceStep[]`). Dijkstra records
  // each settled node and its relaxed edges into this array for step-by-step playback.
  const run=useMemo(()=>{
    const steps:TraceStep[]=[];
    const result=ready?findRoute(graph,start,end,runMode,steps):null;
    return {steps,result};
  },[graph,start,end,runMode,ready]);
  const total=run.steps.length, finished=index>=total&&total>0;
  useEffect(()=>{setIndex(-1);setPlaying(false);},[run]);
  useEffect(()=>{
    if(!playing)return;
    if(index>=total){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setIndex(i=>i+1),speeds[speed]);
    return()=>window.clearTimeout(timer);
  },[playing,index,total,speed]);
  const current=index>=0&&index<total?run.steps[index]:undefined;
  useEffect(()=>{if(current&&nodeById[current.node])onFloor(nodeById[current.node].floor);else if(finished&&run.result?.status==='found')onFloor(nodeById[run.result.nodeIds[0]].floor);},[current,finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const overlay=useMemo<TraceOverlay|null>(()=>{
    if(!current)return null;
    const settled=new Map<string,number>(), best=new Map<string,{distance:number;edgeId:string}>();
    for(let i=0;i<=index;i++){
      const s=run.steps[i];settled.set(s.node,s.distance);
      for(const r of s.relaxed){const known=best.get(r.node);if(!known||r.distance<known.distance)best.set(r.node,{distance:r.distance,edgeId:r.edgeId});}
    }
    const frontier=new Map<string,number>();for(const [id,v] of best)if(!settled.has(id))frontier.set(id,v.distance);
    return {current:current.node,settled,frontier,tree:new Set([...best.values()].map(v=>v.edgeId)),relaxed:new Set(current.relaxed.map(r=>r.edgeId))};
  },[current,index,run]);

  const toggle=()=>{if(finished||index<0&&!playing){setIndex(i=>i>=total?0:Math.max(i,0));}setPlaying(p=>!p);};
  const name=(id:string)=>nodeById[id]?.name??id;
  const shownRoute=finished?run.result:index<0?route:null;

  return <section className="playback" aria-labelledby="playback-title">
    <div className="research-graph-heading"><h2 id="playback-title">Watch Dijkstra find the route</h2><p>Replay how the algorithm settles the closest unvisited node first, updates its neighbours, and finally traces the shortest path back. Connections are bidirectional.</p></div>
    {!ready?<p className="playback-empty">Choose a starting point and destination in the guest view to replay the search.</p>:<div className="playback-console">
      <div className="playback-controls" role="group" aria-label="Playback controls">
        <div className="segmented" role="group" aria-label="Routing condition">{(['shortest','accessible'] as const).map(m=><button key={m} type="button" aria-pressed={runMode===m} onClick={()=>setRunMode(m)}>{m==='shortest'?'Shortest':'Accessible'}</button>)}</div>
        <button type="button" className="icon-button" aria-label="Previous step" disabled={index<=0} onClick={()=>{setPlaying(false);setIndex(i=>Math.max(0,Math.min(i,total)-1));}}><SkipBack size={18}/></button>
        <button type="button" className="primary-button compact play-button" onClick={toggle} aria-label={playing?'Pause':'Play'}>{playing?<Pause size={18} weight="fill"/>:<Play size={18} weight="fill"/>}{playing?'Pause':finished?'Replay':index<0?'Play':'Resume'}</button>
        <button type="button" className="icon-button" aria-label="Next step" disabled={index>=total} onClick={()=>{setPlaying(false);setIndex(i=>Math.min(total,i+1));}}><SkipForward size={18}/></button>
        <button type="button" className="icon-button" aria-label="Reset playback" disabled={index<0} onClick={()=>{setPlaying(false);setIndex(-1);}}><ArrowCounterClockwise size={18}/></button>
        <label className="playback-scrubber"><span className="sr-only">Playback position</span><input type="range" min={-1} max={total} value={index} onChange={e=>{setPlaying(false);setIndex(Number(e.target.value));}}/></label>
        <label className="playback-speed">Speed<select value={speed} onChange={e=>setSpeed(e.target.value as keyof typeof speeds)}><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select></label>
      </div>
      <div className="playback-status" aria-live="polite">
        {index<0?<p><Info size={16} aria-hidden="true"/> <strong>Ready.</strong> {total} nodes will be settled before {name(end)} is reached{run.result?.status!=='found'?' — or the search runs out of reachable nodes':''}.</p>
        :current?<><p><Path size={16} aria-hidden="true"/> <strong>Step {index+1} of {total}.</strong> Settle <em>{name(current.node)}</em> at {formatDistance(current.distance)} m — the smallest known distance in the queue.</p>
          <p className="playback-relaxed">{current.relaxed.length?<>Updated neighbours: {current.relaxed.map(r=>`${name(r.node)} → ${formatDistance(r.distance)} m`).join(' · ')}</>:current.node===end?'Destination settled: its distance is now final.':'No neighbour got a shorter distance.'}</p>
          <p className="playback-queue">In the queue: {overlay?.frontier.size??0} · Settled: {overlay?.settled.size??0}</p></>
        :<p><CheckCircle size={16} aria-hidden="true"/> <strong>{run.result?.status==='found'?`Done — ${formatDistance(run.result.distance??0)} m.`:'No route.'}</strong> {run.result?.status==='found'?'Following the stored predecessors from the destination back to the start gives the highlighted path.':run.result?.message}</p>}
      </div>
    </div>}
    <HotelMap floor={floor} onFloor={onFloor} route={shownRoute} alternative={index<0?alternative:null} onDestination={onDestination} research trace={overlay}/>
  </section>;
}
