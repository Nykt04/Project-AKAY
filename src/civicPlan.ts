import type { FloorId, WalkableArea } from './types';

export const SCALE = 20;
export const SHEET_WIDTH_M = 60, SHEET_HEIGHT_M = 50;
export const PLAN_WIDTH = SHEET_WIDTH_M * SCALE, PLAN_HEIGHT = SHEET_HEIGHT_M * SCALE;
export const METERS_PER_PIXEL = 1 / SCALE;

export const px = (meters: number) => Math.round(meters * SCALE);

export interface RoomBox {
  id: string;
  floor: FloorId;
  name: string;
  subtitle?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  door?: { x: number; y: number; width: number; wall: 'north' | 'south' | 'east' | 'west'; glass?: boolean };
  staffOnly?: boolean;
}

export interface DimensionLine {
  floor: FloorId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  meters: number;
  kind: 'building' | 'corridor' | 'gap' | 'room' | 'ramp' | 'parking';
  offset?: number;
}

const coreRooms = (floor: FloorId): RoomBox[] => [
  {
    id: `lift-${floor}`, floor, name: 'Elevator', subtitle: '2.4 × 2.4 m cab',
    x: 4, y: 3, w: 3, h: 10,
    door: { x: 5.5, y: 13, width: 1.2, wall: 'south' },
  },
  {
    id: `stairs-${floor}`, floor, name: 'Stairs', subtitle: '24 risers × 0.15 m',
    x: 7, y: 3, w: 6, h: 10,
    door: { x: 11.5, y: 13, width: 2.0, wall: 'south' },
  },
];

export const civicRooms: RoomBox[] = [
  ...coreRooms(0),
  { id: 'utility-0', floor: 0, name: 'Utility & MEP', subtitle: 'Staff only', x: 13, y: 3, w: 6, h: 10, staffOnly: true },
  { id: 'records-room', floor: 0, name: 'Records room', subtitle: 'Restricted archive', x: 19, y: 3, w: 25, h: 10, staffOnly: true },
  { id: 'services-0', floor: 0, name: 'Building services', subtitle: 'Staff only', x: 4, y: 16, w: 14, h: 9, staffOnly: true },
  {
    id: 'lobby-0', floor: 0, name: 'Entrance lobby', subtitle: 'Info & waiting lounge',
    x: 18, y: 16, w: 16, h: 9,
    door: { x: 26, y: 25, width: 2.0, wall: 'south', glass: true },
  },
  {
    id: 'souvenir-shop', floor: 0, name: 'Souvenir shop', subtitle: 'Glass enclosure · 6.0 × 9.0 m',
    x: 34, y: 16, w: 6, h: 9,
    door: { x: 34, y: 21, width: 1.2, wall: 'west', glass: true },
  },
  { id: 'security-0', floor: 0, name: 'Security office', subtitle: 'Staff only', x: 40, y: 16, w: 4, h: 9, staffOnly: true },

  ...coreRooms(1),
  {
    id: 'restroom-1', floor: 1, name: 'Restroom', subtitle: '6.0 × 10.0 m · PWD cubicle',
    x: 13, y: 3, w: 6, h: 10,
    door: { x: 16, y: 13, width: 1.2, wall: 'south' },
  },
  {
    id: 'library', floor: 1, name: 'Public library', subtitle: '25.0 × 10.0 m · Reading & stacks',
    x: 19, y: 3, w: 25, h: 10,
    door: { x: 31.5, y: 13, width: 1.8, wall: 'south' },
  },
  {
    id: 'office-a', floor: 1, name: 'Office A', subtitle: '20.0 × 9.0 m · Civil services',
    x: 4, y: 16, w: 20, h: 9,
    door: { x: 14, y: 16, width: 1.5, wall: 'north' },
  },
  {
    id: 'office-b', floor: 1, name: 'Office B', subtitle: '20.0 × 9.0 m · Permits & records',
    x: 24, y: 16, w: 20, h: 9,
    door: { x: 34, y: 16, width: 1.5, wall: 'north' },
  },

  ...coreRooms(2),
  {
    id: 'restroom-2', floor: 2, name: 'Restroom', subtitle: '6.0 × 10.0 m · PWD cubicle',
    x: 13, y: 3, w: 6, h: 10,
    door: { x: 16, y: 13, width: 1.2, wall: 'south' },
  },
  {
    id: 'hall-1', floor: 2, name: 'Function Hall 1', subtitle: '12.5 × 10.0 m · North-west',
    x: 19, y: 3, w: 12.5, h: 10,
    door: { x: 25, y: 13, width: 1.8, wall: 'south' },
  },
  {
    id: 'hall-2', floor: 2, name: 'Function Hall 2', subtitle: '12.5 × 10.0 m · North-east',
    x: 31.5, y: 3, w: 12.5, h: 10,
    door: { x: 38, y: 13, width: 1.8, wall: 'south' },
  },
  {
    id: 'hall-3', floor: 2, name: 'Function Hall 3', subtitle: '20.0 × 9.0 m · South-west',
    x: 4, y: 16, w: 20, h: 9,
    door: { x: 14, y: 16, width: 1.8, wall: 'north' },
  },
  {
    id: 'hall-4', floor: 2, name: 'Function Hall 4', subtitle: '20.0 × 9.0 m · South-east',
    x: 24, y: 16, w: 20, h: 9,
    door: { x: 34, y: 16, width: 1.8, wall: 'north' },
  },
];

