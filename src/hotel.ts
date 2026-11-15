import type { Edge, FloorId, HotelGraph, MapNode, PathKind } from './types';
import { walkableAreas } from './walkable';
import { METERS_PER_PIXEL, px } from './civicPlan';

export const floors = [
  { id: 0, name: '1st floor', short: '1F', description: 'BP 344 PWD parking, 1:12 ramps, main entrance, info lounge & shop' },
  { id: 1, name: '2nd floor', short: '2F', description: 'Public library, administrative offices & BP 344 PWD restroom' },
  { id: 2, name: '3rd floor', short: '3F', description: 'Four function halls (PWD seating) & BP 344 PWD restroom' },
] as const;

const nodes: MapNode[] = [];
const edges: Edge[] = [];
const nodeMap: Record<string, MapNode> = {};

// ============================================================================
// [GRAPH DATA MODEL: NODES & WEIGHTED EDGES IN METERS]
// `n(...)` registers a node in metric coordinates; `e(...)` computes Euclidean
// distance in meters (used as Dijkstra's edge weight) and tags accessibility.
// ============================================================================
const n = (
  id: string,
  name: string,
  floor: FloorId,
  xMeters: number,
  yMeters: number,
  category?: MapNode['category'],
  labelMeters?: [number, number],
) => {
  const node: MapNode = {
    id, name, floor,
    x: px(xMeters), y: px(yMeters),
    category, facility: !!category,
    ...(labelMeters ? { labelX: px(labelMeters[0]), labelY: px(labelMeters[1]) } : {}),
  };
  nodes.push(node);
  nodeMap[id] = node;
};

const e = (
  from: string,
  to: string,
  kind: PathKind = 'corridor',
  accessible = true,
  overrideDistance?: number,
  viaMeters?: [number, number][],
  traversable = true,
) => {
  const via = viaMeters?.map(([vx, vy]) => [px(vx), px(vy)] as [number, number]);
  const pts: [number, number][] = [[nodeMap[from].x, nodeMap[from].y], ...(via ?? []), [nodeMap[to].x, nodeMap[to].y]];
  let pxLen = 0;
  for (let i = 1; i < pts.length; i++) pxLen += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const distance = overrideDistance ?? Math.round(pxLen * METERS_PER_PIXEL * 100) / 100;
  edges.push({ id: `${from}--${to}`, from, to, distance, kind, accessible, traversable, via });
};

// ============================================================================
// [DECISION INPUT: VERTICAL CIRCULATION (STAIRS VS. ELEVATOR)]
// Stairs have shorter metric weight (8.5 m) but `accessible = false`;
// Elevator has 12.0 m weight and `accessible = true`.
// ============================================================================
// Core vertical circulation on every floor (Elevator at x=5.5 m, Stairs at x=11.5 m)
for (const floor of [0, 1, 2] as const) {
  n(`lift-${floor}`, 'Elevator', floor, 5.5, 11.5, 'elevator', [5.5, 9.5]);
  n(`stairs-${floor}`, 'Stairs', floor, 11.5, 11.5, 'stairs', [10.2, 5.8]);
  n(`f${floor}-lift-j`, 'Elevator landing', floor, 5.5, 14.5);
  n(`f${floor}-stairs-j`, 'Stairs landing', floor, 11.5, 14.5);
  e(`lift-${floor}`, `f${floor}-lift-j`);
  e(`stairs-${floor}`, `f${floor}-stairs-j`);
  e(`f${floor}-lift-j`, `f${floor}-stairs-j`);
  if (floor > 0) {
    e(`stairs-${floor - 1}`, `stairs-${floor}`, 'stairs', false, 8.5);
    e(`lift-${floor - 1}`, `lift-${floor}`, 'elevator', true, 12);
  }
}

// 1st floor (id 0): Outdoor government/rescue parking lot, steps, 1:12 ramp, entrance lobby & glass-walled souvenir shop
n('parking-lot', 'Emergency & gov’t parking', 0, 26, 38, 'parking', [17.5, 45.5]);
n('pwd-parking', 'Accessible parking (BP 344 PWD)', 0, 35, 38, 'parking', [36.0, 45.5]);
n('steps-out-bot', 'Front steps foot', 0, 26, 30);
n('sidewalk-pwd-j', 'PWD sidewalk junction', 0, 35, 30);
n('sidewalk-east-j', 'East sidewalk junction', 0, 37.5, 30);
n('plaza-entry-j', 'Entrance plaza', 0, 26, 26.5);
n('ramp-out-top', 'Outdoor ramp top', 0, 30, 26.5);
n('ramp-out-bot', 'Outdoor ramp foot', 0, 37.5, 26.5);
n('main-entrance', 'Main entrance', 0, 26, 24, 'entrance', [26.0, 26.2]);
n('lobby-center-j', 'Main lobby concourse', 0, 26, 21);
n('lobby-west-j', 'Info & lounge concourse', 0, 21, 21);
n('lobby-east-j', 'Shop & ramp concourse', 0, 32.5, 21);
n('info-desk', 'Information & PWD Assistance Desk', 0, 21, 23, 'reception', [19.5, 22.5]);
n('lounge', 'Waiting lounge', 0, 21, 18.5, 'lounge', [22.5, 17.8]);
n('souvenir-shop', 'Souvenir shop', 0, 36.5, 21, 'shop', [38.0, 22.5]);
n('f0-steps-j', 'Central hallway (steps)', 0, 26, 14.5);
n('f0-ramp-j', 'Central hallway (ramp)', 0, 32.5, 14.5);
n('records-room', 'Records room', 0, 38, 8, 'office', [31.5, 10.5]);

