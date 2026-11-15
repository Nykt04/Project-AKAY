import { formatDistance } from './format';
import { useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { XCircle } from '@phosphor-icons/react/dist/csr/XCircle';
import { Flask } from '@phosphor-icons/react/dist/csr/Flask';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { useBuilding } from './buildings';
import { runScenarios } from './scenarios';
import type { RouteMode, RouteResult } from './types';

export function buildResearchExport(
  buildingName: string,
  results: ReturnType<typeof runScenarios>
) {
  return {
    filename: 'project-akay-routing-results.json',
    payload: {
      system: 'Project AKAY — Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm',
      facility: buildingName.trim() || 'Unnamed establishment',
      benchmarkSample: 'Civic Center',
      measuredAt: new Date().toISOString(),
      note: 'Predefined software tests against the fixed benchmark sample; not participant research results or building certification.',
      results,
    },
  };
}

export function ResearchView({
  routes,
  mode = 'accessible',
  onBack,
}: {
  routes: { shortest: RouteResult; accessible: RouteResult } | null;
  mode?: RouteMode;
  onBack: () => void;
}) {
  const { building, hotel, nodeById, edgeById, floors } = useBuilding();
  const [results, setResults] = useState<ReturnType<typeof runScenarios> | null>(null);
  const [running, setRunning] = useState(false);
  const inspected = routes
    ? (routes[mode].edgeIds.length ? routes[mode] : routes[mode === 'accessible' ? 'shortest' : 'accessible'])
    : null;

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      setResults(runScenarios());
      setRunning(false);
    }, 80);
  };

  const download = () => {
    if (!results) return;
    const { filename, payload } = buildResearchExport(building.name, results);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="research-content">
      <div className="research-title">
        <div>
          <h1>Routing graph &amp; accessibility verification.</h1>
          <p>Project AKAY — Accessibility-Aware Indoor Facility Finder System Using Dijkstra’s Algorithm. Inspect {building.name.trim() || 'this establishment'}’s metric floor-plan graph and scenario checks.</p>
        </div>
        <button className="text-button" onClick={onBack}>
          Back to wayfinding <ArrowRight size={16} />
        </button>
      </div>

      <section className="research-explanation">
        <h2>One map. Two routing conditions.</h2>
        <p>
          Dijkstra’s algorithm minimizes the sum of mapped distances. The accessible run first removes stairs and
          connections marked inaccessible. Elevator links use illustrative vertical distances, not travel or waiting
          times.
        </p>
        <dl className="graph-stats">
          <div>
            <dt>Mapped nodes</dt>
            <dd>{hotel.nodes.length}</dd>
          </div>
          <div>
            <dt>Connections</dt>
            <dd>{hotel.edges.length}</dd>
          </div>
          <div>
            <dt>Floors</dt>
            <dd>{floors.length}</dd>
          </div>
          <div>
            <dt>Edge weights</dt>
            <dd>Meters</dd>
          </div>
        </dl>
      </section>

      <section className="research-section">
        <h2>Current route comparison</h2>
        {!routes ? (
          <p>Choose locations and find a route in the guest view first.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <caption className="sr-only">Current route measurements</caption>
              <thead>
                <tr>
                  <th>Routing mode</th>
                  <th>Distance</th>
                  <th>Computation</th>
                  <th>Nodes visited</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(routes).map(r => (
                  <tr key={r.mode}>
                    <th>{r.mode === 'shortest' ? 'Shortest route' : 'Accessible route'}</th>
                    <td>{r.distance === null ? '—' : `${formatDistance(r.distance ?? 0)} m`}</td>
                    <td>{r.computationMs < 0.01 ? '< 0.01' : r.computationMs.toFixed(2)} ms</td>
                    <td>{r.visitedNodes}</td>
                    <td>
                      {r.status === 'found'
                        ? 'Route found'
                        : r.status === 'unreachable'
                          ? 'No suitable route'
                          : 'Invalid selection'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="caption">
          Elapsed browser computation includes input validation and graph filtering. It varies by device and is not a
          walking-time estimate.
        </p>
      </section>

      <section className="research-section">
        <div className="section-heading">
          <div>
            <h2>Reference test scenarios</h2>
            <p>These fixed sample and synthetic graph tests check the algorithm. They do not validate an uploaded building.</p>
          </div>
          <button className="primary-button compact" onClick={run} disabled={running} aria-busy={running}>
            <Flask size={16} />
            {running ? 'Running tests…' : 'Run tests'}
          </button>
        </div>

        {!results ? (
          <div className="test-empty">
            <Flask size={22} />
            <p>Run the scenarios to check distances, accessibility and unavailable routes.</p>
          </div>
        ) : (
          <>
            <div className="test-summary" role="status">
              <CheckCircle size={20} />
              <strong>
                {results.filter(r => r.passed).length} of {results.length} scenarios passed
              </strong>
              <button className="text-button" onClick={download}>
                <DownloadSimple size={17} />
                Export results
              </button>
            </div>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">Scenario test results</caption>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Expected</th>
                    <th>Actual</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.name}>
                      <th>{r.name}</th>
                      <td>{r.expected}</td>
                      <td>
                        {r.result.status === 'found'
                          ? `${formatDistance(r.result.distance ?? 0)} m`
                          : r.result.status === 'invalid'
                            ? 'Invalid input / graph'
                            : 'No suitable route'}
                      </td>
                      <td>
                        <span className={`test-result ${r.passed ? 'pass' : 'fail'}`}>
                          {r.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}{' '}
                          {r.passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {inspected && (
        <details className="research-section">
          <summary>
            Inspect the selected route connections ({inspected.mode === 'shortest' ? 'Shortest route' : 'Accessible route'})
          </summary>
          <div className="table-scroll">
            <table>
              <caption className="sr-only">
                {inspected.mode === 'shortest' ? 'Shortest' : 'Accessible'} route graph connections
              </caption>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Type</th>
                  <th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {inspected.edgeIds.map((id, i) => {
                  const e = edgeById[id];
                  return (
                    <tr key={id}>
                      <td>{nodeById[inspected.nodeIds[i]].name}</td>
                      <td>{nodeById[inspected.nodeIds[i + 1]].name}</td>
                      <td>{e.kind}</td>
                      <td>{formatDistance(e.distance ?? 0)} m</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!inspected.edgeIds.length && <p>No route connections in the current result.</p>}
        </details>
      )}

      <p className="research-disclaimer">
        {building.sample
          ? 'This is a built-in sample establishment with manually configured accessibility conditions.'
          : 'This uploaded map uses access conditions entered by its author.'}{' '}
        These checks validate Project AKAY’s routing software; they are not participant-study findings or a certification of
        building accessibility.
      </p>
    </div>
  );
}