const gapLines = (floor: FloorId, xs: number[], y = 14.5): DimensionLine[] =>
  xs.slice(1).map((x2, i) => {
    const x1 = xs[i], meters = Math.round((x2 - x1) * 100) / 100;
    return { floor, x1, y1: y, x2, y2: y, meters, label: `${meters.toFixed(1)} m`, kind: 'gap' };
  });

export const civicDimensions: DimensionLine[] = [
  ...[0, 1, 2].flatMap((floor): DimensionLine[] => [
    { floor, x1: 4, y1: 1.6, x2: 44, y2: 1.6, meters: 40, label: '40.0 m building width', kind: 'building' },
    { floor, x1: 1.8, y1: 3, x2: 1.8, y2: 25, meters: 22, label: '22.0 m depth', kind: 'building' },
    { floor, x1: 45.4, y1: 13, x2: 45.4, y2: 16, meters: 3, label: '3.0 m hallway', kind: 'corridor' },
    { floor, x1: 4, y1: 13.6, x2: 44, y2: 13.6, meters: 40, label: '40.0 m central hallway', kind: 'corridor' },
  ]),
  ...gapLines(0, [5.5, 11.5, 26, 32.5]),
  { floor: 0, x1: 30, y1: 25.2, x2: 37.5, y2: 25.2, meters: 7.5, label: '7.5 m ramp (1:12)', kind: 'ramp' },
  { floor: 0, x1: 33.6, y1: 16, x2: 33.6, y2: 21.4, meters: 5.4, label: '5.4 m ramp (1:12)', kind: 'ramp' },
  { floor: 0, x1: 4, y1: 46.2, x2: 11, y2: 46.2, meters: 7, label: '2 × 3.5 m rescue bays', kind: 'parking' },
  { floor: 0, x1: 43, y1: 49.4, x2: 52, y2: 49.4, meters: 9, label: '2 × 4.5 m × 12.0 m fire truck bays', kind: 'parking' },
  { floor: 0, x1: 56.5, y1: 31, x2: 56.5, y2: 37, meters: 6, label: '6.0 m drive aisle', kind: 'parking' },

  ...gapLines(1, [5.5, 11.5, 14, 16, 31.5, 34]),
  { floor: 1, x1: 19, y1: 2.3, x2: 44, y2: 2.3, meters: 25, label: '25.0 m library', kind: 'room' },
  { floor: 1, x1: 4, y1: 26.2, x2: 24, y2: 26.2, meters: 20, label: '20.0 m Office A', kind: 'room' },
  { floor: 1, x1: 24, y1: 26.2, x2: 44, y2: 26.2, meters: 20, label: '20.0 m Office B', kind: 'room' },

  ...gapLines(2, [5.5, 11.5, 14, 16, 25, 34, 38]),
  { floor: 2, x1: 19, y1: 2.3, x2: 31.5, y2: 2.3, meters: 12.5, label: '12.5 m Hall 1', kind: 'room' },
  { floor: 2, x1: 31.5, y1: 2.3, x2: 44, y2: 2.3, meters: 12.5, label: '12.5 m Hall 2', kind: 'room' },
  { floor: 2, x1: 4, y1: 26.2, x2: 24, y2: 26.2, meters: 20, label: '20.0 m Hall 3', kind: 'room' },
  { floor: 2, x1: 24, y1: 26.2, x2: 44, y2: 26.2, meters: 20, label: '20.0 m Hall 4', kind: 'room' },
];

