import { formatDistance } from './format';
import { useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowsDownUp } from '@phosphor-icons/react/dist/csr/ArrowsDownUp';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { Info } from '@phosphor-icons/react/dist/csr/Info';
import { Wheelchair } from '@phosphor-icons/react/dist/csr/Wheelchair';
import { Elevator } from '@phosphor-icons/react/dist/csr/Elevator';
import { PersonSimpleWalk } from '@phosphor-icons/react/dist/csr/PersonSimpleWalk';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { Tree } from '@phosphor-icons/react/dist/csr/Tree';
import { MapTrifold } from '@phosphor-icons/react/dist/csr/MapTrifold';
import { Flask } from '@phosphor-icons/react/dist/csr/Flask';
import { Path } from '@phosphor-icons/react/dist/csr/Path';
import { Footprints } from '@phosphor-icons/react/dist/csr/Footprints';
import { LocationPicker } from './LocationPicker';
import { HotelMap } from './HotelMap';
import { ResearchView } from './ResearchView';
import { useBuilding } from './buildings';
import { findRoute } from './routing';
import { routeDirections, routeFeatures } from './directions';
import type { FloorId, RouteMode, RouteResult } from './types';

const compute = (hotel: import('./types').HotelGraph, start: string, end: string) => ({
  shortest: findRoute(hotel, start, end, 'shortest'),
  accessible: findRoute(hotel, start, end, 'accessible'),
});

