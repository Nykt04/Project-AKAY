import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BUILT_IN_SAMPLES,
  buildingData,
  campusBuilding,
  mallBuilding,
  resolveBuiltInSample,
  sampleBuilding,
  sampleEstParam,
  sampleMatchesEst,
} from '../src/buildings';
import { CAMPUS_SCALE, campusFloors, campusGraph } from '../src/campusPlan';
import { applyClosures, closureLabel } from '../src/closures';
import { Workspace } from '../src/Workspace';
import { findRoute, validateGraph } from '../src/routing';
import { edgeGeometry } from '../src/geometry';

test('Multi-Building Campus building metadata, BP 344 floors, and SVG escaping match spec', () => {
  assert.equal(campusBuilding.id, 'multi-building-campus-bp344');
  assert.equal(campusBuilding.name, 'Multi-Building Campus (BP 344)');
  assert.equal(campusBuilding.status, 'ready');
  assert.equal(campusBuilding.sample, true);
  assert.equal(CAMPUS_SCALE, 20);
  assert.equal(campusFloors.length, 4);
  assert.deepEqual(campusFloors.map(f => f.id), [0, 1, 2, 3]);
  assert.deepEqual(campusFloors.map(f => f.short), ['1F', '2F', '3F', '4F']);

  for (const floor of campusFloors) {
    assert.equal(floor.width, 1440);
    assert.equal(floor.height, 800);
    assert.equal(floor.metersPerPixel, 0.05);
    assert.ok(floor.image.startsWith('data:image/svg+xml;utf8,'));
    const svg = decodeURIComponent(floor.image.slice('data:image/svg+xml;utf8,'.length));
    assert.ok(svg.includes('<svg') && svg.includes('viewBox="0 0 1440 800"'));
    assert.ok(!svg.includes(' & '), `floor ${floor.short} contains unescaped ampersand`);
  }

  const f0Svg = decodeURIComponent(campusFloors[0].image.slice('data:image/svg+xml;utf8,'.length));
  assert.ok(f0Svg.includes('1:12') && f0Svg.includes('PWD'));
  const f3Svg = decodeURIComponent(campusFloors[3].image.slice('data:image/svg+xml;utf8,'.length));
  assert.ok(f3Svg.includes('Open Area') && f3Svg.includes('Garden Area') && f3Svg.includes('No Access'));
});

test('campusGraph passes strict validateGraph walkableAreas and cross-floor vertical alignment', () => {
  assert.deepEqual(validateGraph(campusGraph), []);
  // Building 2 stops at 3F (floor 2); zero nodes/edges in Building 2 footprint on 4F (floor 3).
  const b2OnRoof = campusGraph.nodes.filter(n => n.floor === 3 && n.x >= 40 * CAMPUS_SCALE);
  assert.deepEqual(b2OnRoof, []);
});

test('all requested rooms and vertical/ramp cores exist across Building 1 (1F-4F) and Building 2 (1F-3F)', () => {
  const names = new Set(campusGraph.nodes.map(n => `${n.floor}:${n.name}`));
  const required: [number, string][] = [
    // Campus ground
    [0, 'Campus PWD Parking'],
    // Building 1
    [0, 'B1 Main Entrance'],
    [0, 'Registrar'],
    [0, 'Stockroom'],
    [0, 'Cafeteria Dining Hall'],
    [0, 'Cafeteria Counter & Kitchen'],
    [0, 'B1 Comfort Room'],
    [0, 'B1 Elevator'],
    [0, 'B1 Stairs'],
    [1, 'Classroom B1-201'],
    [1, 'Classroom B1-202'],
    [1, 'Classroom B1-203'],
    [1, 'Faculty Room'],
    [1, 'B1 Comfort Room'],
    [1, 'B1 Elevator'],
    [1, 'B1 Stairs'],
    [2, 'Classroom B1-301'],
    [2, 'Classroom B1-302'],
    [2, 'Classroom B1-303'],
    [2, 'Classroom B1-304'],
    [2, 'B1 Comfort Room'],
    [2, 'B1 Elevator'],
    [2, 'B1 Stairs'],
    [3, 'Rooftop Open Area'],
    [3, 'Rooftop Garden Area'],
    [3, 'B1 Elevator'],
    [3, 'B1 Stairs'],
    // Building 2
    [0, 'B2 Main Entrance'],
    [0, 'Classroom B2-101'],
    [0, 'Classroom B2-102'],
    [0, 'Classroom B2-103'],
    [0, "Principal's Office"],
    [0, 'B2 Comfort Room'],
    [0, 'B2 Elevator'],
    [0, 'B2 Stairs'],
    [1, 'Classroom B2-201'],
    [1, 'Classroom B2-202'],
    [1, 'Classroom B2-203'],
    [1, 'Computer Laboratory'],
    [1, 'B2 Comfort Room'],
    [1, 'B2 Elevator'],
    [1, 'B2 Stairs'],
    [2, 'Classroom B2-301'],
    [2, 'Classroom B2-302'],
    [2, 'Classroom B2-303'],
    [2, 'Classroom B2-304'],
    [2, 'B2 Elevator'],
    [2, 'B2 Stairs'],
  ];

  for (const [floor, label] of required) {
    assert.ok(names.has(`${floor}:${label}`), `missing ${label} on floor ${floor}`);
  }
});