const areaM = (name: string, x: number, y: number, w: number, h: number): WalkableArea => ({
  name, x: px(x), y: px(y), width: px(w), height: px(h),
});

const coreWalkable = (): WalkableArea[] => [
  areaM('Central public hallway', 4.3, 13.5, 39.4, 2.0),
  areaM('Elevator doorway and cab', 4.9, 11.0, 1.2, 3.8),
  areaM('Stairwell opening and landing', 10.5, 11.0, 2.0, 3.8),
];

export const civicWalkableAreas: Record<FloorId, WalkableArea[]> = {
  0: [
    ...coreWalkable(),
    areaM('Interior lobby steps', 25.0, 14.2, 2.0, 7.2),
    areaM('Interior accessible ramp', 31.6, 14.2, 1.8, 7.2),
    areaM('Entrance lobby spine', 19.5, 20.0, 13.8, 2.0),
    areaM('Info desk & waiting lounge bay', 20.0, 18.0, 2.0, 5.5),
    areaM('Souvenir shop glass doorway', 32.2, 20.4, 4.8, 1.2),
    areaM('Main entrance doorway', 25.0, 20.5, 2.0, 6.5),
    areaM('Entrance plaza', 25.0, 25.8, 5.5, 1.4),
    areaM('Outdoor accessible ramp', 29.8, 25.8, 8.2, 1.4),
    areaM('Outdoor ramp landing to sidewalk', 36.8, 26.0, 1.4, 4.5),
    areaM('Outdoor front steps', 25.0, 26.0, 2.0, 4.5),
    areaM('Public sidewalk', 25.0, 29.4, 13.2, 1.2),
    areaM('Main parking crosswalk', 25.2, 29.5, 1.6, 9.0),
    areaM('PWD parking access aisle', 34.2, 29.5, 1.6, 9.0),
    areaM('Records room interior (staff only)', 37.0, 7.0, 2.0, 2.0),
  ],
  1: [
    ...coreWalkable(),
    areaM('2nd floor restroom doorway & foyer', 15.4, 10.0, 1.2, 4.8),
    areaM('Public library double doorway & foyer', 30.6, 9.5, 1.8, 5.3),
    areaM('Office A doorway & foyer', 13.25, 14.2, 1.5, 4.8),
    areaM('Office B doorway & foyer', 33.25, 14.2, 1.5, 4.8),
  ],
  2: [
    ...coreWalkable(),
    areaM('3rd floor restroom doorway & foyer', 15.4, 10.0, 1.2, 4.8),
    areaM('Function Hall 1 doorway & foyer', 24.1, 9.5, 1.8, 5.3),
    areaM('Function Hall 2 doorway & foyer', 37.1, 9.5, 1.8, 5.3),
    areaM('Function Hall 3 doorway & foyer', 13.1, 14.2, 1.8, 4.8),
    areaM('Function Hall 4 doorway & foyer', 33.1, 14.2, 1.8, 4.8),
  ],
};

function renderDoorOpening(room: RoomBox): string {
  if (!room.door) return '';
  const { x, y, width, wall, glass } = room.door;
  const cx = px(x), cy = px(y), w = px(width);
  const stroke = glass ? '#2a7b88' : '#7b5b2a';
  const gapFill = '#fbf8f1';
  if (wall === 'south' || wall === 'north') {
    const dir = wall === 'south' ? -1 : 1;
    return `<rect x="${cx - w / 2}" y="${cy - 5}" width="${w}" height="10" fill="${gapFill}"/>`
      + `<line x1="${cx - w / 2}" y1="${cy}" x2="${cx - w / 2}" y2="${cy + dir * w * 0.65}" stroke="${stroke}" stroke-width="2"/>`
      + `<path d="M ${cx - w / 2} ${cy + dir * w * 0.65} A ${w * 0.65} ${w * 0.65} 0 0 ${wall === 'south' ? 1 : 0} ${cx + w / 2} ${cy}" fill="none" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="3,3"/>`;
  }
  const dir = wall === 'west' ? 1 : -1;
  return `<rect x="${cx - 5}" y="${cy - w / 2}" width="10" height="${w}" fill="${gapFill}"/>`
    + (glass
      ? `<line x1="${cx - 3}" y1="${cy - w / 2}" x2="${cx + dir * w * 0.75}" y2="${cy - w / 4}" stroke="#2a7b88" stroke-width="2.5"/>`
      : `<line x1="${cx}" y1="${cy - w / 2}" x2="${cx + dir * w * 0.65}" y2="${cy - w / 2}" stroke="${stroke}" stroke-width="2"/>`);
}

