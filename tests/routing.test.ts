import test from 'node:test';
import assert from 'node:assert/strict';
import { hotel, facilities } from '../src/hotel.ts';
import { findRoute, validateGraph, type TraceStep } from '../src/routing.ts';
import { routeDirections } from '../src/directions.ts';
import { applyClosures } from '../src/closures.ts';
import { runScenarios, routeInvariant } from '../src/scenarios.ts';
import { edgeGeometry, segmentIsWalkable } from '../src/geometry.ts';
import type { HotelGraph } from '../src/types.ts';

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

test('former west passage shortcut and Suite 202 wall crossing are rejected', () => {
  const badShortcut: HotelGraph = { ...hotel, edges: [...hotel.edges, {
    id: 'old-west-shortcut', from: 'f2-w', to: 'f2-b', distance: 1,
    kind: 'corridor', accessible: true, traversable: true,
    via: [[150,430],[175,450],[175,505],[255,505]],
  }] };
  assert.ok(validateGraph(badShortcut).some(error => error.includes('old-west-shortcut')));
  assert.equal(findRoute(badShortcut, 'lift-2', 'suite-202', 'accessible').status, 'invalid');
  const throughWall: HotelGraph = { ...hotel, edges: hotel.edges.map(edge =>
    edge.to === 'suite-202' ? { ...edge, via: [[490,560]] as [number, number][] } : edge) };
  assert.ok(validateGraph(throughWall).some(error => error.includes('suite-202')));
});

test('suite routes use the east corridor and the actual door in both directions and modes', () => {
  const nodes = Object.fromEntries(hotel.nodes.map(node => [node.id, node]));
  for (const mode of ['shortest', 'accessible'] as const) for (const suite of ['suite-201', 'suite-202']) {
    for (const reverse of [false, true]) {
      const route = findRoute(hotel, reverse ? suite : 'lift-2', reverse ? 'lift-2' : suite, mode);
      assert.equal(route.status, 'found');
      assert.equal(route.distance, suite === 'suite-201' ? 37 : 30);
      for (const corridor of ['f2-e', 'f2-d', 'f2-c']) assert.ok(route.nodeIds.includes(corridor));
      assert.ok(!route.nodeIds.includes('f2-w'));
      assert.ok(!route.nodeIds.includes(suite === 'suite-201' ? 'suite-202' : 'suite-201'));
      const entry = hotel.edges.find(edge => edge.to === suite)!;
      const points = edgeGeometry(entry, nodes);
      // Door apertures measured independently from the raster: 201 east wall x229,
      // y480–500; 202 north wall y468, x405–433. Test crossing, not just endpoint.
      const axis = suite === 'suite-201' ? 0 : 1, boundary = axis === 0 ? 229 : 468;
      const opening = axis === 0 ? [480, 500] : [405, 433];
      const crossesDoor = points.slice(1).some((point, i) => {
        const start = points[i], delta = point[axis] - start[axis];
        if (delta === 0) return false;
        const t = (boundary - start[axis]) / delta;
        const other = 1 - axis, crossing = start[other] + t * (point[other] - start[other]);
        return t >= 0 && t <= 1 && crossing >= opening[0] && crossing <= opening[1];
      });
      assert.ok(crossesDoor, `${suite} misses its doorway`);
    }
  }
});

test('guest rooms are terminal destinations rather than corridor shortcuts', () => {
  for (const room of hotel.nodes.filter(node => node.category === 'room')) {
    assert.equal(hotel.edges.filter(edge => edge.traversable && (edge.from === room.id || edge.to === room.id)).length, 1, room.id);
  }
});

