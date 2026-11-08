import test from 'node:test';
import assert from 'node:assert/strict';
import { hotel, facilities } from '../src/hotel.ts';
import { findRoute, validateGraph, type TraceStep } from '../src/routing.ts';
import { routeDirections } from '../src/directions.ts';
import { applyClosures } from '../src/closures.ts';
import { runScenarios, routeInvariant } from '../src/scenarios.ts';
import { edgeGeometry, segmentIsWalkable } from '../src/geometry.ts';
import { civicRooms, civicDimensions, renderFloorSvg, floorSvgDataUrl, px } from '../src/civicPlan.ts';
import type { HotelGraph } from '../src/types.ts';

test('civic plan stacks 2nd and 3rd floor restrooms identically and encodes metric dimension lines in SVG', () => {
  const rest1 = civicRooms.find(r => r.id === 'restroom-1')!;
  const rest2 = civicRooms.find(r => r.id === 'restroom-2')!;
  assert.ok(rest1 && rest2);
  assert.deepEqual(
    { x: rest1.x, y: rest1.y, w: rest1.w, h: rest1.h, door: rest1.door },
    { x: rest2.x, y: rest2.y, w: rest2.w, h: rest2.h, door: rest2.door },
  );
  assert.ok(civicDimensions.length > 0);
  for (const floor of [0, 1, 2] as const) {
    const svg = renderFloorSvg(floor);
    assert.ok(svg.startsWith('<svg') && svg.includes('viewBox="0 0 1200 1000"'));
    assert.ok(svg.includes('40.0 m') && svg.includes('3.0 m'));
    assert.equal(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/.test(svg), false, `Unescaped XML ampersand on floor ${floor}`);
    const dataUrl = floorSvgDataUrl(floor);
    assert.ok(dataUrl.startsWith('data:image/svg+xml;utf8,') && !dataUrl.slice(24).includes('#'));
  }
  assert.ok(renderFloorSvg(0).includes('FIRE') && renderFloorSvg(0).includes('RESCUE'));
  assert.ok(renderFloorSvg(0).includes('1:12'));
});

test('walkable geometry rejects a wall between valid endpoints, including thin walls', () => {
  const areas = [
    { name: 'Left corridor', x: 0, y: 0, width: 4, height: 10 },
    { name: 'Right corridor', x: 4.01, y: 0, width: 6, height: 10 },
    { name: 'Doorway', x: 4, y: 4, width: 0.01, height: 2 },
  ];
  assert.equal(segmentIsWalkable([1, 2], [9, 2], areas), false);
  assert.equal(segmentIsWalkable([1, 5], [9, 5], areas), true);
  assert.equal(segmentIsWalkable([1, 1], [9, 9], areas), true);
  assert.equal(segmentIsWalkable([1, 1], [9, 3], areas), false);
});

test('outdoor parking route uses front steps in shortest mode and 1:12 ramp in accessible mode', () => {
  const shortest = findRoute(hotel, 'parking-lot', 'main-entrance', 'shortest');
  const accessible = findRoute(hotel, 'parking-lot', 'main-entrance', 'accessible');
  assert.equal(shortest.status, 'found');
  assert.equal(shortest.distance, 14);
  assert.ok(shortest.edgeIds.includes('steps-out-bot--plaza-entry-j'));
  assert.equal(accessible.status, 'found');
  assert.equal(accessible.distance, 37);
  assert.ok(accessible.edgeIds.includes('ramp-out-top--ramp-out-bot'));

  const pwdShort = findRoute(hotel, 'pwd-parking', 'main-entrance', 'shortest');
  const pwdAcc = findRoute(hotel, 'pwd-parking', 'main-entrance', 'accessible');
  assert.equal(pwdShort.distance, 23);
  assert.equal(pwdAcc.distance, 28);
  assert.ok(pwdAcc.edgeIds.includes('ramp-out-top--ramp-out-bot'));
});