test('shortest vs accessible routing uses 1:12 ramps and elevators step-free inside and across buildings', () => {
  const edgeById = Object.fromEntries(campusGraph.edges.map(e => [e.id, e]));

  // PWD Parking -> B1 3F Classroom B1-304
  const b1Short = findRoute(campusGraph, 'campus-pwd-parking', 'b1-304', 'shortest');
  const b1Acc = findRoute(campusGraph, 'campus-pwd-parking', 'b1-304', 'accessible');
  assert.equal(b1Short.status, 'found');
  assert.equal(b1Acc.status, 'found');
  assert.ok(b1Short.edgeIds.some(id => edgeById[id].kind === 'stairs'));
  assert.ok(b1Acc.edgeIds.every(id => edgeById[id].kind !== 'stairs'));
  assert.ok(b1Acc.edgeIds.some(id => edgeById[id].kind === 'ramp'));
  assert.ok(b1Acc.edgeIds.some(id => edgeById[id].kind === 'elevator'));
  assert.ok(b1Short.distance < b1Acc.distance);

  // PWD Parking -> B2 2F Computer Laboratory
  const b2Short = findRoute(campusGraph, 'campus-pwd-parking', 'b2-computer-lab', 'shortest');
  const b2Acc = findRoute(campusGraph, 'campus-pwd-parking', 'b2-computer-lab', 'accessible');
  assert.equal(b2Short.status, 'found');
  assert.equal(b2Acc.status, 'found');
  assert.ok(b2Short.edgeIds.some(id => edgeById[id].kind === 'stairs'));
  assert.ok(b2Acc.edgeIds.every(id => edgeById[id].kind !== 'stairs'));
  assert.ok(b2Acc.edgeIds.some(id => edgeById[id].kind === 'ramp'));
  assert.ok(b2Acc.edgeIds.some(id => edgeById[id].kind === 'elevator'));

  // Cross-building 1F -> 1F (B1 Registrar -> B2 Principal's Office)
  const xShort = findRoute(campusGraph, 'b1-registrar', 'b2-principal-office', 'shortest');
  const xAcc = findRoute(campusGraph, 'b1-registrar', 'b2-principal-office', 'accessible');
  assert.equal(xShort.status, 'found');
  assert.equal(xAcc.status, 'found');
  assert.ok(xShort.nodeIds.includes('campus-plaza-curb'));
  assert.ok(xAcc.nodeIds.includes('campus-plaza-curb'));
  assert.equal(xAcc.edgeIds.filter(id => edgeById[id].kind === 'ramp').length, 2);
  assert.equal(xAcc.edgeIds.filter(id => edgeById[id].kind === 'stairs').length, 0);

  // Cross-building upper to rooftop (B2 3F Classroom B2-304 -> B1 4F Rooftop Garden Area)
  const roofShort = findRoute(campusGraph, 'b2-304', 'b1-roof-garden', 'shortest');
  const roofAcc = findRoute(campusGraph, 'b2-304', 'b1-roof-garden', 'accessible');
  assert.equal(roofShort.status, 'found');
  assert.equal(roofAcc.status, 'found');
  assert.ok(roofAcc.edgeIds.every(id => edgeById[id].kind !== 'stairs'));
  assert.ok(roofAcc.edgeIds.some(id => edgeById[id].kind === 'elevator'));
});

test('all facility pairs in both modes never double back or overshoot a doorway/landing', () => {
  const facilities = campusGraph.nodes.filter(n => n.facility);
  const nodes = Object.fromEntries(campusGraph.nodes.map(node => [node.id, node]));
  const edges = Object.fromEntries(campusGraph.edges.map(edge => [edge.id, edge]));
  for (const mode of ['shortest', 'accessible'] as const) {
    for (const a of facilities) {
      for (const b of facilities) {
        const route = findRoute(campusGraph, a.id, b.id, mode);
        assert.equal(route.status, 'found', `${mode} ${a.id} -> ${b.id} unreachable`);
        let points: [number, number][] = [];
        const check = () => {
          const p = points.filter((pt, i) => i === 0 || pt[0] !== points[i - 1][0] || pt[1] !== points[i - 1][1]);
          for (let i = 2; i < p.length; i++) {
            const u = [p[i - 1][0] - p[i - 2][0], p[i - 1][1] - p[i - 2][1]];
            const v = [p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]];
            const cross = u[0] * v[1] - u[1] * v[0];
            const dot = u[0] * v[0] + u[1] * v[1];
            assert.ok(!(cross === 0 && dot < 0), `${mode} ${a.id} -> ${b.id} doubles back at ${p[i - 1]}`);
          }
        };
        route.edgeIds.forEach((id, i) => {
          const from = nodes[route.nodeIds[i]];
          const to = nodes[route.nodeIds[i + 1]];
          if (from.floor !== to.floor) { check(); points = []; return; }
          const geometry = edgeGeometry(edges[id], nodes);
          points.push(...(edges[id].from === from.id ? geometry : [...geometry].reverse()));
        });
        check();
      }
    }
  }
});

