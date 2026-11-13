import type { Building, BuildingFloor } from './buildings';
import type { Edge, FloorId, HotelGraph, MapNode, PathKind, WalkableArea } from './types';

export const CAMPUS_SCALE = 20;
const SHEET_W = 72;
const SHEET_H = 40;
export const CAMPUS_WIDTH = SHEET_W * CAMPUS_SCALE; // 1440 px
export const CAMPUS_HEIGHT = SHEET_H * CAMPUS_SCALE; // 800 px

const p = (m: number) => Math.round(m * CAMPUS_SCALE);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const round2 = (n: number) => Math.round(n * 100) / 100;

interface CampusRoom {
  id: string;
  floor: FloorId;
  building: 1 | 2;
  name: string;
  subtitle: string;
  category: NonNullable<MapNode['category']>;
  x: number;
  y: number;
  w: number;
  h: number;
  doorX?: number;
  doorWall?: 'north' | 'south';
  nodeX?: number;
  nodeY?: number;
  labelRow?: 'top' | 'bot';
  feature?: 'pwd-cr' | 'low-counter' | 'wheelchair-bays' | 'comp-lab' | 'elevator' | 'stairs' | 'dining' | 'kitchen' | 'lobby';
}

const CORR_Y = 13.5;

const coreRooms = (floor: FloorId, building: 1 | 2): CampusRoom[] => {
  const bx = building === 1 ? 4 : 40;
  return [
    {
      id: `b${building}-elev-${floor}`,
      floor,
      building,
      name: `B${building} Elevator`,
      subtitle: 'BP 344 · 1.50 × 1.60 m cab · Braille',
      category: 'elevator',
      x: bx,
      y: 15,
      w: 3.2,
      h: 4.5,
      doorX: bx + 1.6,
      doorWall: 'north',
      nodeX: bx + 1.6,
      nodeY: 17,
      labelRow: 'top',
      feature: 'elevator',
    },
    {
      id: `b${building}-stairs-${floor}`,
      floor,
      building,
      name: `B${building} Stairs`,
      subtitle: 'Dual handrails · Tactile strip',
      category: 'stairs',
      x: bx + 3.2,
      y: 15,
      w: 3.8,
      h: 5.5,
      doorX: bx + 5.1,
      doorWall: 'north',
      nodeX: bx + 5.1,
      nodeY: 17.5,
      labelRow: 'bot',
      feature: 'stairs',
    },
  ];
};