test('interior 1st floor route uses lobby steps in shortest mode and interior ramp in accessible mode', () => {
  const shortest = findRoute(hotel, 'main-entrance', 'lift-0', 'shortest');
  const accessible = findRoute(hotel, 'main-entrance', 'lift-0', 'accessible');
  assert.equal(shortest.status, 'found');
  assert.equal(shortest.distance, 33);
  assert.ok(shortest.edgeIds.includes('lobby-center-j--f0-steps-j'));
  assert.equal(accessible.status, 'found');
  assert.equal(accessible.distance, 46);
  assert.ok(accessible.edgeIds.includes('lobby-east-j--f0-ramp-j'));
});

test('souvenir shop route passes through the glass doorway and rejects glass wall crossings outside the door', () => {
  for (const mode of ['shortest', 'accessible'] as const) {
    const route = findRoute(hotel, 'main-entrance', 'souvenir-shop', mode);
    assert.equal(route.status, 'found');
    assert.equal(route.distance, 13.5);
  }
  const throughGlassWall: HotelGraph = {
    ...hotel,
    edges: hotel.edges.map(edge =>
      edge.to === 'souvenir-shop' ? { ...edge, via: [[px(34), px(17.5)]] as [number, number][] } : edge,
    ),
  };
  assert.ok(validateGraph(throughGlassWall).some(error => error.includes('souvenir-shop')));
  assert.equal(findRoute(throughGlassWall, 'main-entrance', 'souvenir-shop', 'accessible').status, 'invalid');
});

test('all civic rooms enter through their mapped doorway apertures and reject wall shortcuts', () => {
  const nodes = Object.fromEntries(hotel.nodes.map(node => [node.id, node]));
  const roomIds = ['souvenir-shop', 'restroom-1', 'library', 'office-a', 'office-b', 'restroom-2', 'hall-1', 'hall-2', 'hall-3', 'hall-4'];
  for (const id of roomIds) {
    const room = civicRooms.find(r => r.id === id)!;
    assert.ok(room?.door, `missing door metadata for ${id}`);
    const entry = hotel.edges.find(e => e.to === id || e.from === id)!;
    const points = edgeGeometry(entry, nodes);
    const verticalWall = room.door.wall === 'east' || room.door.wall === 'west';
    const axis = verticalWall ? 0 : 1;
    const boundary = px(verticalWall ? room.door.x : room.door.y);
    const center = px(verticalWall ? room.door.y : room.door.x);
    const half = px(room.door.width) / 2;
    const crossesDoor = points.slice(1).some((point, i) => {
      const start = points[i], delta = point[axis] - start[axis];
      if (delta === 0) return false;
      const t = (boundary - start[axis]) / delta;
      const other = 1 - axis, crossing = start[other] + t * (point[other] - start[other]);
      return t >= 0 && t <= 1 && crossing >= center - half && crossing <= center + half;
    });
    assert.ok(crossesDoor, `${id} misses its doorway aperture`);
  }

  const badWallShortcut: HotelGraph = {
    ...hotel,
    edges: [
      ...hotel.edges,
      { id: 'bad-lobby-wall-shortcut', from: 'f0-stairs-j', to: 'lobby-west-j', distance: 5, kind: 'corridor', accessible: true, traversable: true },
    ],
  };
  assert.ok(validateGraph(badWallShortcut).some(error => error.includes('bad-lobby-wall-shortcut')));
});

test('public rooms and facilities are terminal destinations rather than corridor shortcuts', () => {
  const terminalIds = ['info-desk', 'lounge', 'souvenir-shop', 'restroom-1', 'library', 'office-a', 'office-b', 'restroom-2', 'hall-1', 'hall-2', 'hall-3', 'hall-4'];
  for (const id of terminalIds) {
    assert.equal(
      hotel.edges.filter(edge => edge.traversable && (edge.from === id || edge.to === id)).length,
      1,
      id,
    );
  }
});

test('corridor gap dimension labels match exact routing graph edge distances on every floor', () => {
  const nodes = Object.fromEntries(hotel.nodes.map(n => [n.id, n]));
  const gaps = civicDimensions.filter(d => d.kind === 'gap');
  assert.ok(gaps.length >= 14);
  for (const gap of gaps) {
    const x1 = px(gap.x1), x2 = px(gap.x2), y = px(gap.y1);
    const matching = hotel.edges.find(e => {
      const a = nodes[e.from], b = nodes[e.to];
      return a.floor === gap.floor && b.floor === gap.floor && a.y === y && b.y === y
        && ((a.x === x1 && b.x === x2) || (a.x === x2 && b.x === x1));
    });
    assert.ok(matching, `Missing corridor edge for gap ${gap.label} on floor ${gap.floor}`);
    assert.equal(matching.distance, gap.meters);
  }
});