test('Cafeteria Counter branches strictly off Dining Hall and all classrooms/offices are degree-1 terminal destinations', () => {
  const degree = (id: string) => campusGraph.edges.filter(e => e.from === id || e.to === id);
  const counterEdges = degree('b1-cafeteria-counter');
  assert.equal(counterEdges.length, 1);
  assert.ok(counterEdges[0].from === 'b1-cafeteria-dining' || counterEdges[0].to === 'b1-cafeteria-dining');

  const terminalIds = [
    'b1-registrar', 'b1-stockroom', 'b1-faculty', 'b2-principal-office', 'b2-computer-lab',
    'b1-201', 'b1-202', 'b1-203', 'b1-301', 'b1-302', 'b1-303', 'b1-304',
    'b2-101', 'b2-102', 'b2-103', 'b2-201', 'b2-202', 'b2-203', 'b2-301', 'b2-302', 'b2-303', 'b2-304',
  ];
  for (const id of terminalIds) {
    assert.equal(degree(id).length, 1, `expected terminal degree 1 for ${id}`);
  }
});

test('built-in sample registry and ?est URL alias helpers resolve campus and mall without breaking Civic Center', () => {
  assert.ok(BUILT_IN_SAMPLES.some(b => b.id === mallBuilding.id));
  assert.ok(BUILT_IN_SAMPLES.some(b => b.id === campusBuilding.id));
  assert.equal(resolveBuiltInSample('campus', [])?.id, campusBuilding.id);
  assert.equal(resolveBuiltInSample('campus', [campusBuilding.id]), undefined);
  assert.equal(resolveBuiltInSample('grand-mall', [])?.id, mallBuilding.id);
  assert.equal(resolveBuiltInSample('mall', [])?.id, mallBuilding.id);

  assert.equal(sampleEstParam(sampleBuilding), undefined);
  assert.equal(sampleEstParam(campusBuilding), 'campus');
  assert.equal(sampleEstParam(mallBuilding), 'mall');

  assert.equal(sampleMatchesEst('campus', campusBuilding), true);
  assert.equal(sampleMatchesEst('campus', sampleBuilding), false);
  assert.equal(sampleMatchesEst(undefined, sampleBuilding), true);
});

test('vertical closure labels disambiguate B1 vs B2 cores and closing B1 elevator isolates upper B1 accessible routes', () => {
  const { nodeById, edgeById, floorName } = buildingData(campusBuilding);
  const b1Label = closureLabel(edgeById['b1-elev-0--1'], nodeById, floorName);
  const b2Label = closureLabel(edgeById['b2-elev-0--1'], nodeById, floorName);
  assert.notEqual(b1Label, b2Label);
  assert.ok(b1Label.includes('B1 Elevator') && b2Label.includes('B2 Elevator'));

  const closed = applyClosures(campusGraph, ['b1-elev-0--1']);
  assert.equal(findRoute(closed, 'campus-pwd-parking', 'b1-304', 'accessible').status, 'unreachable');
  assert.equal(findRoute(closed, 'campus-pwd-parking', 'b1-304', 'shortest').status, 'found');
  assert.equal(findRoute(closed, 'campus-pwd-parking', 'b2-computer-lab', 'accessible').status, 'found');
});

test('Workspace initializes Multi-Building Campus synchronously when ?est=campus is present', () => {
  const g = globalThis as { window?: unknown };
  const prevWindow = g.window;
  g.window = {
    location: { search: '?est=campus', href: 'http://localhost/?est=campus' },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    history: { replaceState: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  try {
    const html = renderToStaticMarkup(createElement(Workspace));
    assert.ok(html.includes('Multi-Building Campus (BP 344)'), 'expected Campus selected synchronously on SSR');
    assert.ok(html.includes('Computer Laboratory'), 'expected Campus destination in initial route');
  } finally {
    if (prevWindow === undefined) delete g.window;
    else g.window = prevWindow;
  }
});

test('facility pill anchors on each floor separate adjacent room labels vertically to avoid horizontal overlap', () => {
  for (const floor of [0, 1, 2, 3]) {
    const nodes = campusGraph.nodes.filter(n => n.facility && n.floor === floor);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = Math.abs((a.labelX ?? a.x) - (b.labelX ?? b.x));
        const dy = Math.abs((a.labelY ?? a.y) - (b.labelY ?? b.y));
        const minClearX = (Math.min(a.name.length, b.name.length) <= 12 ? 8.5 : 12.0) * CAMPUS_SCALE;
        if (dx < minClearX) {
          assert.ok(dy >= 3.2 * CAMPUS_SCALE, `floor ${floor} pills overlap: ${a.name} vs ${b.name} (dx=${dx / CAMPUS_SCALE}m, dy=${dy / CAMPUS_SCALE}m)`);
        }
      }
    }
  }
});