test('hotel graph is valid', () => assert.deepEqual(validateGraph(hotel), []));
test('improved queued distances and zero-cost cycles retain the shortest path', () => {
  const graph: HotelGraph = {
    nodes: ['s','a','b','c','z'].map(id=>({id,name:id,floor:0,x:0,y:0})),
    edges: [['s','a',10],['s','b',1],['b','a',1],['a','c',0],['c','b',0],['c','z',2]].map(([a,b,d],i)=>({
      id:`e${i}`,from:String(a),to:String(b),distance:Number(d),kind:'corridor',accessible:true,traversable:true,
    })),
  };
  for(const mode of ['shortest','accessible'] as const){
    const route=findRoute(graph,'s','z',mode);
    assert.equal(route.distance,3);
    assert.deepEqual(route.nodeIds,['s','b','c','z']);
    assert.ok(routeInvariant(graph,route));
    assert.equal(route.visitedNodes,5);
  }
});
test('each route observes changed permissions and revalidates changed geometry', () => {
  const graph=structuredClone(hotel);
  assert.equal(findRoute(graph,'reception','restaurant','accessible').status,'found');
  for(const edge of graph.edges)edge.reviewed=false;
  assert.equal(findRoute(graph,'reception','restaurant','accessible').status,'unreachable');
  for(const edge of graph.edges)edge.reviewed=true;
  const entry=graph.edges.find(edge=>edge.to==='suite-202')!;
  entry.via=[[490,560]];
  assert.equal(findRoute(graph,'lift-2','suite-202','accessible').status,'invalid');
});
for (const scenario of runScenarios()) test(scenario.name, () => assert.ok(scenario.passed, JSON.stringify(scenario)));
test('every facility pair obeys distance, connectivity and accessibility invariants', () => {
  for (const a of facilities) for (const b of facilities) {
    const standard=findRoute(hotel,a.id,b.id,'shortest'), accessible=findRoute(hotel,a.id,b.id,'accessible');
    assert.ok(routeInvariant(hotel,standard)); assert.ok(routeInvariant(hotel,accessible));
    if (accessible.status==='found') { assert.equal(standard.status,'found'); assert.ok(accessible.distance!>=standard.distance!); }
    assert.equal(findRoute(hotel,b.id,a.id,'shortest').distance, standard.distance);
  }
});
test('Dijkstra agrees with independent Floyd-Warshall oracle for all hotel nodes', () => {
  for (const mode of ['shortest','accessible'] as const) {
    const ids=hotel.nodes.map(n=>n.id), matrix=ids.map((_,i)=>ids.map((__,j)=>i===j?0:Infinity));
    for (const e of hotel.edges) if(e.traversable && (mode==='shortest'||(e.accessible&&e.kind!=='stairs'))) { const a=ids.indexOf(e.from),b=ids.indexOf(e.to);matrix[a][b]=Math.min(matrix[a][b],e.distance);matrix[b][a]=Math.min(matrix[b][a],e.distance); }
    for(let k=0;k<ids.length;k++) for(let i=0;i<ids.length;i++) for(let j=0;j<ids.length;j++) matrix[i][j]=Math.min(matrix[i][j],matrix[i][k]+matrix[k][j]);
    for(let i=0;i<ids.length;i++) for(let j=0;j<ids.length;j++) {const r=findRoute(hotel,ids[i],ids[j],mode);assert.equal(r.distance,Number.isFinite(matrix[i][j])?matrix[i][j]:null,`${mode} ${ids[i]} to ${ids[j]}`);}
  }
});

test('Dijkstra trace records settled nodes in non-decreasing distance order and direction steps partition route edges', () => {
  const trace: TraceStep[] = [];
  const route = findRoute(hotel, 'reception', 'suite-201', 'accessible', trace);
  assert.equal(route.status, 'found');
  assert.equal(trace.length, route.visitedNodes);
  assert.equal(trace[0].node, 'reception');
  assert.equal(trace.at(-1)?.node, 'suite-201');
  for (let i = 1; i < trace.length; i++) assert.ok(trace[i].distance >= trace[i - 1].distance);
  const steps = routeDirections(route, hotel);
  assert.deepEqual(steps.flatMap(s => s.edgeIds), route.edgeIds);
});

test('closing the ground-to-first elevator removes accessible upper-floor routes while leaving ground routes intact', () => {
  const closed = applyClosures(hotel, ['lift-0--lift-1']);
  assert.equal(findRoute(closed, 'reception', 'restaurant', 'accessible').status, 'found');
  assert.equal(findRoute(closed, 'reception', 'conference', 'accessible').status, 'unreachable');
  assert.equal(findRoute(closed, 'reception', 'conference', 'shortest').status, 'found');
});

test('drawn routes never overshoot a doorway and double back along the same corridor', () => {
  const nodes = Object.fromEntries(hotel.nodes.map(node => [node.id, node]));
  const edges = Object.fromEntries(hotel.edges.map(edge => [edge.id, edge]));
  for (const mode of ['shortest', 'accessible'] as const) for (const a of facilities) for (const b of facilities) {
    const route = findRoute(hotel, a.id, b.id, mode);
    if (route.status !== 'found') continue;
    // Build the on-screen polyline per floor, oriented in the direction of travel.
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
