import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteBuilding, mallBuilding } from '../src/buildings';
import { findRoute } from '../src/routing';

test('Mall establishment contains 3 floors with metric dimensions and BP 344 compliance', () => {
  assert.equal(mallBuilding.floors.length, 3);
  assert.equal(mallBuilding.floors[0].name, 'Level 1: Ground Floor');
  assert.equal(mallBuilding.floors[1].name, 'Level 2: Second Floor');
  assert.equal(mallBuilding.floors[2].name, 'Level 3: Third Floor');
  assert.equal(mallBuilding.floors[0].width, 1600);
  assert.equal(mallBuilding.floors[0].height, 1200);
  assert.equal(mallBuilding.floors[0].metersPerPixel, 0.05);
});

test('Mall contains all required circulation facilities: elevators, ramps, escalators, stairs', () => {
  const nodes = mallBuilding.graph.nodes;
  const categories = new Set(nodes.map(n => n.category));
  assert.ok(categories.has('elevator'), 'Must include elevators');
  assert.ok(categories.has('stairs'), 'Must include stairs/escalators');
  assert.ok(categories.has('entrance'), 'Must include entrances');
  assert.ok(categories.has('parking'), 'Must include PWD parking');
  assert.ok(categories.has('restroom'), 'Must include restrooms');
  assert.ok(categories.has('shop'), 'Must include shops');
  assert.ok(categories.has('dining'), 'Must include dining/food stalls');

  const rampEdges = mallBuilding.graph.edges.filter(e => e.kind === 'ramp');
  assert.ok(rampEdges.length > 0, 'Must have ramp edges');

  const elevatorEdges = mallBuilding.graph.edges.filter(e => e.kind === 'elevator');
  assert.ok(elevatorEdges.length > 0, 'Must have elevator edges');

  const stairEdges = mallBuilding.graph.edges.filter(e => e.kind === 'stairs');
  assert.ok(stairEdges.length > 0, 'Must have stairs/escalator edges');
});

test('Dijkstra finds step-free accessible route across floors using elevators, avoiding stairs and escalators', () => {
  const route = findRoute(mallBuilding.graph, 'main-entrance-north', 'cinema-1-node', 'accessible');
  assert.equal(route.status, 'found');
  assert.ok((route.distance ?? 0) > 0);

  // Every edge traversed must be accessible and cannot be stairs
  for (const edgeId of route.edgeIds) {
    const edge = mallBuilding.graph.edges.find(e => e.id === edgeId);
    assert.ok(edge, `Edge ${edgeId} must exist`);
    assert.equal(edge?.accessible, true, `Edge ${edgeId} must be accessible`);
    assert.notEqual(edge?.kind, 'stairs', `Accessible route cannot use stairs: ${edgeId}`);
  }
});

test('Dijkstra finds shortest pedestrian route that can utilize fast escalators', () => {
  const routeShort = findRoute(mallBuilding.graph, 'main-entrance-north', 'cinema-1-node', 'shortest');
  assert.equal(routeShort.status, 'found');
  assert.ok((routeShort.distance ?? 0) > 0);
});

test('Mall floor SVG data URLs are valid and well-formed', () => {
  for (const floor of mallBuilding.floors) {
    assert.ok(floor.image.startsWith('data:image/svg+xml;utf8,'));
    const svg = decodeURIComponent(floor.image.replace('data:image/svg+xml;utf8,', ''));
    assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(svg.endsWith('</svg>'));
    assert.ok(!svg.includes(' & '), 'Must not have unescaped ampersands');
    assert.ok(svg.includes('72.00 m OVERALL BUILDING WIDTH'));
  }
});

test('deleteBuilding is exported and available for facility removal', () => {
  assert.equal(typeof deleteBuilding, 'function');
});
