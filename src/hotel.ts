import type { Edge, FloorId, HotelGraph, MapNode, PathKind } from './types';
import { walkableAreas } from './walkable';

export const floors = [{ id: 0, name: 'Ground floor', short: 'G', description: 'Reception, dining & lounge' }, { id: 1, name: 'First floor', short: '1', description: 'Conference & guest rooms' }, { id: 2, name: 'Second floor', short: '2', description: 'Suites & leisure' }] as const;
const nodes: MapNode[] = [];
const edges: Edge[] = [];
const n = (id: string, name: string, floor: FloorId, x: number, y: number, category?: MapNode['category']) => nodes.push({ id, name, floor, x, y, category, facility: !!category });
const e = (from: string, to: string, distance: number, kind: PathKind = 'corridor', accessible = true, via?: [number, number][], traversable = true) => edges.push({ id: `${from}--${to}`, from, to, distance, kind, accessible, traversable, via });

n('reception', 'Reception', 0, 175, 505, 'reception');
n('g-entry', 'Main entrance', 0, 270, 660, 'entrance');
n('g-a', 'Reception passage', 0, 255, 505);
n('g-b', 'West corridor', 0, 255, 435);
n('g-c', 'Central corridor', 0, 490, 435);
n('g-d', 'East corridor', 0, 765, 435);
n('g-e', 'Ramp landing', 0, 765, 255);
n('g-f', 'Restaurant entrance', 0, 790, 225);
n('restaurant', 'Restaurant', 0, 820, 200, 'dining');
n('g-s', 'Upper corridor', 0, 390, 255);
n('g-h', 'Elevator landing', 0, 550, 255);
n('g-w', 'Restroom passage', 0, 190, 255);
n('restroom', 'Accessible restroom', 0, 150, 130, 'restroom');
n('lounge', 'Lobby lounge', 0, 450, 485, 'lounge');
n('stairs-0', 'Stairs', 0, 390, 205, 'stairs');
n('lift-0', 'Elevator', 0, 550, 205, 'elevator');
e('reception', 'g-a', 4, 'corridor', true, [[220,505]]); e('g-a', 'g-b', 6); e('g-b', 'g-c', 5); e('g-c', 'g-d', 14);
e('g-d', 'g-e', 7, 'ramp'); e('g-e', 'g-f', 1, 'corridor', true, [[790,255]]); e('g-f', 'restaurant', 1, 'corridor', true, [[790,200]]);
e('reception', 'g-s', 18, 'stairs', false, [[175,450],[150,430],[150,255]]); e('g-s', 'g-h', 2); e('g-h', 'g-e', 2);
e('g-s', 'g-w', 8); e('g-w', 'restroom', 4, 'corridor', true, [[185,255],[185,130]]);
e('g-c', 'lounge', 4, 'corridor', true, [[410,435],[410,485]]);
e('g-c', 'g-entry', 8, 'corridor', true, [[270,435]]);
e('g-s', 'stairs-0', 3); e('g-h', 'lift-0', 3);

for (const floor of [1, 2] as const) {
  const p = `f${floor}`;
  n(`stairs-${floor}`, 'Stairs', floor, 390, 205, 'stairs');
  n(`lift-${floor}`, 'Elevator', floor, 550, 205, 'elevator');
  n(`${p}-s`, 'Upper corridor', floor, 390, 255);
  n(`${p}-h`, 'Elevator landing', floor, 550, 255);
  n(`${p}-w`, 'West corridor', floor, 150, 255);
  n(`${p}-b`, 'Guest corridor', floor, 255, 435);
  n(`${p}-c`, 'Central corridor', floor, 490, 435);
  n(`${p}-d`, 'East corridor', floor, 765, 435);
  n(`${p}-e`, 'East landing', floor, 765, 255);
  n(`${p}-f`, 'East room entrance', floor, floor === 1 ? 740 : 765, 240);
  e(`lift-${floor}`, `${p}-h`, 3); e(`stairs-${floor}`, `${p}-s`, 3);
  e(`${p}-h`, `${p}-s`, 2); e(`${p}-s`, `${p}-w`, 8);
  // The west passage is a dead end on the upper floors: its south wall is solid.
  // Reach the lower guest corridor via the east public corridor, never through a room.
  e(`${p}-b`, `${p}-c`, 5);
  e(`${p}-c`, `${p}-d`, 14); e(`${p}-d`, `${p}-e`, 7);
  e(`${p}-e`, `${p}-h`, 2); e(`${p}-e`, `${p}-f`, 1, 'corridor', true, [[floor === 1 ? 740 : 765,255]]);
  e(`stairs-${floor-1}`, `stairs-${floor}`, 5, 'stairs', false);
  e(`lift-${floor-1}`, `lift-${floor}`, 8, 'elevator');
}
n('conference', 'Conference room', 1, 225, 195, 'conference');
n('room-101', 'Guest room 101', 1, 210, 515, 'room');
n('room-102', 'Guest room 102', 1, 620, 500, 'room');
n('reading-room', 'Reading room', 1, 755, 205, 'lounge');
e('f1-w', 'conference', 5, 'corridor', true, [[225,255]]);
e('f1-b', 'room-101', 6, 'corridor', true, [[210,435]]);
e('f1-c', 'room-102', 4, 'corridor', true, [[620,435]]);
e('f1-f', 'reading-room', 3, 'stairs', false, [[740,205]]);
n('fitness', 'Fitness studio', 2, 225, 195, 'fitness');
n('suite-201', 'Suite 201', 2, 210, 515, 'room');
n('suite-202', 'Suite 202', 2, 440, 495, 'room');
n('terrace', 'Terrace lounge', 2, 790, 200, 'lounge');
n('private-room', 'Private function room', 2, 890, 560, 'conference');
e('f2-w', 'fitness', 5, 'corridor', true, [[225,255]]);
e('f2-b', 'suite-201', 6, 'corridor', true, [[255,490],[210,490]]);
e('f2-c', 'suite-202', 4, 'corridor', true, [[420,435],[420,485],[440,485]]);
e('f2-f', 'terrace', 3, 'corridor', true, [[765,200]]);

// Room names stay over the room, while route endpoints sit in clear entrance foyers.
const labelPositions: Record<string, [number, number]> = {
  restaurant: [840,170], lounge: [490,560], conference: [150,130],
  'room-101': [150,570], 'room-102': [490,560], 'reading-room': [840,170],
  fitness: [150,130], 'suite-201': [150,570], 'suite-202': [490,560], terrace: [840,170],
};
for (const node of nodes) {
  const label = labelPositions[node.id] ?? (node.category === 'stairs' ? [420,165] : node.category === 'elevator' ? [550,175] : null);
  if (label) [node.labelX, node.labelY] = label;
}

export const hotel: HotelGraph = { nodes, edges, walkableAreas };
export const nodeById = Object.fromEntries(nodes.map(node => [node.id, node])) as Record<string, MapNode>;
export const edgeById = Object.fromEntries(edges.map(edge => [edge.id, edge])) as Record<string, Edge>;
export const facilities = nodes.filter(node => node.facility);
export const floorName = (floor: FloorId) => floors[floor].name;
export const facilityLabel = (id: string) => nodeById[id] ? `${nodeById[id].name} · ${floorName(nodeById[id].floor)}` : '';