e('parking-lot', 'steps-out-bot');
e('pwd-parking', 'sidewalk-pwd-j');
e('steps-out-bot', 'sidewalk-pwd-j');
e('sidewalk-pwd-j', 'sidewalk-east-j');
e('steps-out-bot', 'plaza-entry-j', 'stairs', false);
e('plaza-entry-j', 'ramp-out-top');
e('ramp-out-top', 'ramp-out-bot', 'ramp', true);
e('ramp-out-bot', 'sidewalk-east-j');
e('plaza-entry-j', 'main-entrance');
e('main-entrance', 'lobby-center-j');
e('lobby-west-j', 'lobby-center-j');
e('lobby-center-j', 'lobby-east-j');
e('lobby-west-j', 'info-desk');
e('lobby-west-j', 'lounge');
e('lobby-east-j', 'souvenir-shop');
e('lobby-center-j', 'f0-steps-j', 'stairs', false);
e('lobby-east-j', 'f0-ramp-j', 'ramp', true);
e('f0-stairs-j', 'f0-steps-j');
e('f0-steps-j', 'f0-ramp-j');

// 2nd floor (id 1): Restroom (x=13..19), Public library (x=19..44), Office A (x=4..24), Office B (x=24..44)
n('f1-offa-j', 'Office A corridor', 1, 14, 14.5);
n('f1-rest-j', '2nd floor restroom corridor', 1, 16, 14.5);
n('f1-lib-j', 'Library corridor', 1, 31.5, 14.5);
n('f1-offb-j', 'Office B corridor', 1, 34, 14.5);
n('restroom-1', '2nd floor PWD restroom', 1, 16, 10.5, 'restroom', [16, 10.5]);
n('library', 'Public library', 1, 31.5, 10, 'library', [31.5, 10.5]);
n('office-a', 'Office A', 1, 14, 18.5, 'office', [14, 22.5]);
n('office-b', 'Office B', 1, 34, 18.5, 'office', [34, 22.5]);

e('f1-stairs-j', 'f1-offa-j');
e('f1-offa-j', 'f1-rest-j');
e('f1-rest-j', 'f1-lib-j');
e('f1-lib-j', 'f1-offb-j');
e('f1-offa-j', 'office-a');
e('f1-rest-j', 'restroom-1');
e('f1-lib-j', 'library');
e('f1-offb-j', 'office-b');

// 3rd floor (id 2): Restroom (same x=13..19), Function Halls 1–4
n('f2-hall3-j', 'Hall 3 corridor', 2, 14, 14.5);
n('f2-rest-j', '3rd floor restroom corridor', 2, 16, 14.5);
n('f2-hall1-j', 'Hall 1 corridor', 2, 25, 14.5);
n('f2-hall4-j', 'Hall 4 corridor', 2, 34, 14.5);
n('f2-hall2-j', 'Hall 2 corridor', 2, 38, 14.5);
n('restroom-2', '3rd floor PWD restroom', 2, 16, 10.5, 'restroom', [16, 10.5]);
n('hall-1', 'Function Hall 1', 2, 25, 10, 'conference', [25.2, 10.5]);
n('hall-2', 'Function Hall 2', 2, 38, 10, 'conference', [38.0, 10.5]);
n('hall-3', 'Function Hall 3', 2, 14, 18.5, 'conference', [14, 22.5]);
n('hall-4', 'Function Hall 4', 2, 34, 18.5, 'conference', [34, 22.5]);

e('f2-stairs-j', 'f2-hall3-j');
e('f2-hall3-j', 'f2-rest-j');
e('f2-rest-j', 'f2-hall1-j');
e('f2-hall1-j', 'f2-hall4-j');
e('f2-hall4-j', 'f2-hall2-j');
e('f2-rest-j', 'restroom-2');
e('f2-hall1-j', 'hall-1');
e('f2-hall2-j', 'hall-2');
e('f2-hall3-j', 'hall-3');
e('f2-hall4-j', 'hall-4');

export const hotel: HotelGraph = { nodes, edges, walkableAreas };
export const facilities = nodes.filter(node => node.facility);