export function App() {
  const { building, hotel, nodeById, facilities, floors } = useBuilding();
  const initialStart = building.sample ? 'reception' : facilities[0]?.id ?? '';
  const initialEnd = building.sample ? 'restaurant' : facilities[1]?.id ?? '';
  const [start, setStart] = useState(initialStart), [end, setEnd] = useState(initialEnd);
  const [mode, setMode] = useState<RouteMode>('accessible');
  const [routes, setRoutes] = useState<{ shortest: RouteResult; accessible: RouteResult } | null>(() => compute(hotel,initialStart,initialEnd));
  const [floor, setFloor] = useState<FloorId>(floors[0]?.id ?? 0), [view, setView] = useState<'guest' | 'research'>('guest');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [announcement, setAnnouncement] = useState('');
  const selected = routes?.[mode] ?? null, alternative = routes?.[mode === 'accessible' ? 'shortest' : 'accessible'] ?? null;
  const updateStart = (id: string) => { setStart(id); setRoutes(null); setError(''); };
  const updateEnd = (id: string) => { setEnd(id); setRoutes(null); setError(''); };
  const find = () => {
    if (!start || !end) { setError('Choose both a starting point and a destination.'); return; }
    setBusy(true); setError('');
    window.setTimeout(() => {
      const next = compute(hotel,start,end);
      setRoutes(next); setFloor(nodeById[start].floor); setBusy(false);
      const r = next[mode];
      setAnnouncement(r.status === 'found' ? `${mode === 'accessible' ? 'Accessible' : 'Shortest'} route found: ${formatDistance(r.distance ?? 0)} meters.` : r.message ?? 'No route found.');
    }, 100);
  };
  const changeView = (next: 'guest' | 'research') => { setView(next); window.scrollTo({ top: 0 }); };

  return <>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header">
      <a className="wordmark" href="#" onClick={event => { event.preventDefault(); changeView('guest'); }}>
        <span className="hotel-emblem" aria-hidden="true">{building.sample?<Tree size={28} weight="light" />:<MapTrifold size={28} weight="light" />}</span><span>{building.name}</span>
      </a>
      <nav aria-label="Main navigation">
        <button className={view === 'guest' ? 'active' : ''} aria-current={view === 'guest' ? 'page' : undefined} onClick={() => changeView('guest')}><MapTrifold size={19} aria-hidden="true" />Find your way</button>
        <button className={view === 'research' ? 'active' : ''} aria-current={view === 'research' ? 'page' : undefined} onClick={() => changeView('research')}><Flask size={18} aria-hidden="true" />Research view</button>
      </nav>
      <span className="demo-label"><span aria-hidden="true" />{building.sample ? 'Demonstration hotel' : 'Reviewed map'}</span>
    </header>
    <main id="main-content" tabIndex={-1}>
      {view === 'guest' ? <div className="guest-layout">
        <aside className="route-sidebar" aria-label="Plan your route">
          <div className="concierge-intro"><h1>A clear path to your destination.</h1><p>Find a route that suits your mobility needs.</p></div>
          <form onSubmit={event => { event.preventDefault(); find(); }}>
            <LocationPicker label="Starting point" value={start} onChange={updateStart} />
            <div className="swap-row"><button className="icon-button swap-button" type="button" aria-label="Swap starting point and destination" onClick={() => { setStart(end); setEnd(start); setRoutes(null); setError(''); }}><ArrowsDownUp size={20} aria-hidden="true" /></button></div>
            <LocationPicker label="Destination" value={end} onChange={updateEnd} />
            <button className="primary-button find-button" type="submit" disabled={busy}><Path size={22} aria-hidden="true" /><span>{busy ? 'Finding your route…' : 'Find route'}</span><ArrowRight size={20} aria-hidden="true" /></button>
            {error && <p className="form-error" role="alert"><Info size={18} />{error}</p>}
          </form>
          <div className="route-results" aria-label="Route results">
            {!routes ? <div className="route-empty"><span className="empty-map-icon"><MapPin size={27} weight="light" aria-hidden="true" /></span><p>Your next destination is set.</p><small>Select Find route to compare your options.</small></div> : <>
              <h2 className="results-heading">Choose your route</h2>
              <div className="route-choices" role="group" aria-label="Choose route type">
                {(['shortest', 'accessible'] as const).map(routeMode => {
                  const route = routes[routeMode], Icon = routeMode === 'shortest' ? Footprints : Wheelchair;
                  return <button key={routeMode} type="button" className={`route-choice ${mode === routeMode ? 'selected' : ''}`} aria-pressed={mode === routeMode} onClick={() => {
                    setMode(routeMode); setAnnouncement(`${routeMode === 'accessible' ? 'Accessible' : 'Shortest'} route selected. ${route.distance !== null ? `${formatDistance(route.distance ?? 0)} meters.` : route.message}`);
                  }}>
                    <span className="route-choice-icon"><Icon size={24} aria-hidden="true" /></span>
                    <span className="route-choice-copy"><strong>{routeMode === 'shortest' ? 'Shortest route' : 'Accessible route'}</strong><small>{routeFeatures(route,hotel)}</small></span>
                    <span className="route-choice-distance">{route.distance !== null ? <>{formatDistance(route.distance ?? 0)}<small>meters</small></> : <small>Unavailable</small>}</span>
                    <span className="selection-indicator" aria-hidden="true">{mode === routeMode && <Check size={11} weight="bold" />}</span>
                  </button>;
                })}
              </div>
              {selected?.status === 'found' ? <div className="directions-sheet">
                <div className="directions-heading"><Path size={20} aria-hidden="true" /><h2>Your directions</h2><span>{formatDistance(selected.distance ?? 0)} m</span></div>
                <ol className="directions" aria-label="Route directions">
                  {routeDirections(selected,hotel,floors).map((step, index) => {
                    const Icon = step.kind === 'elevator' ? Elevator : step.kind === 'stairs' ? PersonSimpleWalk : step.kind === 'ramp' ? Wheelchair : step.kind === 'arrive' ? Check : null;
                    return <li key={`${index}-${step.title}`} className={step.kind === 'arrive' ? 'arrival-step' : undefined}>
                      <span className="step-number">{Icon ? <Icon size={18} aria-hidden="true" /> : index + 1}</span>
                      <div><p>{step.title}</p><small>{step.detail}</small>{step.floor !== floor && <button className="text-button floor-link" onClick={() => setFloor(step.floor)}>Show this floor <ArrowUpRight size={13} aria-hidden="true" /></button>}</div>
                    </li>;
                  })}
                </ol>
              </div> : <div className="no-route" role="status"><Info size={23} weight="light" /><h3>{mode === 'accessible' ? 'No accessible route available' : 'No public route available'}</h3><p>{selected?.message}</p><small>{mode === 'accessible' && routes.shortest.status === 'found' ? 'A standard route exists, but some connections are not marked accessible.' : 'Try another destination or ask staff for assistance.'}</small></div>}
            </>}
          </div>
          <p className="sidebar-note"><Info size={15} />Routes use this map’s recorded access conditions.</p>
        </aside>
        <HotelMap floor={floor} onFloor={setFloor} route={selected} alternative={alternative} onDestination={updateEnd} />
      </div> : <>
        <ResearchView routes={routes} onBack={() => changeView('guest')} />
        <div className="research-graph-heading"><h2>Explore the mapped graph</h2><p>Connections are bidirectional. Select a floor to inspect its nodes and distance weights.</p></div>
        <HotelMap floor={floor} onFloor={setFloor} route={selected} alternative={alternative} onDestination={updateEnd} research />
      </>}
    </main>
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
  </>;
}