test('hotel graph is valid', () => assert.deepEqual(validateGraph(hotel), []));

test('improved queued distances and zero-cost cycles retain the shortest path', () => {
  const graph: HotelGraph = {
    nodes: ['s', 'a', 'b', 'c', 'z'].map(id => ({ id, name: id, floor: 0, x: 0, y: 0 })),
    edges: [['s', 'a', 10], ['s', 'b', 1], ['b', 'a', 1], ['a', 'c', 0], ['c', 'b', 0], ['c', 'z', 2]].map(([a, b, d], i) => ({
      id: `e${i}`, from: String(a), to: String(b), distance: Number(d), kind: 'corridor', accessible: true, traversable: true,
    })),
  };
  for (const mode of ['shortest', 'accessible'] as const) {
    const route = findRoute(graph, 's', 'z', mode);
    assert.equal(route.distance, 3);
    assert.deepEqual(route.nodeIds, ['s', 'b', 'c', 'z']);
    assert.ok(routeInvariant(graph, route));
    assert.equal(route.visitedNodes, 5);
  }
});

test('each route observes changed permissions and revalidates changed geometry', () => {
  const graph = structuredClone(hotel);
  assert.equal(findRoute(graph, 'main-entrance', 'souvenir-shop', 'accessible').status, 'found');
  for (const edge of graph.edges) edge.reviewed = false;
  assert.equal(findRoute(graph, 'main-entrance', 'souvenir-shop', 'accessible').status, 'unreachable');
  for (const edge of graph.edges) edge.reviewed = true;
  const entry = graph.edges.find(edge => edge.to === 'office-a')!;
  entry.via = [[px(8), px(22)]];
  assert.equal(findRoute(graph, 'lift-1', 'office-a', 'accessible').status, 'invalid');
});

for (const scenario of runScenarios()) test(scenario.name, () => assert.ok(scenario.passed, JSON.stringify({ name: scenario.name, expected: scenario.expected, result: scenario.result })));

test('every facility pair obeys distance, connectivity and accessibility invariants', () => {
  for (const a of facilities) for (const b of facilities) {
    const standard = findRoute(hotel, a.id, b.id, 'shortest'), accessible = findRoute(hotel, a.id, b.id, 'accessible');
    assert.ok(routeInvariant(hotel, standard)); assert.ok(routeInvariant(hotel, accessible));
    if (accessible.status === 'found') { assert.equal(standard.status, 'found'); assert.ok(accessible.distance! >= standard.distance!); }
    assert.equal(findRoute(hotel, b.id, a.id, 'shortest').distance, standard.distance);
  }
});

test('Dijkstra agrees with independent Floyd-Warshall oracle for all hotel nodes', () => {
  for (const mode of ['shortest', 'accessible'] as const) {
    const ids = hotel.nodes.map(n => n.id), matrix = ids.map((_, i) => ids.map((__, j) => i === j ? 0 : Infinity));
    for (const e of hotel.edges) if (e.traversable && (mode === 'shortest' || (e.accessible && e.kind !== 'stairs'))) {
      const a = ids.indexOf(e.from), b = ids.indexOf(e.to);
      matrix[a][b] = Math.min(matrix[a][b], e.distance);
      matrix[b][a] = Math.min(matrix[b][a], e.distance);
    }
    for (let k = 0; k < ids.length; k++) for (let i = 0; i < ids.length; i++) for (let j = 0; j < ids.length; j++) matrix[i][j] = Math.min(matrix[i][j], matrix[i][k] + matrix[k][j]);
    for (let i = 0; i < ids.length; i++) for (let j = 0; j < ids.length; j++) {
      const r = findRoute(hotel, ids[i], ids[j], mode);
      assert.equal(r.distance, Number.isFinite(matrix[i][j]) ? Math.round(matrix[i][j] * 100) / 100 : null, `${mode} ${ids[i]} to ${ids[j]}`);
    }
  }
});