const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderDimLine(d: DimensionLine): string {
  const x1 = px(d.x1), y1 = px(d.y1), x2 = px(d.x2), y2 = px(d.y2);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const horiz = Math.abs(y2 - y1) < 1;
  const color = d.kind === 'gap' ? '#1c4a3e' : '#8a6421';
  const tick = 5;
  const ticks = horiz
    ? `<line x1="${x1}" y1="${y1 - tick}" x2="${x1}" y2="${y1 + tick}" stroke="${color}" stroke-width="1.4"/><line x1="${x2}" y1="${y2 - tick}" x2="${x2}" y2="${y2 + tick}" stroke="${color}" stroke-width="1.4"/>`
    : `<line x1="${x1 - tick}" y1="${y1}" x2="${x1 + tick}" y2="${y1}" stroke="${color}" stroke-width="1.4"/><line x1="${x2 - tick}" y1="${y2}" x2="${x2 + tick}" y2="${y2}" stroke="${color}" stroke-width="1.4"/>`;
  const pillW = Math.max(46, d.label.length * 6.4);
  return `<g class="dim-line">`
    + `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.2" stroke-dasharray="${d.kind === 'gap' ? '3,2' : 'none'}"/>`
    + ticks
    + `<rect x="${mx - pillW / 2}" y="${my - 8}" width="${pillW}" height="16" rx="3" fill="#fbf8f1" stroke="${color}" stroke-width="0.8"/>`
    + `<text x="${mx}" y="${my + 4}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="600" fill="${color}">${escXml(d.label)}</text>`
    + `</g>`;
}