const campusRooms: CampusRoom[] = [
  // ---------- BUILDING 1 (4F incl. Rooftop) ----------
  ...coreRooms(0, 1),
  { id: 'b1-registrar', floor: 0, building: 1, name: 'Registrar', subtitle: 'BP 344 · 0.80 m low counter', category: 'office', x: 4, y: 4, w: 7.5, h: 8, doorX: 7.75, doorWall: 'south', labelRow: 'top', feature: 'low-counter' },
  { id: 'b1-stockroom', floor: 0, building: 1, name: 'Stockroom', subtitle: '0.95 m clear door · Level entry', category: 'facility', x: 11.5, y: 4, w: 7.5, h: 8, doorX: 15.25, doorWall: 'south', labelRow: 'bot' },
  { id: 'b1-cafeteria-dining', floor: 0, building: 1, name: 'Cafeteria Dining Hall', subtitle: 'Rm 1/2 · 1.20 m aisles + PWD bays', category: 'dining', x: 19, y: 4, w: 7.5, h: 8, doorX: 22.75, doorWall: 'south', nodeX: 22.75, nodeY: 8.5, labelRow: 'top', feature: 'dining' },
  { id: 'b1-cafeteria-counter', floor: 0, building: 1, name: 'Cafeteria Counter & Kitchen', subtitle: 'Rm 2/2 · 0.80 m service counter', category: 'dining', x: 26.5, y: 4, w: 7.5, h: 8, nodeX: 30.25, nodeY: 8.5, labelRow: 'bot', feature: 'kitchen' },
  { id: 'b1-lobby-0', floor: 0, building: 1, name: 'B1 Main Entrance', subtitle: '2.0 m glass door + 1:12 West ramp', category: 'entrance', x: 11, y: 15, w: 16.5, h: 8, doorX: 19.25, doorWall: 'north', nodeX: 19.25, nodeY: 22.8, labelRow: 'top', feature: 'lobby' },
  { id: 'b1-cr-0', floor: 0, building: 1, name: 'B1 Comfort Room', subtitle: 'BP 344 PWD stall · 1.50 m turning', category: 'restroom', x: 27.5, y: 15, w: 6.5, h: 8, doorX: 30.75, doorWall: 'north', labelRow: 'bot', feature: 'pwd-cr' },

  ...coreRooms(1, 1),
  { id: 'b1-201', floor: 1, building: 1, name: 'Classroom B1-201', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 4, y: 4, w: 10, h: 8, doorX: 9, doorWall: 'south', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b1-202', floor: 1, building: 1, name: 'Classroom B1-202', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 14, y: 4, w: 10, h: 8, doorX: 19, doorWall: 'south', labelRow: 'bot', feature: 'wheelchair-bays' },
  { id: 'b1-203', floor: 1, building: 1, name: 'Classroom B1-203', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 24, y: 4, w: 10, h: 8, doorX: 29, doorWall: 'south', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b1-faculty', floor: 1, building: 1, name: 'Faculty Room', subtitle: 'Accessible workstations', category: 'office', x: 11, y: 15, w: 16.5, h: 8, doorX: 19.25, doorWall: 'north', labelRow: 'top' },
  { id: 'b1-cr-1', floor: 1, building: 1, name: 'B1 Comfort Room', subtitle: 'BP 344 PWD stall · 1.50 m turning', category: 'restroom', x: 27.5, y: 15, w: 6.5, h: 8, doorX: 30.75, doorWall: 'north', labelRow: 'bot', feature: 'pwd-cr' },

  ...coreRooms(2, 1),
  { id: 'b1-301', floor: 2, building: 1, name: 'Classroom B1-301', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 4, y: 4, w: 10, h: 8, doorX: 9, doorWall: 'south', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b1-302', floor: 2, building: 1, name: 'Classroom B1-302', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 14, y: 4, w: 10, h: 8, doorX: 19, doorWall: 'south', labelRow: 'bot', feature: 'wheelchair-bays' },
  { id: 'b1-303', floor: 2, building: 1, name: 'Classroom B1-303', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 24, y: 4, w: 10, h: 8, doorX: 29, doorWall: 'south', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b1-304', floor: 2, building: 1, name: 'Classroom B1-304', subtitle: 'Lecture hall · 2 PWD bays', category: 'conference', x: 11, y: 15, w: 16.5, h: 8, doorX: 19.25, doorWall: 'north', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b1-cr-2', floor: 2, building: 1, name: 'B1 Comfort Room', subtitle: 'BP 344 PWD stall · 1.50 m turning', category: 'restroom', x: 27.5, y: 15, w: 6.5, h: 8, doorX: 30.75, doorWall: 'north', labelRow: 'bot', feature: 'pwd-cr' },

  ...coreRooms(3, 1),
  { id: 'b1-roof-open', floor: 3, building: 1, name: 'Rooftop Open Area', subtitle: 'Zero-step slab · 1.20 m parapet', category: 'lounge', x: 4, y: 4, w: 14, h: 11, nodeX: 12, nodeY: 9, labelRow: 'top' },
  { id: 'b1-roof-garden', floor: 3, building: 1, name: 'Rooftop Garden Area', subtitle: 'Raised planters · 2.0 m loop', category: 'facility', x: 18, y: 4, w: 16, h: 19, nodeX: 26, nodeY: 13.5 },

  // ---------- BUILDING 2 (3F Enclosed) ----------
  ...coreRooms(0, 2),
  { id: 'b2-101', floor: 0, building: 2, name: 'Classroom B2-101', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 40, y: 4, w: 9.3, h: 8, doorX: 44.65, doorWall: 'south', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b2-102', floor: 0, building: 2, name: 'Classroom B2-102', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 49.3, y: 4, w: 9.3, h: 8, doorX: 53.95, doorWall: 'south', labelRow: 'bot', feature: 'wheelchair-bays' },
  { id: 'b2-103', floor: 0, building: 2, name: 'Classroom B2-103', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 58.6, y: 4, w: 9.4, h: 8, doorX: 63.3, doorWall: 'south', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b2-lobby-0', floor: 0, building: 2, name: 'B2 Main Entrance', subtitle: '2.0 m door + 1:12 East ramp', category: 'entrance', x: 47, y: 15, w: 7, h: 8, doorX: 50.5, doorWall: 'north', nodeX: 50.5, nodeY: 22.8, labelRow: 'top', feature: 'lobby' },
  { id: 'b2-principal-office', floor: 0, building: 2, name: "Principal's Office", subtitle: 'BP 344 · 0.80 m visitor desk', category: 'office', x: 54, y: 15, w: 8, h: 8, doorX: 58, doorWall: 'north', labelRow: 'bot', feature: 'low-counter' },
  { id: 'b2-cr-0', floor: 0, building: 2, name: 'B2 Comfort Room', subtitle: 'BP 344 PWD stall · 1.50 m turning', category: 'restroom', x: 62, y: 15, w: 6, h: 8, doorX: 65, doorWall: 'north', labelRow: 'top', feature: 'pwd-cr' },

  ...coreRooms(1, 2),
  { id: 'b2-201', floor: 1, building: 2, name: 'Classroom B2-201', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 40, y: 4, w: 9.3, h: 8, doorX: 44.65, doorWall: 'south', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b2-202', floor: 1, building: 2, name: 'Classroom B2-202', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 49.3, y: 4, w: 9.3, h: 8, doorX: 53.95, doorWall: 'south', labelRow: 'bot', feature: 'wheelchair-bays' },
  { id: 'b2-203', floor: 1, building: 2, name: 'Classroom B2-203', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 58.6, y: 4, w: 9.4, h: 8, doorX: 63.3, doorWall: 'south', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b2-computer-lab', floor: 1, building: 2, name: 'Computer Laboratory', subtitle: '0.75 m knee-clear PC bays', category: 'library', x: 47, y: 15, w: 15, h: 8, doorX: 54.5, doorWall: 'north', labelRow: 'top', feature: 'comp-lab' },
  { id: 'b2-cr-1', floor: 1, building: 2, name: 'B2 Comfort Room', subtitle: 'BP 344 PWD stall · 1.50 m turning', category: 'restroom', x: 62, y: 15, w: 6, h: 8, doorX: 65, doorWall: 'north', labelRow: 'bot', feature: 'pwd-cr' },

  ...coreRooms(2, 2),
  { id: 'b2-301', floor: 2, building: 2, name: 'Classroom B2-301', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 40, y: 4, w: 14, h: 8, doorX: 47, doorWall: 'south', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b2-302', floor: 2, building: 2, name: 'Classroom B2-302', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 54, y: 4, w: 14, h: 8, doorX: 61, doorWall: 'south', labelRow: 'bot', feature: 'wheelchair-bays' },
  { id: 'b2-303', floor: 2, building: 2, name: 'Classroom B2-303', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 47, y: 15, w: 10.5, h: 8, doorX: 52.25, doorWall: 'north', labelRow: 'top', feature: 'wheelchair-bays' },
  { id: 'b2-304', floor: 2, building: 2, name: 'Classroom B2-304', subtitle: 'PWD wheelchair bays (0.9 × 1.2 m)', category: 'conference', x: 57.5, y: 15, w: 10.5, h: 8, doorX: 62.75, doorWall: 'north', labelRow: 'bot', feature: 'wheelchair-bays' },
];

// Build graph nodes and corridor/vertical/exterior edges
const nodesMap = new Map<string, MapNode>();
const edges: Edge[] = [];
const nodeList: MapNode[] = [];

function addNode(n: MapNode) {
  if (!nodesMap.has(n.id)) {
    nodesMap.set(n.id, n);
    nodeList.push(n);
  }
}

function addEdge(id: string, fromId: string, toId: string, kind: PathKind = 'corridor', accessible = true) {
  const a = nodesMap.get(fromId);
  const b = nodesMap.get(toId);
  if (!a || !b) throw new Error(`Missing campus graph node for ${fromId} -> ${toId}`);
  const dist = a.floor === b.floor ? round2(Math.hypot(b.x - a.x, b.y - a.y) / CAMPUS_SCALE) : kind === 'elevator' ? 3.5 : 4.2;
  edges.push({ id, from: fromId, to: toId, distance: dist, kind, accessible, traversable: true });
}

// Primary destinations ordered before vertical cores so App opens on a useful default route
const priorityOrder = ['b1-lobby-0', 'b2-computer-lab'];
const roomLabelYMeters = (r: CampusRoom) => {
  if (r.category === 'elevator') return 16.0;
  if (r.category === 'stairs') return 20.8;
  if (r.labelRow === 'top') return r.y === 15 ? 16.8 : r.y + 1.5;
  if (r.labelRow === 'bot') return r.y === 15 ? 20.8 : r.y + r.h - 1.5;
  return r.y + r.h / 2;
};

const roomToNode = (r: CampusRoom): MapNode => {
  const mx = r.nodeX ?? r.x + r.w / 2;
  const my = r.nodeY ?? r.y + r.h / 2;
  return {
    id: r.id,
    name: r.name,
    floor: r.floor,
    x: p(mx),
    y: p(my),
    labelX: p(r.x + r.w / 2),
    labelY: p(roomLabelYMeters(r)),
    facility: true,
    category: r.category,
  };
};

for (const pid of priorityOrder) {
  const room = campusRooms.find(r => r.id === pid);
  if (room) addNode(roomToNode(room));
}
addNode({ id: 'campus-pwd-parking', name: 'Campus PWD Parking', floor: 0, x: p(36), y: p(35), labelX: p(36), labelY: p(36.2), facility: true, category: 'parking' });
for (const room of campusRooms) {
  if (room.category !== 'elevator' && room.category !== 'stairs') addNode(roomToNode(room));
}
for (const room of campusRooms) {
  if (room.category === 'elevator' || room.category === 'stairs') addNode(roomToNode(room));
}

// Corridor spine junctions for floors 0..2 in Building 1 & Building 2
const bldgCorridorPoints: Record<string, { x: number; roomId: string }[]> = {};
for (const r of campusRooms) {
  if (r.floor < 3 && r.doorX !== undefined) {
    const key = `${r.floor}:${r.building}`;
    (bldgCorridorPoints[key] ??= []).push({ x: r.doorX, roomId: r.id });
  }
}

for (const [key, entries] of Object.entries(bldgCorridorPoints)) {
  const [floorStr, bldgStr] = key.split(':');
  const floor = Number(floorStr) as FloorId;
  entries.sort((a, b) => a.x - b.x);
  const jcts = entries.map((e, i) => {
    const jid = `jct-${bldgStr}-${floor}-${i}`;
    addNode({ id: jid, name: `B${bldgStr} ${floor + 1}F Corridor`, floor, x: p(e.x), y: p(CORR_Y), facility: false });
    addEdge(`${e.roomId}--${jid}`, e.roomId, jid, 'corridor', true);
    return jid;
  });
  for (let i = 1; i < jcts.length; i++) {
    addEdge(`${jcts[i - 1]}--${jcts[i]}`, jcts[i - 1], jcts[i], 'corridor', true);
  }
}

// Internal Cafeteria Dining <-> Counter archway
addEdge('b1-cafeteria-arch', 'b1-cafeteria-dining', 'b1-cafeteria-counter', 'corridor', true);

// Building 1 4F Rooftop nodes + edges
addNode({ id: 'roof-jct-elev', name: 'Rooftop Promenade West', floor: 3, x: p(5.6), y: p(CORR_Y), facility: false });
addNode({ id: 'roof-jct-stairs', name: 'Rooftop Promenade Stairs', floor: 3, x: p(9.1), y: p(CORR_Y), facility: false });
addNode({ id: 'roof-jct-open', name: 'Rooftop Promenade Center', floor: 3, x: p(12), y: p(CORR_Y), facility: false });
addEdge('b1-elev-3--roof-jct', 'b1-elev-3', 'roof-jct-elev', 'corridor', true);
addEdge('roof-elev--stairs', 'roof-jct-elev', 'roof-jct-stairs', 'corridor', true);
addEdge('b1-stairs-3--roof-jct', 'b1-stairs-3', 'roof-jct-stairs', 'corridor', true);
addEdge('roof-stairs--open', 'roof-jct-stairs', 'roof-jct-open', 'corridor', true);
addEdge('roof-open--spur', 'roof-jct-open', 'b1-roof-open', 'corridor', true);
addEdge('roof-open--garden', 'roof-jct-open', 'b1-roof-garden', 'corridor', true);

// Vertical stacked elevators & stairs
for (const b of [1, 2] as const) {
  const topFloor = b === 1 ? 3 : 2;
  for (let f = 0; f < topFloor; f++) {
    addEdge(`b${b}-elev-${f}--${f + 1}`, `b${b}-elev-${f}`, `b${b}-elev-${f + 1}`, 'elevator', true);
    addEdge(`b${b}-stairs-${f}--${f + 1}`, `b${b}-stairs-${f}`, `b${b}-stairs-${f + 1}`, 'stairs', false);
  }
}

// Ground 1F Exterior Landings, 1:12 Ramps, Stairs, Accessible Promenade & PWD Parking
const exteriorNodes: MapNode[] = [
  { id: 'b1-landing-top', name: 'B1 Entrance Portico', floor: 0, x: p(19.25), y: p(24), facility: false },
  { id: 'b1-ramp-top', name: 'B1 1:12 Ramp Top', floor: 0, x: p(17.25), y: p(24), facility: false },
  { id: 'b1-ramp-bot', name: 'B1 1:12 Ramp Bottom', floor: 0, x: p(11.75), y: p(24), facility: false },
  { id: 'b1-ramp-walk', name: 'B1 Accessible Walk', floor: 0, x: p(11.75), y: p(29), facility: false },
  { id: 'b1-stairs-bot', name: 'B1 Promenade Steps', floor: 0, x: p(19.25), y: p(29), facility: false },
  { id: 'campus-plaza-curb', name: 'Campus Plaza Curb Cut', floor: 0, x: p(36), y: p(29), facility: false },
  { id: 'b2-landing-top', name: 'B2 Entrance Portico', floor: 0, x: p(50.5), y: p(24), facility: false },
  { id: 'b2-stairs-bot', name: 'B2 Promenade Steps', floor: 0, x: p(50.5), y: p(29), facility: false },
  { id: 'b2-ramp-top', name: 'B2 1:12 Ramp Top', floor: 0, x: p(52.5), y: p(24), facility: false },
  { id: 'b2-ramp-bot', name: 'B2 1:12 Ramp Bottom', floor: 0, x: p(58), y: p(24), facility: false },
  { id: 'b2-ramp-walk', name: 'B2 Accessible Walk', floor: 0, x: p(58), y: p(29), facility: false },
];
for (const n of exteriorNodes) addNode(n);

// B1 entrance -> steps (not accessible) + parallel West 1:12 ramp (accessible)
addEdge('b1-door--landing', 'b1-lobby-0', 'b1-landing-top', 'corridor', true);
addEdge('b1-landing--steps', 'b1-landing-top', 'b1-stairs-bot', 'stairs', false);
addEdge('b1-landing--ramp-top', 'b1-landing-top', 'b1-ramp-top', 'corridor', true);
addEdge('b1-ramp-1-12', 'b1-ramp-top', 'b1-ramp-bot', 'ramp', true);
addEdge('b1-ramp--walk', 'b1-ramp-bot', 'b1-ramp-walk', 'corridor', true);

// B2 entrance -> steps (not accessible) + parallel East 1:12 ramp (accessible)
addEdge('b2-door--landing', 'b2-lobby-0', 'b2-landing-top', 'corridor', true);
addEdge('b2-landing--steps', 'b2-landing-top', 'b2-stairs-bot', 'stairs', false);
addEdge('b2-landing--ramp-top', 'b2-landing-top', 'b2-ramp-top', 'corridor', true);
addEdge('b2-ramp-1-12', 'b2-ramp-top', 'b2-ramp-bot', 'ramp', true);
addEdge('b2-ramp--walk', 'b2-ramp-bot', 'b2-ramp-walk', 'corridor', true);

// Promenade chain & PWD parking curb cut
addEdge('prom-b1ramp--b1stairs', 'b1-ramp-walk', 'b1-stairs-bot', 'corridor', true);
addEdge('prom-b1stairs--plaza', 'b1-stairs-bot', 'campus-plaza-curb', 'corridor', true);
addEdge('prom-plaza--b2stairs', 'campus-plaza-curb', 'b2-stairs-bot', 'corridor', true);
addEdge('prom-b2stairs--b2ramp', 'b2-stairs-bot', 'b2-ramp-walk', 'corridor', true);
addEdge('pwd-curb-cut', 'campus-pwd-parking', 'campus-plaza-curb', 'corridor', true);

// Walkable areas covering every corridor, threshold, interior slab, archway, landing, ramp & promenade
const campusWalkableAreas: Record<FloorId, WalkableArea[]> = { 0: [], 1: [], 2: [], 3: [] };

for (const f of [0, 1, 2] as FloorId[]) {
  campusWalkableAreas[f].push(
    { name: `B1 Corridor ${f + 1}F`, x: p(4.1), y: p(12.1), width: p(29.8), height: p(2.8) },
    { name: `B2 Corridor ${f + 1}F`, x: p(40.1), y: p(12.1), width: p(27.8), height: p(2.8) },
  );
}
for (const r of campusRooms) {
  if (r.floor < 3) {
    campusWalkableAreas[r.floor].push({
      name: `${r.name} floorplate`,
      x: p(r.x + 0.1),
      y: p(r.y + 0.1),
      width: p(r.w - 0.2),
      height: p(r.h - 0.2),
    });
    if (r.doorX !== undefined && r.doorWall) {
      const ty = r.doorWall === 'south' ? r.y + r.h - 0.6 : r.y - 1.0;
      campusWalkableAreas[r.floor].push({
        name: `${r.name} door threshold`,
        x: p(r.doorX - 0.8),
        y: p(ty),
        width: p(1.6),
        height: p(1.6),
      });
    }
  }
}

// 1F Cafeteria archway & exterior accessible geometry
campusWalkableAreas[0].push(
  { name: 'Cafeteria Archway', x: p(25.7), y: p(7.5), width: p(1.6), height: p(2.0) },
  { name: 'B1 Main Entrance Threshold', x: p(18.0), y: p(22.2), width: p(2.5), height: p(2.6) },
  { name: 'B1 Landing & 1:12 Ramp', x: p(11.0), y: p(23.1), width: p(9.5), height: p(1.8) },
  { name: 'B1 Ramp West Walk', x: p(11.0), y: p(23.5), width: p(1.6), height: p(5.8) },
  { name: 'B1 Exterior Steps', x: p(18.0), y: p(23.2), width: p(2.5), height: p(6.1) },
  { name: 'B2 Main Entrance Threshold', x: p(49.2), y: p(22.2), width: p(2.6), height: p(2.6) },
  { name: 'B2 Landing & 1:12 Ramp', x: p(49.5), y: p(23.1), width: p(9.5), height: p(1.8) },
  { name: 'B2 Ramp East Walk', x: p(57.2), y: p(23.5), width: p(1.6), height: p(5.8) },
  { name: 'B2 Exterior Steps', x: p(49.3), y: p(23.2), width: p(2.4), height: p(6.1) },
  { name: 'Campus Promenade', x: p(10.0), y: p(27.6), width: p(50.0), height: p(3.3) },
  { name: 'PWD Parking & Curb Cut', x: p(34.5), y: p(30.2), width: p(3.0), height: p(6.5) },
);

// 4F Building 1 Rooftop deck slabs
campusWalkableAreas[3].push(
  { name: 'B1 Rooftop Elevator Slab', x: p(4.1), y: p(15.1), width: p(3.0), height: p(4.3) },
  { name: 'B1 Rooftop Stairs Slab', x: p(7.3), y: p(15.1), width: p(3.6), height: p(5.3) },
  { name: 'B1 Rooftop Open Deck & Promenade', x: p(4.1), y: p(4.1), width: p(13.8), height: p(11.8) },
  { name: 'B1 Rooftop South Terrace', x: p(11.0), y: p(15.0), width: p(7.0), height: p(7.9) },
  { name: 'B1 Rooftop Garden & Threshold', x: p(17.1), y: p(4.1), width: p(16.8), height: p(18.8) },
);

export const campusGraph: HotelGraph = {
  nodes: nodeList,
  edges,
  walkableAreas: campusWalkableAreas,
};

// ---------------- SVG Floor Plan Rendering (BP 344 Architectural Style) ----------------

function drawRoomFeature(r: CampusRoom): string {
  const x = p(r.x), y = p(r.y), w = p(r.w), h = p(r.h);
  const parts: string[] = [];

  if (r.feature === 'elevator') {
    const cx = x + w / 2, cy = y + h / 2;
    parts.push(`<rect x="${cx - 18}" y="${cy - 18}" width="36" height="36" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.6"/>`);
    parts.push(`<line x1="${cx - 18}" y1="${cy - 18}" x2="${cx + 18}" y2="${cy + 18}" stroke="#93c5fd" stroke-width="1"/>`);
    parts.push(`<line x1="${cx + 18}" y1="${cy - 18}" x2="${cx - 18}" y2="${cy + 18}" stroke="#93c5fd" stroke-width="1"/>`);
    parts.push(`<circle cx="${cx + 22}" cy="${cy - 8}" r="2.2" fill="#c88a2e"/>`);
  } else if (r.feature === 'stairs') {
    const steps = 8;
    const stepW = (w - 16) / steps;
    for (let i = 0; i < steps; i++) {
      parts.push(`<line x1="${x + 8 + i * stepW}" y1="${y + 10}" x2="${x + 8 + i * stepW}" y2="${y + h - 10}" stroke="#64748b" stroke-width="1"/>`);
    }
    parts.push(`<rect x="${x + 6}" y="${y + 7}" width="${w - 12}" height="3" fill="#c88a2e" opacity="0.85"/>`);
    parts.push(`<rect x="${x + 6}" y="${y + h - 10}" width="${w - 12}" height="3" fill="#c88a2e" opacity="0.85"/>`);
  } else if (r.feature === 'pwd-cr') {
    // BP 344 1.50 m turning radius circle + L grab bar + WC + outward door mark
    const cx = x + w * 0.52, cy = y + h * 0.56, rad = p(0.75);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="#eff6ff" fill-opacity="0.7" stroke="#2563eb" stroke-width="1.4" stroke-dasharray="4 3"/>`);
    parts.push(`<rect x="${x + w - 26}" y="${y + h - 38}" width="18" height="26" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>`);
    parts.push(`<path d="M${x + w - 10},${y + h - 42} V${y + h - 14} H${x + w - 34}" fill="none" stroke="#c88a2e" stroke-width="2.2"/>`);
    parts.push(`<rect x="${x + 12}" y="${y + h - 22}" width="22" height="14" rx="2" fill="#f8fafc" stroke="#475569" stroke-width="1"/>`);
    parts.push(`<text x="${cx}" y="${cy + 3}" font-size="8" text-anchor="middle" fill="#1d4ed8" font-weight="600">Ø1.50m</text>`);
  } else if (r.feature === 'low-counter') {
    parts.push(`<rect x="${x + 16}" y="${y + h * 0.62}" width="${w - 32}" height="14" rx="2" fill="#f5e6c8" stroke="#92400e" stroke-width="1.3"/>`);
    parts.push(`<rect x="${x + w * 0.55}" y="${y + h * 0.62}" width="${Math.min(48, w * 0.3)}" height="14" fill="#fde68a" stroke="#b45309" stroke-width="1"/>`);
  } else if (r.feature === 'wheelchair-bays') {
    // Designated front 0.90 x 1.20 m accessible wheelchair bay
    const bx = x + 14, by = r.doorWall === 'south' ? y + h - 36 : y + 14;
    parts.push(`<rect x="${bx}" y="${by}" width="${p(0.9)}" height="${p(1.2)}" fill="#dbeafe" stroke="#2563eb" stroke-width="1.2" stroke-dasharray="3 2"/>`);
    parts.push(`<rect x="${bx + 26}" y="${by}" width="${p(0.9)}" height="${p(1.2)}" fill="#dbeafe" stroke="#2563eb" stroke-width="1.2" stroke-dasharray="3 2"/>`);
  } else if (r.feature === 'comp-lab') {
    for (let row = 0; row < 2; row++) {
      parts.push(`<rect x="${x + 28}" y="${y + 26 + row * 48}" width="${w - 86}" height="16" fill="#e2e8f0" stroke="#475569" stroke-width="1"/>`);
    }
    parts.push(`<rect x="${x + w - 44}" y="${y + 26}" width="${p(1.2)}" height="${p(1.5)}" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.3" stroke-dasharray="3 2"/>`);
  } else if (r.feature === 'dining') {
    for (const [dx, dy] of [[0.28, 0.3], [0.68, 0.3], [0.28, 0.68]]) {
      parts.push(`<circle cx="${x + w * dx}" cy="${y + h * dy}" r="12" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>`);
    }
    parts.push(`<rect x="${x + w * 0.62}" y="${y + h * 0.62}" width="${p(1.1)}" height="${p(1.3)}" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.2" stroke-dasharray="3 2"/>`);
  } else if (r.feature === 'kitchen') {
    parts.push(`<rect x="${x + 14}" y="${y + h - 28}" width="${w - 28}" height="16" fill="#f5e6c8" stroke="#92400e" stroke-width="1.3"/>`);
  }

  return parts.join('');
}

function drawGroundApproachSvg(lx: number, rx: number, bx: number, sx: number, isWestRamp: boolean): string {
  // lx..rx = ramp run, bx = door/stairs x, sx = ramp bottom x
  const rampX = Math.min(lx, rx), rampW = Math.abs(rx - lx);
  const arrowDir = isWestRamp
    ? `M${p(lx) - 8},${p(24)} H${p(rx) + 12} M${p(rx) + 18},${p(23.7)} L${p(rx) + 10},${p(24)} L${p(rx) + 18},${p(24.3)}`
    : `M${p(lx) + 8},${p(24)} H${p(rx) - 12} M${p(rx) - 18},${p(23.7)} L${p(rx) - 10},${p(24)} L${p(rx) - 18},${p(24.3)}`;
  const midRamp = (lx + rx) / 2;
  const parts = [
    // Landing slab & steps down to promenade
    `<rect x="${p(Math.min(bx - 1.5, sx - 0.8))}" y="${p(23)}" width="${p(Math.abs(bx - sx) + 2.3)}" height="${p(2)}" fill="#efe8d6" stroke="#5b6a5f" stroke-width="1.5"/>`,
    // Parallel 1:12 ramp + 100mm toe curbs + handrails
    `<rect x="${p(rampX)}" y="${p(23.15)}" width="${p(rampW)}" height="${p(1.7)}" fill="#e3f0e5" stroke="#1e5631" stroke-width="1.8"/>`,
    `<line x1="${p(rampX)}" y1="${p(23.22)}" x2="${p(rampX + rampW)}" y2="${p(23.22)}" stroke="#c88a2e" stroke-width="2.4"/>`,
    `<line x1="${p(rampX)}" y1="${p(24.78)}" x2="${p(rampX + rampW)}" y2="${p(24.78)}" stroke="#c88a2e" stroke-width="2.4"/>`,
    `<path d="${arrowDir}" fill="none" stroke="#166534" stroke-width="1.6"/>`,
    `<text x="${p(midRamp)}" y="${p(22.65)}" font-size="10" text-anchor="middle" fill="#166534" font-weight="700">1:12 RAMP</text>`,
    // Ramp walk down to promenade
    `<rect x="${p(sx - 0.9)}" y="${p(24.85)}" width="${p(1.8)}" height="${p(2.75)}" fill="#e3f0e5" stroke="#2f5d46" stroke-width="1.2"/>`,
    // Entrance Steps
    `<rect x="${p(bx - 1.4)}" y="${p(24.8)}" width="${p(2.8)}" height="${p(2.8)}" fill="#f8f4e8" stroke="#475569" stroke-width="1.4"/>`,
  ];
  for (let i = 1; i <= 5; i++) {
    parts.push(`<line x1="${p(bx - 1.35)}" y1="${p(24.8 + i * 0.45)}" x2="${p(bx + 1.35)}" y2="${p(24.8 + i * 0.45)}" stroke="#64748b" stroke-width="1.1"/>`);
  }
  parts.push(`<text x="${p(bx)}" y="${p(26.6)}" font-size="9.5" text-anchor="middle" fill="#475569" font-weight="600">STEPS</text>`);
  return parts.join('');
}

function renderCampusFloorSvg(floor: FloorId): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CAMPUS_WIDTH} ${CAMPUS_HEIGHT}" width="${CAMPUS_WIDTH}" height="${CAMPUS_HEIGHT}" style="font-family:'Geist',system-ui,sans-serif">`,
    `<defs>`,
    `  <pattern id="grid20" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#d9d1bf" stroke-width="0.6"/></pattern>`,
    `  <pattern id="roofHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="#94a3b8" stroke-width="1.5"/></pattern>`,
    `</defs>`,
    `<rect width="${CAMPUS_WIDTH}" height="${CAMPUS_HEIGHT}" fill="#fbf7ee"/>`,
    `<rect width="${CAMPUS_WIDTH}" height="${CAMPUS_HEIGHT}" fill="url(#grid20)" opacity="0.55"/>`,
  ];

  // Site wings banners
  parts.push(`<text x="${p(19)}" y="${p(2.5)}" font-size="14" font-weight="700" text-anchor="middle" fill="#1f3b2e">BUILDING 1 · WEST WING (${floor === 3 ? '4F ROOFTOP' : `${floor + 1}F`})</text>`);
  parts.push(`<text x="${p(54)}" y="${p(2.5)}" font-size="14" font-weight="700" text-anchor="middle" fill="#1e3a5f">BUILDING 2 · EAST WING (${floor === 3 ? '3F ROOF SLAB' : `${floor + 1}F`})</text>`);

  if (floor === 0) {
    // South Drive & PWD Parking Zone
    parts.push(`<rect x="${p(4)}" y="${p(31.2)}" width="${p(64)}" height="${p(7.8)}" rx="4" fill="#e6e1d5" stroke="#9b8f79" stroke-width="1.2"/>`);
    parts.push(`<rect x="${p(10)}" y="${p(27.5)}" width="${p(50)}" height="${p(3.5)}" rx="3" fill="#e8eedf" stroke="#2f5d46" stroke-width="1.6"/>`);
    // 600mm yellow/brass tactile guidance strip along campus promenade
    parts.push(`<line x1="${p(11.75)}" y1="${p(29.0)}" x2="${p(58.0)}" y2="${p(29.0)}" stroke="#c88a2e" stroke-width="6" stroke-dasharray="10 6" opacity="0.55"/>`);
    parts.push(`<text x="${p(36)}" y="${p(26.5)}" font-size="10.5" font-weight="700" text-anchor="middle" fill="#1f4433">BP 344 ACCESSIBLE CAMPUS PROMENADE (3.50 m) &amp; TACTILE PATH</text>`);

    // Dual 3.70 m PWD parking bays (2.60 + 1.50 shared aisle + 2.60)
    parts.push(`<rect x="${p(32.5)}" y="${p(32.4)}" width="${p(2.7)}" height="${p(5.4)}" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.8"/>`);
    parts.push(`<rect x="${p(35.2)}" y="${p(32.4)}" width="${p(1.6)}" height="${p(5.4)}" fill="#fef3c7" stroke="#b45309" stroke-width="1.4" stroke-dasharray="4 3"/>`);
    parts.push(`<rect x="${p(36.8)}" y="${p(32.4)}" width="${p(2.7)}" height="${p(5.4)}" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.8"/>`);
    parts.push(`<path d="M${p(35.2)},${p(31.0)} H${p(36.8)} V${p(32.4)} H${p(35.2)} Z" fill="#fde68a" stroke="#b45309" stroke-width="1.2"/>`);
    parts.push(`<text x="${p(33.85)}" y="${p(35.3)}" font-size="10" font-weight="700" text-anchor="middle" fill="#1e3a8a">PWD</text>`);
    parts.push(`<text x="${p(38.15)}" y="${p(35.3)}" font-size="10" font-weight="700" text-anchor="middle" fill="#1e3a8a">PWD</text>`);
    parts.push(`<text x="${p(36)}" y="${p(38.55)}" font-size="10" font-weight="700" text-anchor="middle" fill="#1e3a8a">BP 344 PWD BAYS (2.60 m + 1.50 m AISLE = 4.10 m) · CURB CUT 1:12</text>`);

    // Entrance Stairs + 1:12 Ramps for B1 (West) and B2 (East)
    parts.push(drawGroundApproachSvg(17.25, 11.75, 19.25, 11.75, true));
    parts.push(drawGroundApproachSvg(52.5, 58.0, 50.5, 58.0, false));
  }

  // Central Plaza separation indicator
  parts.push(`<rect x="${p(34.5)}" y="${p(5)}" width="${p(5.0)}" height="${p(17)}" rx="4" fill="#edf4e8" fill-opacity="0.7" stroke="#65a30d" stroke-dasharray="5 3"/>`);
  parts.push(`<text x="${p(37)}" y="${p(13.5)}" font-size="11" font-weight="600" text-anchor="middle" fill="#3f6212" transform="rotate(-90 ${p(37)} ${p(13.5)})">Campus Central Plaza (6.0 m)</text>`);

  if (floor < 3) {
    // Enclosing slabs + Central Corridors
    parts.push(`<rect x="${p(4)}" y="${p(4)}" width="${p(30)}" height="${p(19)}" fill="#fffdf7" stroke="#1f3b2e" stroke-width="3.5"/>`);
    parts.push(`<rect x="${p(4)}" y="${p(12)}" width="${p(30)}" height="${p(3)}" fill="#f1ead8" stroke="#6b7280" stroke-width="1"/>`);
    parts.push(`<text x="${p(19)}" y="${p(13.7)}" font-size="9.5" font-weight="600" text-anchor="middle" fill="#52525b">B1 CORRIDOR (3.00 m WIDE)</text>`);

    parts.push(`<rect x="${p(40)}" y="${p(4)}" width="${p(28)}" height="${p(19)}" fill="#fffdf7" stroke="#1e3a5f" stroke-width="3.5"/>`);
    parts.push(`<rect x="${p(40)}" y="${p(12)}" width="${p(28)}" height="${p(3)}" fill="#f1ead8" stroke="#6b7280" stroke-width="1"/>`);
    parts.push(`<text x="${p(54)}" y="${p(13.7)}" font-size="9.5" font-weight="600" text-anchor="middle" fill="#52525b">B2 CORRIDOR (3.00 m WIDE)</text>`);
  } else {
    // 4F Building 1 Rooftop Open Area + Garden Area w/ 1.20 m parapet; Building 2 hatched non-accessible roof
    parts.push(`<rect x="${p(4)}" y="${p(4)}" width="${p(30)}" height="${p(19)}" fill="#fffdf7" stroke="#166534" stroke-width="5"/>`);
    parts.push(`<rect x="${p(4.2)}" y="${p(4.2)}" width="${p(29.6)}" height="${p(18.6)}" fill="none" stroke="#c88a2e" stroke-width="1.6" stroke-dasharray="6 3"/>`);
    // Garden deck + planters
    parts.push(`<rect x="${p(18)}" y="${p(4)}" width="${p(16)}" height="${p(19)}" fill="#eef7ea" stroke="#4d7c0f" stroke-width="1.4" stroke-dasharray="5 3"/>`);
    parts.push(`<rect x="${p(20)}" y="${p(6)}" width="${p(12)}" height="${p(4)}" rx="4" fill="#bbf7d0" stroke="#15803d" stroke-width="1.4"/>`);
    parts.push(`<rect x="${p(20)}" y="${p(16.5)}" width="${p(12)}" height="${p(4)}" rx="4" fill="#bbf7d0" stroke="#15803d" stroke-width="1.4"/>`);
    // Gap doorway threshold at x=18, y=13.5
    parts.push(`<rect x="${p(17.7)}" y="${p(12.2)}" width="${p(0.6)}" height="${p(2.6)}" fill="#eef7ea"/>`);
    parts.push(`<text x="${p(26)}" y="${p(22.1)}" font-size="9.5" font-weight="700" text-anchor="middle" fill="#166534">1.20 m PARAPET + 100 mm KICKPLATE</text>`);

    // Building 2 3F Top Roof Slab (No Public Access)
    parts.push(`<rect x="${p(40)}" y="${p(4)}" width="${p(28)}" height="${p(19)}" fill="url(#roofHatch)" stroke="#64748b" stroke-width="2.5"/>`);
    parts.push(`<rect x="${p(45)}" y="${p(11.5)}" width="${p(18)}" height="${p(4)}" rx="4" fill="#f8fafc" fill-opacity="0.92" stroke="#64748b"/>`);
    parts.push(`<text x="${p(54)}" y="${p(13.9)}" font-size="11.5" font-weight="700" text-anchor="middle" fill="#334155">Building 2 Roof · 3F Top Slab (No Access)</text>`);
  }

  // Draw all rooms for this floor
  const floorRooms = campusRooms.filter(r => r.floor === floor);
  for (const r of floorRooms) {
    const x = p(r.x), y = p(r.y), w = p(r.w), h = p(r.h);
    const fill = r.category === 'elevator' ? '#eff6ff' : r.category === 'restroom' ? '#f0fdf4' : r.category === 'stairs' ? '#f3f4f6' : 'none';
    if (floor < 3 || r.category === 'elevator' || r.category === 'stairs') {
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#1f3b2e" stroke-width="2.4"/>`);
    }
    parts.push(drawRoomFeature(r));

    // Door gaps & architectural swing arcs
    if (r.doorX !== undefined && r.doorWall && floor < 3) {
      const dy = r.doorWall === 'south' ? p(r.y + r.h) : p(r.y);
      const dx = p(r.doorX);
      parts.push(`<line x1="${dx - 11}" y1="${dy}" x2="${dx + 11}" y2="${dy}" stroke="#fffdf7" stroke-width="4.5"/>`);
      const arcDir = r.doorWall === 'south' ? -1 : 1;
      parts.push(`<path d="M${dx - 11},${dy} A22,22 0 0,${arcDir > 0 ? 1 : 0} ${dx + 11},${dy + arcDir * 22}" fill="none" stroke="#78716c" stroke-width="1" stroke-dasharray="2 2"/>`);
      parts.push(`<line x1="${dx + 11}" y1="${dy}" x2="${dx + 11}" y2="${dy + arcDir * 22}" stroke="#44403c" stroke-width="1.3"/>`);
    }

    // Exterior door gaps on 1F
    if (floor === 0 && (r.id === 'b1-lobby-0' || r.id === 'b2-lobby-0') && r.nodeX !== undefined) {
      const dx = p(r.nodeX), dy = p(23);
      parts.push(`<line x1="${dx - 18}" y1="${dy}" x2="${dx + 18}" y2="${dy}" stroke="#1d4ed8" stroke-width="4"/>`);
    }

    // Internal Cafeteria Archway gap on 1F (x = 26.5, y = 8.5)
    if (r.id === 'b1-cafeteria-dining') {
      parts.push(`<line x1="${p(26.5)}" y1="${p(7.5)}" x2="${p(26.5)}" y2="${p(9.5)}" stroke="#fffdf7" stroke-width="4.5"/>`);
      parts.push(`<text x="${p(26.5)}" y="${p(7.1)}" font-size="8.5" font-weight="600" text-anchor="middle" fill="#92400e">ARCH</text>`);
    }

    // Room labels placed cleanly clear of HUD pill anchors
    const lx = p(r.x + r.w / 2);
    const ly = r.labelRow === 'top'
      ? p(r.y + r.h - 2.6)
      : r.labelRow === 'bot'
        ? p(r.y + 2.3)
        : p(r.y + r.h / 2) - 4;
    parts.push(`<text x="${lx}" y="${ly}" font-size="10.5" font-weight="700" text-anchor="middle" fill="#18271f">${esc(r.name)}</text>`);
    parts.push(`<text x="${lx}" y="${ly + 12}" font-size="8.2" text-anchor="middle" fill="#526059">${esc(r.subtitle)}</text>`);
  }

  // Metric dimension callouts
  parts.push(`<line x1="${p(4)}" y1="${p(3.4)}" x2="${p(34)}" y2="${p(3.4)}" stroke="#6b7280" stroke-width="1"/>`);
  parts.push(`<text x="${p(19)}" y="${p(3.25)}" font-size="8.5" text-anchor="middle" fill="#4b5563">30.0 m</text>`);
  parts.push(`<line x1="${p(40)}" y1="${p(3.4)}" x2="${p(68)}" y2="${p(3.4)}" stroke="#6b7280" stroke-width="1"/>`);
  parts.push(`<text x="${p(54)}" y="${p(3.25)}" font-size="8.5" text-anchor="middle" fill="#4b5563">28.0 m</text>`);

  parts.push(`</svg>`);
  return parts.join('');
}

const toSvgDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export const campusFloors: BuildingFloor[] = [
  {
    id: 0,
    name: '1F · Campus Ground & Admin',
    short: '1F',
    description: "Building 1 (Registrar, Stockroom, 2-room Cafeteria, CR), Building 2 (Principal's Office, 3 Classrooms, CR), 1:12 ramps, steps, and BP 344 PWD parking.",
    image: toSvgDataUrl(renderCampusFloorSvg(0)),
    width: CAMPUS_WIDTH,
    height: CAMPUS_HEIGHT,
    metersPerPixel: 1 / CAMPUS_SCALE,
  },
  {
    id: 1,
    name: '2F · Academics & Lab',
    short: '2F',
    description: 'Building 1 (3 Classrooms, Faculty Room, CR) and Building 2 (3 Classrooms, Computer Laboratory, CR), linked step-free via stacked BP 344 elevators.',
    image: toSvgDataUrl(renderCampusFloorSvg(1)),
    width: CAMPUS_WIDTH,
    height: CAMPUS_HEIGHT,
    metersPerPixel: 1 / CAMPUS_SCALE,
  },
  {
    id: 2,
    name: '3F · Upper Classrooms',
    short: '3F',
    description: 'Building 1 (4 Classrooms, CR) and Building 2 (4 Classrooms), served by stacked BP 344 elevators and stairwells.',
    image: toSvgDataUrl(renderCampusFloorSvg(2)),
    width: CAMPUS_WIDTH,
    height: CAMPUS_HEIGHT,
    metersPerPixel: 1 / CAMPUS_SCALE,
  },
  {
    id: 3,
    name: '4F · Building 1 Rooftop',
    short: '4F',
    description: 'Building 1 Rooftop Open Area and Garden Area enclosed by a 1.20 m parapet; Building 2 stops at 3F.',
    image: toSvgDataUrl(renderCampusFloorSvg(3)),
    width: CAMPUS_WIDTH,
    height: CAMPUS_HEIGHT,
    metersPerPixel: 1 / CAMPUS_SCALE,
  },
];

export const campusBuilding: Building = {
  id: 'multi-building-campus-bp344',
  name: 'Multi-Building Campus (BP 344)',
  floors: campusFloors,
  graph: campusGraph,
  status: 'ready',
  updatedAt: '2026-11-13T00:00:00Z',
  sample: true,
};