test('Dijkstra trace records settled nodes in non-decreasing distance order and direction steps partition route edges', () => {
  const trace: TraceStep[] = [];
  const route = findRoute(hotel, 'main-entrance', 'hall-2', 'accessible', trace);
  assert.equal(route.status, 'found');
  assert.equal(trace.length, route.visitedNodes);
  assert.equal(trace[0].node, 'main-entrance');
  assert.equal(trace.at(-1)?.node, 'hall-2');
  for (let i = 1; i < trace.length; i++) assert.ok(trace[i].distance >= trace[i - 1].distance);
  const steps = routeDirections(route, hotel);
  assert.deepEqual(steps.flatMap(s => s.edgeIds), route.edgeIds);
});

test('closing the 1st-to-2nd floor elevator removes accessible upper-floor routes while leaving 1st floor routes intact', () => {
  const closed = applyClosures(hotel, ['lift-0--lift-1']);
  assert.equal(findRoute(closed, 'main-entrance', 'souvenir-shop', 'accessible').status, 'found');
  assert.equal(findRoute(closed, 'main-entrance', 'library', 'accessible').status, 'unreachable');
  assert.equal(findRoute(closed, 'main-entrance', 'library', 'shortest').status, 'found');
});

test('drawn routes never overshoot a doorway and double back along the same corridor', () => {
  const nodes = Object.fromEntries(hotel.nodes.map(node => [node.id, node]));
  const edges = Object.fromEntries(hotel.edges.map(edge => [edge.id, edge]));
  for (const mode of ['shortest', 'accessible'] as const) for (const a of facilities) for (const b of facilities) {
    const route = findRoute(hotel, a.id, b.id, mode);
    if (route.status !== 'found') continue;
    let points: [number, number][] = [], floor = nodes[route.nodeIds[0]].floor;
    const check = () => {
      const p = points.filter((pt, i) => i === 0 || pt[0] !== points[i - 1][0] || pt[1] !== points[i - 1][1]);
      for (let i = 2; i < p.length; i++) {
        const u = [p[i - 1][0] - p[i - 2][0], p[i - 1][1] - p[i - 2][1]], v = [p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]];
        const cross = u[0] * v[1] - u[1] * v[0], dot = u[0] * v[0] + u[1] * v[1];
        assert.ok(!(cross === 0 && dot < 0), `${mode} ${a.id} → ${b.id} doubles back at ${p[i - 1]}`);
      }
    };
    route.edgeIds.forEach((id, i) => {
      const from = nodes[route.nodeIds[i]], to = nodes[route.nodeIds[i + 1]];
      if (from.floor !== to.floor) { check(); points = []; floor = to.floor; return; }
      const geometry = edgeGeometry(edges[id], nodes);
      points.push(...(edges[id].from === from.id ? geometry : [...geometry].reverse()));
    });
    check(); void floor;
  }
});

test('non-finite via coordinates and floating-point drift are handled deterministically', () => {
  const base: HotelGraph = {
    nodes: [{ id: 'a', name: 'A', floor: 0, x: 0, y: 0 }, { id: 'b', name: 'B', floor: 0, x: 5, y: 0 }, { id: 'c', name: 'C', floor: 0, x: 10, y: 0 }],
    edges: [
      { id: 'ab', from: 'a', to: 'b', distance: 0.1, kind: 'corridor', accessible: true, traversable: true },
      { id: 'bc', from: 'b', to: 'c', distance: 0.2, kind: 'corridor', accessible: true, traversable: true },
      { id: 'ac', from: 'a', to: 'c', distance: 0.3, kind: 'corridor', accessible: true, traversable: true },
    ],
  };
  const route = findRoute(base, 'a', 'c', 'shortest');
  assert.equal(route.status, 'found');
  assert.equal(route.distance, 0.3);
  const badVia: HotelGraph = { ...base, edges: [{ ...base.edges[2], via: [[Number.NaN, 0]] }] };
  assert.ok(validateGraph(badVia).some(e => e.includes('Invalid via coordinates')));
  assert.equal(findRoute(badVia, 'a', 'c', 'shortest').status, 'invalid');
});