export function renderFloorSvg(floor: FloorId): string {
  const rooms = civicRooms.filter(r => r.floor === floor);
  const dims = civicDimensions.filter(d => d.floor === floor);
  const grid: string[] = [];
  for (let x = 0; x <= SHEET_WIDTH_M; x += 5) grid.push(`<line x1="${px(x)}" y1="0" x2="${px(x)}" y2="${PLAN_HEIGHT}" stroke="#ece5d5" stroke-width="1"/>`);
  for (let y = 0; y <= SHEET_HEIGHT_M; y += 5) grid.push(`<line x1="0" y1="${px(y)}" x2="${PLAN_WIDTH}" y2="${px(y)}" stroke="#ece5d5" stroke-width="1"/>`);

  const roomSvg = rooms.map(r => {
    const rx = px(r.x), ry = px(r.y), rw = px(r.w), rh = px(r.h);
    const fill = r.staffOnly ? 'url(#staffHatch)' : r.id.startsWith('restroom') ? '#eef3f1' : r.id === 'souvenir-shop' ? '#eef7f8' : '#f7f2e7';
    return `<g>`
      + `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fill}" stroke="#2f3a36" stroke-width="3"/>`
      + `<text x="${rx + rw / 2}" y="${ry + 24}" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="700" fill="#1e352f">${escXml(r.name)}</text>`
      + (r.subtitle ? `<text x="${rx + rw / 2}" y="${ry + 40}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" fill="#52605b">${escXml(r.subtitle)}</text>` : '')
      + `</g>`;
  }).join('');

  const coreDetails = `<g stroke="#56635e" stroke-width="1.2" fill="none">`
    + `<rect x="${px(4.3)}" y="${px(7.6)}" width="${px(2.4)}" height="${px(2.4)}" fill="#e5ece9" stroke="#2f3a36" stroke-width="1.6"/>`
    + `<line x1="${px(4.3)}" y1="${px(7.6)}" x2="${px(6.7)}" y2="${px(10.0)}"/>`
    + `<line x1="${px(6.7)}" y1="${px(7.6)}" x2="${px(4.3)}" y2="${px(10.0)}"/>`
    + Array.from({ length: 10 }, (_, i) => `<line x1="${px(7.4)}" y1="${px(5 + i * 0.5)}" x2="${px(12.6)}" y2="${px(5 + i * 0.5)}"/>`).join('')
    + `<line x1="${px(10)}" y1="${px(4.5)}" x2="${px(10)}" y2="${px(10.5)}" stroke-width="2"/>`
    + `</g>`;

  const floor0Extras = floor === 0 ? `
    <rect x="${px(2)}" y="${px(31)}" width="${px(56)}" height="${px(18)}" rx="6" fill="#e6e2d8" stroke="#8c8577" stroke-width="2"/>
    <text x="${px(30)}" y="${px(34.3)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#4a463f" letter-spacing="1.5">GOVERNMENT &amp; EMERGENCY VEHICLE DRIVE AISLE (6.0 m WIDE)</text>
    <g>
      <rect x="${px(4)}" y="${px(37)}" width="${px(3.5)}" height="${px(8)}" fill="#f5ece6" stroke="#a63a2b" stroke-width="2" stroke-dasharray="6,3"/>
      <text x="${px(5.75)}" y="${px(41)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="700" fill="#a63a2b">RESCUE 1</text>
      <text x="${px(5.75)}" y="${px(42.3)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="#a63a2b">3.5 × 8.0 m</text>
      <rect x="${px(7.5)}" y="${px(37)}" width="${px(3.5)}" height="${px(8)}" fill="#f5ece6" stroke="#a63a2b" stroke-width="2" stroke-dasharray="6,3"/>
      <text x="${px(9.25)}" y="${px(41)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="700" fill="#a63a2b">RESCUE 2</text>
      <text x="${px(9.25)}" y="${px(42.3)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="#a63a2b">3.5 × 8.0 m</text>
    </g>
    ${Array.from({ length: 5 }, (_, i) => {
      const sx = 12 + i * 2.5;
      return `<rect x="${px(sx)}" y="${px(37)}" width="${px(2.5)}" height="${px(5)}" fill="#efece4" stroke="#6f6a5e" stroke-width="1.2"/><text x="${px(sx + 1.25)}" y="${px(39.8)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#5b574e">GOV ${i + 1}</text>`;
    }).join('')}
    <g fill="#fbf8f1" stroke="#6f6a5e" stroke-width="0.6">
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${px(25)}" y="${px(31.2 + i * 1.1)}" width="${px(2)}" height="${px(0.65)}"/>`).join('')}
    </g>
    <rect x="${px(32)}" y="${px(37)}" width="${px(2.5)}" height="${px(5)}" fill="#e3eff2" stroke="#1e5e6f" stroke-width="1.8"/>
    <text x="${px(33.25)}" y="${px(39.7)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#1e5e6f">PWD 1</text>
    <rect x="${px(34.5)}" y="${px(37)}" width="${px(1.5)}" height="${px(5)}" fill="url(#staffHatch)" stroke="#1e5e6f" stroke-width="1.2"/>
    <rect x="${px(36)}" y="${px(37)}" width="${px(2.5)}" height="${px(5)}" fill="#e3eff2" stroke="#1e5e6f" stroke-width="1.8"/>
    <text x="${px(37.25)}" y="${px(39.7)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#1e5e6f">PWD 2</text>
    <g>
      <rect x="${px(43)}" y="${px(37)}" width="${px(4.5)}" height="${px(11.5)}" fill="#f8e8e6" stroke="#b42b1d" stroke-width="2.2" stroke-dasharray="8,4"/>
      <text x="${px(45.25)}" y="${px(42.5)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#b42b1d">FIRE TRUCK 1</text>
      <text x="${px(45.25)}" y="${px(44)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="#b42b1d">4.5 × 12.0 m</text>
      <rect x="${px(47.5)}" y="${px(37)}" width="${px(4.5)}" height="${px(11.5)}" fill="#f8e8e6" stroke="#b42b1d" stroke-width="2.2" stroke-dasharray="8,4"/>
      <text x="${px(49.75)}" y="${px(42.5)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#b42b1d">FIRE TRUCK 2</text>
      <text x="${px(49.75)}" y="${px(44)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" fill="#b42b1d">4.5 × 12.0 m</text>
    </g>
    <rect x="${px(4)}" y="${px(29.2)}" width="${px(40)}" height="${px(1.8)}" fill="#f0eadc" stroke="#7d7565" stroke-width="1.5"/>
    <rect x="${px(18)}" y="${px(25)}" width="${px(12)}" height="${px(3)}" fill="#f5efe2" stroke="#2f3a36" stroke-width="2"/>
    <text x="${px(22)}" y="${px(26.8)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="600" fill="#2f3a36">ENTRANCE PLAZA (+0.60 m)</text>
    <g fill="#ede4d1" stroke="#4a4337" stroke-width="1.2">
      <rect x="${px(24)}" y="${px(28)}" width="${px(4)}" height="${px(1.2)}"/>
      <line x1="${px(24)}" y1="${px(28.3)}" x2="${px(28)}" y2="${px(28.3)}"/>
      <line x1="${px(24)}" y1="${px(28.6)}" x2="${px(28)}" y2="${px(28.6)}"/>
      <line x1="${px(24)}" y1="${px(28.9)}" x2="${px(28)}" y2="${px(28.9)}"/>
    </g>
    <text x="${px(22.2)}" y="${px(28.9)}" text-anchor="end" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#5a4522">STEPS (4×0.15 m)</text>
    <rect x="${px(30)}" y="${px(25.8)}" width="${px(7.5)}" height="${px(1.6)}" fill="#e1f0ec" stroke="#1c5a49" stroke-width="1.8"/>
    <line x1="${px(37)}" y1="${px(26.6)}" x2="${px(30.6)}" y2="${px(26.6)}" stroke="#1c5a49" stroke-width="1.5"/>
    <text x="${px(33.75)}" y="${px(27.0)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#1c5a49">RAMP 7.5 m · 1:12</text>
    <g fill="#ede4d1" stroke="#4a4337" stroke-width="1.2">
      <rect x="${px(24.5)}" y="${px(16)}" width="${px(3)}" height="${px(1.4)}"/>
      <line x1="${px(24.5)}" y1="${px(16.45)}" x2="${px(27.5)}" y2="${px(16.45)}"/>
      <line x1="${px(24.5)}" y1="${px(16.9)}" x2="${px(27.5)}" y2="${px(16.9)}"/>
    </g>
    <text x="${px(26)}" y="${px(18.2)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#5a4522">STEPS (3×0.15 m)</text>
    <rect x="${px(31.6)}" y="${px(16)}" width="${px(1.8)}" height="${px(5.4)}" fill="#e1f0ec" stroke="#1c5a49" stroke-width="1.8"/>
    <text x="${px(32.5)}" y="${px(19.0)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#1c5a49">RAMP 1:12</text>
    <line x1="${px(34)}" y1="${px(16)}" x2="${px(34)}" y2="${px(25)}" stroke="#2a7b88" stroke-width="5"/>
    <line x1="${px(34)}" y1="${px(16)}" x2="${px(34)}" y2="${px(25)}" stroke="#d9f2f7" stroke-width="2" stroke-dasharray="8,4"/>
    <text x="${px(34.4)}" y="${px(17.4)}" font-family="system-ui, sans-serif" font-size="9.5" font-weight="700" fill="#2a7b88">GLASS WALL &amp; DOOR</text>
    <rect x="${px(19.2)}" y="${px(22.2)}" width="${px(3.6)}" height="${px(1.4)}" rx="4" fill="#dfd5c0" stroke="#5a4522" stroke-width="1.5"/>
    <rect x="${px(19.4)}" y="${px(17.6)}" width="${px(3.2)}" height="${px(1.6)}" rx="3" fill="#e6decb" stroke="#6c6252" stroke-width="1.2"/>
    <rect x="${px(37.2)}" y="${px(18.5)}" width="${px(2.0)}" height="${px(4.5)}" rx="2" fill="#d9eef2" stroke="#2a7b88" stroke-width="1.2"/>
  ` : '';

  const floor1Extras = floor === 1 ? `
    <g fill="#e6decb" stroke="#7b6f5a" stroke-width="1">
      ${Array.from({ length: 5 }, (_, i) => `<rect x="${px(21 + i * 4.2)}" y="${px(5.2)}" width="${px(2.8)}" height="${px(1.1)}"/>`).join('')}
      ${Array.from({ length: 3 }, (_, i) => `<rect x="${px(22 + i * 6.5)}" y="${px(7.6)}" width="${px(3.6)}" height="${px(1.8)}" rx="2"/>`).join('')}
      <rect x="${px(7)}" y="${px(19.5)}" width="${px(4)}" height="${px(2)}"/>
      <rect x="${px(15)}" y="${px(19.5)}" width="${px(4)}" height="${px(2)}"/>
      <rect x="${px(27)}" y="${px(19.5)}" width="${px(4)}" height="${px(2)}"/>
      <rect x="${px(35)}" y="${px(19.5)}" width="${px(4)}" height="${px(2)}"/>
    </g>
  ` : '';

  const floor2Extras = floor === 2 ? `
    <g fill="#e6decb" stroke="#7b6f5a" stroke-width="1">
      <rect x="${px(21)}" y="${px(5.5)}" width="${px(8.5)}" height="${px(3.2)}" rx="2"/>
      <rect x="${px(33.5)}" y="${px(5.5)}" width="${px(8.5)}" height="${px(3.2)}" rx="2"/>
      <rect x="${px(7)}" y="${px(19.2)}" width="${px(14)}" height="${px(3.8)}" rx="2"/>
      <rect x="${px(27)}" y="${px(19.2)}" width="${px(14)}" height="${px(3.8)}" rx="2"/>
    </g>
  ` : '';

  const doorsSvg = rooms.map(renderDoorOpening).join('');
  const dimsSvg = dims.map(renderDimLine).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PLAN_WIDTH} ${PLAN_HEIGHT}" width="${PLAN_WIDTH}" height="${PLAN_HEIGHT}">`
    + `<defs><pattern id="staffHatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#ece8df"/><line x1="0" y1="0" x2="0" y2="12" stroke="#c8c0b0" stroke-width="3"/></pattern></defs>`
    + `<rect width="${PLAN_WIDTH}" height="${PLAN_HEIGHT}" fill="#f6f1e6"/>`
    + `<g>${grid.join('')}</g>`
    + `<rect x="${px(4)}" y="${px(3)}" width="${px(40)}" height="${px(22)}" fill="#fbf8f1" stroke="#1e352f" stroke-width="5"/>`
    + `<rect x="${px(4.2)}" y="${px(13)}" width="${px(39.6)}" height="${px(3)}" fill="#f3ecdc" stroke="none"/>`
    + roomSvg
    + coreDetails
    + floor0Extras
    + floor1Extras
    + floor2Extras
    + doorsSvg
    + dimsSvg
    + `<g transform="translate(${px(53)}, ${px(4.5)})"><circle cx="0" cy="0" r="22" fill="#fbf8f1" stroke="#1e352f" stroke-width="1.6"/><polygon points="0,-16 -6,6 0,2 6,6" fill="#1e352f"/><text x="0" y="17" text-anchor="middle" font-family="Georgia, serif" font-size="10" font-weight="700" fill="#1e352f">N</text></g>`
    + `<g transform="translate(${px(48)}, ${px(9)})"><rect x="0" y="0" width="${px(10)}" height="8" fill="#1e352f"/><rect x="${px(5)}" y="0" width="${px(5)}" height="8" fill="#fbf8f1" stroke="#1e352f" stroke-width="1.2"/><text x="0" y="21" font-family="system-ui, sans-serif" font-size="10.5" font-weight="700" fill="#1e352f">0</text><text x="${px(5)}" y="21" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="700" fill="#1e352f">5 m</text><text x="${px(10)}" y="21" text-anchor="end" font-family="system-ui, sans-serif" font-size="10.5" font-weight="700" fill="#1e352f">10 m</text></g>`
    + `</svg>`;
}

export function floorSvgDataUrl(floor: FloorId): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(renderFloorSvg(floor))}`;
}
