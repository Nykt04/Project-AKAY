import { formatDistance } from './format';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { ArrowsDownUp } from '@phosphor-icons/react/dist/csr/ArrowsDownUp';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { Info } from '@phosphor-icons/react/dist/csr/Info';
import { Wheelchair } from '@phosphor-icons/react/dist/csr/Wheelchair';
import { Elevator } from '@phosphor-icons/react/dist/csr/Elevator';
import { Stairs } from '@phosphor-icons/react/dist/csr/Stairs';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { Tree } from '@phosphor-icons/react/dist/csr/Tree';
import { MapTrifold } from '@phosphor-icons/react/dist/csr/MapTrifold';
import { Flask } from '@phosphor-icons/react/dist/csr/Flask';
import { Path } from '@phosphor-icons/react/dist/csr/Path';
import { Footprints } from '@phosphor-icons/react/dist/csr/Footprints';
import { ShareNetwork } from '@phosphor-icons/react/dist/csr/ShareNetwork';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { ListBullets } from '@phosphor-icons/react/dist/csr/ListBullets';
import { Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { Compass } from '@phosphor-icons/react/dist/csr/Compass';
import { NavigationArrow } from '@phosphor-icons/react/dist/csr/NavigationArrow';
import { FacilityIcon } from './FacilityIcon';
import { LocationPicker } from './LocationPicker';
import { HotelMap } from './HotelMap';
import { ResearchView } from './ResearchView';
import { DijkstraPlayback } from './DijkstraPlayback';
import { useBuilding } from './buildings';
import { findRoute } from './routing';
import { routeDirections, routeFeatures } from './directions';
import { applyClosures, closureLabel, useClosures } from './closures';
import { readRouteParams, writeRouteParams } from './urlState';
import type { FloorId, HotelGraph, RouteMode } from './types';

/**
 * ============================================================================
 * [ALGORITHM APPLICATION: PARALLEL SHORTEST VS. ACCESSIBLE EXECUTION]
 * Runs Dijkstra twice (`shortest` and `accessible`) on every selection so the
 * user and instructor can compare both decisions side by side in real time.
 * ============================================================================
 */
const compute = (hotel: HotelGraph, start: string, end: string) => ({
  shortest: findRoute(hotel, start, end, 'shortest'),
  accessible: findRoute(hotel, start, end, 'accessible'),
});

export function App() {
  const { building, hotel, nodeById, edgeById, facilities, floors, floorName } = useBuilding();
  // A QR code or shared link may preselect locations: ?from=lobby&to=restaurant&mode=shortest
  const [initial] = useState(() => {
    const params = readRouteParams(), sameBuilding = !params.est || params.est === building.id || (building.sample && params.est === 'sample');
    const valid = (id?: string) => sameBuilding && id && nodeById[id]?.facility ? id : undefined;
    return {
      start: valid(params.from) ?? (building.sample ? 'main-entrance' : facilities[0]?.id ?? ''),
      end: valid(params.to) ?? (params.from && valid(params.from) ? '' : building.sample ? 'library' : facilities[1]?.id ?? ''),
      mode: params.mode ?? 'accessible' as RouteMode,
      view: params.view ?? 'guest',
    };
  });
  const [start, setStart] = useState(initial.start), [end, setEnd] = useState(initial.end);
  const [mode, setMode] = useState<RouteMode>(initial.mode);
  const [floor, setFloor] = useState<FloorId>(nodeById[initial.start]?.floor ?? floors[0]?.id ?? 0), [view, setView] = useState<'guest' | 'research'>(initial.view);
  const [error, setError] = useState(''), [announcement, setAnnouncement] = useState(''), [copied, setCopied] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [swapping, setSwapping] = useState(false);
  const directionsRef = useRef<HTMLDivElement>(null);
  const [closed] = useClosures(building.id);
  const activeGraph = useMemo(() => applyClosures(hotel, closed), [hotel, closed]);

  // ALGORITHM USAGE:
  // Evaluates Dijkstra as soon as valid start and destination nodes exist in the active graph.
  const routes = useMemo(() => start && end && nodeById[start] && nodeById[end] ? compute(activeGraph, start, end) : null, [activeGraph, start, end, nodeById]);

  // DECISION MAKING (User UI):
  // User selects active mode ('accessible' vs 'shortest'); 'alternative' shows the opposite for comparison.
  const selected = routes?.[mode] ?? null, alternative = routes?.[mode === 'accessible' ? 'shortest' : 'accessible'] ?? null;
  const directions = useMemo(() => selected ? routeDirections(selected,activeGraph,floors) : [], [selected,activeGraph,floors]);
  const features = useMemo(() => routes ? {
    shortest: routeFeatures(routes.shortest,activeGraph), accessible: routeFeatures(routes.accessible,activeGraph),
  } : null, [routes,activeGraph]);
  const activeStep = step !== null ? directions[step] : undefined;
  const closedLabels = useMemo(() => closed.map(id => edgeById[id]).filter(Boolean).map(e => closureLabel(e, nodeById, floorName)), [closed, edgeById, nodeById, floorName]);
  const quickPresets = useMemo(() => facilities.filter(f => f.category !== 'stairs' && f.category !== 'elevator' && f.id !== start).slice(0, 4), [facilities, start]);

  // New endpoints or mode: leave step mode and show the starting floor.
  useEffect(() => { setStep(null); if (nodeById[start]) setFloor(nodeById[start].floor); }, [start, end, mode, nodeById]);
  useEffect(() => { setStep(s => s !== null && s >= directions.length ? null : s); }, [directions.length]);
  useEffect(() => { writeRouteParams({ est: building.sample ? undefined : building.id, from: start || undefined, to: end || undefined, mode: mode === 'accessible' ? undefined : mode, view: view === 'guest' ? undefined : view }); }, [building, start, end, mode, view]);
  useEffect(() => {
    if (!routes) return;
    const r = routes[mode];
    setAnnouncement(r.status === 'found' ? `${mode === 'accessible' ? 'Accessible' : 'Shortest'} route: ${formatDistance(r.distance ?? 0)} meters.` : r.message ?? 'No route found.');
  }, [routes, mode]);

  const updateStart = (id: string) => { setStart(id); setError(''); };
  const updateEnd = (id: string) => { setEnd(id); setError(''); };
  const goToStep = (index: number) => {
    const next = directions[index]; if (!next) return;
    setStep(index); setFloor(next.floor);
    setAnnouncement(`Step ${index + 1} of ${directions.length}. ${next.title}. ${next.detail}`);
  };
  const submit = () => {
    if (!start || !end) { setError('Choose both a starting point and a destination.'); return; }
    setError('');
    if (selected?.status === 'found') { goToStep(0); directionsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
    else if (selected) setAnnouncement(selected.message ?? 'No route found.');
  };
  const share = async () => {
    const url = window.location.href, title = `Route to ${nodeById[end]?.name ?? 'destination'} · ${building.name}`;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setAnnouncement('Route link copied.'); window.setTimeout(() => setCopied(false), 2400); }
    } catch { /* share sheet dismissed or clipboard blocked */ }
  };
  const changeView = (next: 'guest' | 'research') => { setView(next); window.scrollTo({ top: 0 }); };
  const routeFound = selected?.status === 'found';

  return <>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header">
      <a className="wordmark" href="#" onClick={event => { event.preventDefault(); changeView('guest'); }}>
        <span className="hotel-emblem" aria-hidden="true">{building.sample?<Tree size={18} />:<MapTrifold size={18} />}</span><span>{building.name}</span>
      </a>
      <nav aria-label="Main navigation">
        <button className={view === 'guest' ? 'active' : ''} aria-current={view === 'guest' ? 'page' : undefined} onClick={() => changeView('guest')}><MapTrifold size={16} aria-hidden="true" />Find your way</button>
        <button className={view === 'research' ? 'active' : ''} aria-current={view === 'research' ? 'page' : undefined} onClick={() => changeView('research')}><Flask size={16} aria-hidden="true" />Research view</button>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      {view === 'guest' ? <div className="guest-layout">
        <aside className="route-sidebar" aria-label="Plan your route">
          <div className="concierge-intro">
            <h1>Navigate the Civic Center, step-free or shortest path.</h1>
            <p>Compare accessible ramp and elevator routes against direct stair paths in exact meters.</p>
          </div>
          {closedLabels.length > 0 && <div className="service-notice" role="note"><Warning size={16} aria-hidden="true" /><div><strong>Service notice</strong><ul>{closedLabels.map(label => <li key={label}>{label} — temporarily closed</li>)}</ul><small>Routes below avoid these connections.</small></div></div>}
          
          <form onSubmit={event => { event.preventDefault(); submit(); }}>
            <div className="transit-journey-box">
              <LocationPicker label="Starting point" value={start} onChange={updateStart} invalid={!!error&&!nodeById[start]} />
              <div className="swap-row">
                <button
                  className={`icon-button swap-button ${swapping ? 'is-spinning' : ''}`}
                  type="button"
                  aria-label="Swap starting point and destination"
                  onClick={() => { setSwapping(s => !s); setStart(end); setEnd(start); setError(''); }}
                >
                  <ArrowsDownUp size={16} aria-hidden="true" />
                </button>
              </div>
              <LocationPicker label="Destination" value={end} onChange={updateEnd} invalid={!!error&&!nodeById[end]} />
            </div>

            {quickPresets.length > 0 && (
              <div className="quick-presets" aria-label="Popular destinations">
                <span className="presets-label"><Compass size={14} aria-hidden="true" /> Popular destinations</span>
                <div className="preset-chips">
                  {quickPresets.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`preset-chip ${end === preset.id ? 'is-selected' : ''}`}
                      onClick={() => updateEnd(preset.id)}
                      aria-label={`Select ${preset.name} as destination`}
                    >
                      <FacilityIcon category={preset.category} size={14} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="route-results" aria-label="Route results">
              {!routes ? <div className="route-empty"><span className="empty-map-icon"><MapPin size={22} aria-hidden="true" /></span><p>Where would you like to go?</p><small>{start||end?'Choose the other location above, or select a place on the map.':'Choose a starting point and destination above.'}</small></div> : <>
                <div className="results-heading-row"><h2 className="results-heading">Choose your route</h2>{routeFound&&<button type="button" className={`text-button share-button ${copied ? 'is-copied' : ''}`} onClick={share}>{copied?<Check size={14} aria-hidden="true"/>:<ShareNetwork size={14} aria-hidden="true"/>}{copied?'Link copied':'Share route'}</button>}</div>
                <p className="route-choice-hint">Accessible routes exclude stairs and connections not marked accessible.</p>
                {/* [DECISION COMPARISON UI: SIDE-BY-SIDE ROUTE CARDS] */}
                <div className="route-choices" role="group" aria-label="Choose route type">
                  {(['shortest', 'accessible'] as const).map(routeMode => {
                    const route = routes[routeMode], Icon = routeMode === 'shortest' ? Footprints : Wheelchair;
                    const estMinutes = route.distance !== null ? Math.max(1, Math.round(route.distance / 70)) : null;
                    return <button key={routeMode} type="button" className={`route-choice ${mode === routeMode ? 'selected' : ''}`} aria-pressed={mode === routeMode} onClick={() => setMode(routeMode)}>
                      <span className="route-choice-icon"><Icon size={20} aria-hidden="true" /></span>
                      <span className="route-choice-copy">
                        <strong>{routeMode === 'shortest' ? 'Shortest route' : 'Accessible route'}</strong>
                        <small>{features?.[routeMode]}</small>
                        {estMinutes !== null && <span className="route-est-time"><Clock size={12} aria-hidden="true" />~{estMinutes} min walk</span>}
                      </span>
                      <span className="route-choice-distance">{route.distance !== null ? <>{formatDistance(route.distance ?? 0)}<small>m</small></> : <small>Unavailable</small>}</span>
                      <span className="selection-indicator" aria-hidden="true">{mode === routeMode && <Check size={11} weight="bold" />}</span>
                    </button>;
                  })}
                </div>

                <button className="primary-button find-button" type="submit">
                  <Path size={18} aria-hidden="true" />
                  <span>{routeFound ? 'Start step-by-step' : 'Find route'}</span>
                  <span className="cta-arrow-badge" aria-hidden="true"><ArrowRight size={16} /></span>
                </button>
                {error && <p className="form-error" role="alert"><Info size={16} />{error}</p>}

                {routeFound && <nav className="route-jump-links" aria-label="Route shortcuts"><a href="#floor-map"><MapTrifold size={16} aria-hidden="true"/>View map</a><a href="#route-directions"><Path size={16} aria-hidden="true"/>Read directions</a></nav>}
                {routeFound ? <div className="directions-sheet" id="route-directions" tabIndex={-1} ref={directionsRef}>
                  <div className="directions-heading"><Path size={18} aria-hidden="true" /><h2>Turn-by-turn directions</h2><span>{formatDistance(selected.distance ?? 0)} m</span></div>
                  {step !== null && activeStep ? <div className="step-navigator" role="group" aria-label="Step-by-step directions">
                    <div className="step-progress"><span>Step {step + 1} of {directions.length}</span><span>{floorName(activeStep.floor)}</span></div>
                    <div className="step-progress-bar" aria-hidden="true"><i style={{ width: `${(step + 1) / directions.length * 100}%` }} /></div>
                    <div className="step-badge-row">
                      <span className={`step-kind-badge kind-${activeStep.kind}`}>
                        {activeStep.kind === 'elevator' ? <Elevator size={14} aria-hidden="true" /> : activeStep.kind === 'stairs' ? <Stairs size={14} aria-hidden="true" /> : activeStep.kind === 'ramp' ? <Wheelchair size={14} aria-hidden="true" /> : activeStep.kind === 'arrive' ? <Check size={14} aria-hidden="true" /> : <NavigationArrow size={14} aria-hidden="true" />}
                        <span>{activeStep.kind === 'elevator' ? 'Elevator transfer' : activeStep.kind === 'stairs' ? 'Stairs' : activeStep.kind === 'ramp' ? 'Ramp' : activeStep.kind === 'arrive' ? 'Destination' : 'Follow corridor'}</span>
                      </span>
                      {activeStep.distance > 0 && <span className="step-dist-badge">{formatDistance(activeStep.distance)} m</span>}
                    </div>
                    <p className="step-current">{activeStep.title}</p><small>{activeStep.detail}</small>
                    <div className="step-controls">
                      <button type="button" className="secondary-button" disabled={step === 0} onClick={() => goToStep(step - 1)}><ArrowLeft size={14} aria-hidden="true" />Back</button>
                      <button type="button" className="text-button" onClick={() => { setStep(null); setAnnouncement('Showing the whole route.'); }}><ListBullets size={14} aria-hidden="true" />Overview</button>
                      {step < directions.length - 1 ? <button type="button" className="primary-button compact" onClick={() => goToStep(step + 1)}>Next<ArrowRight size={14} aria-hidden="true" /></button>
                        : <button type="button" className="primary-button compact" onClick={() => { setStep(null); setAnnouncement('You have arrived.'); }}><Check size={14} aria-hidden="true" />Done</button>}
                    </div>
                  </div> : null}
                  <ol className="directions" aria-label="Route directions">
                    {directions.map((item, index) => {
                      const Icon = item.kind === 'elevator' ? Elevator : item.kind === 'stairs' ? Stairs : item.kind === 'ramp' ? Wheelchair : item.kind === 'arrive' ? Check : item.kind === 'start' ? NavigationArrow : null;
                      return <li key={`${index}-${item.title}`} className={[item.kind === 'arrive' ? 'arrival-step' : '', step === index ? 'is-current' : '', step !== null && index < step ? 'is-done' : ''].filter(Boolean).join(' ') || undefined} aria-current={step === index ? 'step' : undefined}>
                        <span className="step-number">{Icon ? <Icon size={14} aria-hidden="true" /> : index + 1}</span>
                        <div><button type="button" className="step-title" onClick={() => goToStep(index)}>{item.title}</button><small>{item.detail}</small>{item.floor !== floor && step === null && <button className="text-button floor-link" onClick={() => setFloor(item.floor)}>Show this floor <ArrowUpRight size={12} aria-hidden="true" /></button>}</div>
                      </li>;
                    })}
                  </ol>
                </div> : <div className="no-route" role="status"><Info size={20} /><h3>{mode === 'accessible' ? 'No accessible route available' : 'No public route available'}</h3><p>{selected?.message}</p><small>{mode === 'accessible' && routes.shortest.status === 'found' ? 'A standard route exists, but some connections are not marked accessible.' : closedLabels.length ? 'A temporary closure may be blocking this route. Ask staff for assistance.' : 'Try another destination or ask staff for assistance.'}</small></div>}
              </>}
            </div>
          </form>
        </aside>
        <HotelMap floor={floor} onFloor={setFloor} route={selected} alternative={step === null ? alternative : null} onDestination={updateEnd} onStart={updateStart}
          focusEdgeIds={activeStep?.edgeIds ?? null} fitKey={`${mode}|${start}|${end}|${step ?? 'all'}|${closed.join(',')}`} closed={closed} />
      </div> : <>
        <ResearchView routes={routes} onBack={() => changeView('guest')} />
        <DijkstraPlayback graph={activeGraph} start={start} end={end} mode={mode} floor={floor} onFloor={setFloor} route={selected} alternative={alternative} onDestination={updateEnd} />
      </>}
    </main>
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
  </>;
}
