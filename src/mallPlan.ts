import type { Edge, FloorId, HotelGraph, MapNode, PathKind } from './types';
import type { Building, BuildingFloor } from './buildings';

export const MALL_SCALE = 20; // 20 px per meter
export const MALL_SHEET_W = 80; // 80 meters width
export const MALL_SHEET_H = 60; // 60 meters height
export const MALL_PLAN_WIDTH = MALL_SHEET_W * MALL_SCALE; // 1600 px
export const MALL_PLAN_HEIGHT = MALL_SHEET_H * MALL_SCALE; // 1200 px
export const MALL_METERS_PER_PIXEL = 1 / MALL_SCALE; // 0.05 m/px

export const mpx = (meters: number) => Math.round(meters * MALL_SCALE);

export interface MallRoom {
  id: string;
  floor: FloorId;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category: MapNode['category'];
  door?: { x: number; y: number; width: number; wall: 'north' | 'south' | 'east' | 'west'; label?: string };
}

// ----------------------------------------------------------------------------
// ROOM DEFINITIONS ACROSS 3 FLOORS
// ----------------------------------------------------------------------------
export const mallRooms: MallRoom[] = [
  // ==================== LEVEL 1: GROUND FLOOR ====================
  // Anchors
  {
    id: 'supermarket', floor: 0, name: 'Anchor Supermarket & Hypermarket',
    subtitle: '440 m² · Groceries, Fresh Produce & PWD Priority Lane',
    x: 52, y: 8, w: 22, h: 18, category: 'shop',
    door: { x: 52, y: 17, width: 3.0, wall: 'west', label: '3.0m Grand Entry' },
  },
  {
    id: 'dept-store-1', floor: 0, name: 'Anchor Department Store L1',
    subtitle: '396 m² · Fashion, Beauty & Homeware',
    x: 6, y: 8, w: 22, h: 18, category: 'shop',
    door: { x: 28, y: 17, width: 3.0, wall: 'east', label: '3.0m Portal' },
  },
  // North-West Retail Stalls
  { id: 'pharmacy', floor: 0, name: 'Pharmacy & Drugstore', subtitle: 'BP 344 Low Counter (0.80m)', x: 6, y: 36, w: 6, h: 8, category: 'shop', door: { x: 9, y: 36, width: 1.2, wall: 'north' } },
  { id: 'optical', floor: 0, name: 'Optical & Eyewear Clinic', subtitle: 'Eye Exams & Care', x: 12, y: 36, w: 5, h: 8, category: 'shop', door: { x: 14.5, y: 36, width: 1.2, wall: 'north' } },
  { id: 'jewelry', floor: 0, name: 'Jewelry & Timepieces', subtitle: 'Luxury Watches & Gold', x: 17, y: 36, w: 5, h: 8, category: 'shop', door: { x: 19.5, y: 36, width: 1.2, wall: 'north' } },
  { id: 'cosmetics', floor: 0, name: 'Cosmetics Boutique', subtitle: 'Skincare & Fragrance', x: 22, y: 36, w: 6, h: 8, category: 'shop', door: { x: 25, y: 36, width: 1.2, wall: 'north' } },
  // South-West Retail Stalls
  { id: 'bank-atm', floor: 0, name: 'Bank Branch & 24/7 ATM', subtitle: 'Accessible Teller & Audio ATM', x: 6, y: 46, w: 7, h: 6, category: 'shop', door: { x: 9.5, y: 46, width: 1.2, wall: 'north' } },
  { id: 'fashion-unit', floor: 0, name: 'Fast Fashion Boutique', subtitle: 'Casual Wear', x: 13, y: 46, w: 7, h: 6, category: 'shop', door: { x: 16.5, y: 46, width: 1.2, wall: 'north' } },
  { id: 'footwear', floor: 0, name: 'Footwear & Leather Goods', subtitle: 'Shoes & Bags', x: 20, y: 46, w: 8, h: 6, category: 'shop', door: { x: 24, y: 46, width: 1.2, wall: 'north' } },
  // North-East Retail Stalls
  { id: 'bookstore', floor: 0, name: 'Bookstore & Paper', subtitle: 'Books, Art & Stationery', x: 52, y: 36, w: 7, h: 8, category: 'shop', door: { x: 55.5, y: 36, width: 1.2, wall: 'north' } },
  { id: 'gourmet-deli', floor: 0, name: 'Gourmet Delicatessen', subtitle: 'Specialty Artisan Food', x: 59, y: 36, w: 7, h: 8, category: 'dining', door: { x: 62.5, y: 36, width: 1.2, wall: 'north' } },
  { id: 'electronics-hub', floor: 0, name: 'Electronics Center', subtitle: 'Audio, Gadgets & Tech', x: 66, y: 36, w: 8, h: 8, category: 'shop', door: { x: 70, y: 36, width: 1.2, wall: 'north' } },
  // South-East Retail Stalls
  { id: 'convenience-mart', floor: 0, name: 'Convenience Mart 24/7', subtitle: 'Snacks & Essentials', x: 52, y: 46, w: 7, h: 6, category: 'shop', door: { x: 55.5, y: 46, width: 1.2, wall: 'north' } },
  { id: 'luggage-travel', floor: 0, name: 'Luggage & Travel Gear', subtitle: 'Suitcases & Bags', x: 59, y: 46, w: 7, h: 6, category: 'shop', door: { x: 62.5, y: 46, width: 1.2, wall: 'north' } },
  { id: 'homeware-gifts', floor: 0, name: 'Homeware & Living', subtitle: 'Decor & Gifts', x: 66, y: 46, w: 8, h: 6, category: 'shop', door: { x: 70, y: 46, width: 1.2, wall: 'north' } },
  // Atrium Kiosks & Concierge
  { id: 'concierge', floor: 0, name: 'Customer Concierge & PWD Desk', subtitle: '0.80m Accessible Counter · Wheelchair Rental', x: 37, y: 34, w: 6, h: 3, category: 'reception' },
  { id: 'kiosk-coffee', floor: 0, name: 'Artisan Coffee Kiosk', subtitle: 'Beverages & Pastries', x: 32, y: 24, w: 3.5, h: 3.5, category: 'dining' },
  { id: 'kiosk-gadgets', floor: 0, name: 'Mobile Tech Kiosk', subtitle: 'Accessories & Repair', x: 32, y: 33, w: 3.5, h: 3.5, category: 'shop' },
  { id: 'kiosk-bakery', floor: 0, name: 'Fresh Bakery Kiosk', subtitle: 'Bread & Desserts', x: 44.5, y: 24, w: 3.5, h: 3.5, category: 'dining' },
  { id: 'kiosk-eyewear', floor: 0, name: 'Eyewear Express Kiosk', subtitle: 'Frames & Care', x: 44.5, y: 33, w: 3.5, h: 3.5, category: 'shop' },
  // Restrooms
  { id: 'f0-pwd-west', floor: 0, name: 'West PWD Restroom', subtitle: 'BP 344 · 2.5m x 2.5m · 1.5m Turn Circle', x: 18, y: 28, w: 3.5, h: 3.5, category: 'restroom', door: { x: 18, y: 30, width: 0.9, wall: 'west' } },
  { id: 'f0-pwd-east', floor: 0, name: 'East PWD Restroom', subtitle: 'BP 344 · 2.5m x 2.5m · 1.5m Turn Circle', x: 58, y: 28, w: 3.5, h: 3.5, category: 'restroom', door: { x: 61.5, y: 30, width: 0.9, wall: 'east' } },

  // ==================== LEVEL 2: SECOND FLOOR ====================
  // Anchors & Cyberzone
  {
    id: 'dept-store-2', floor: 1, name: 'Anchor Department Store L2',
    subtitle: '396 m² · Ladies & Men’s Fashion & Home Decor',
    x: 6, y: 8, w: 22, h: 18, category: 'shop',
    door: { x: 28, y: 17, width: 3.0, wall: 'east', label: '3.0m Portal' },
  },
  { id: 'flagship-pc', floor: 1, name: 'Flagship Computers & Laptops', subtitle: '132 m² · Authorized Tech Hub', x: 52, y: 8, w: 11, h: 12, category: 'shop', door: { x: 52, y: 14, width: 2.0, wall: 'west' } },
  { id: 'flagship-mobile', floor: 1, name: 'Smartphones & Smart Devices', subtitle: '132 m² · Flagship Store', x: 63, y: 8, w: 11, h: 12, category: 'shop', door: { x: 63, y: 14, width: 2.0, wall: 'west' } },
  { id: 'esports-arena', floor: 1, name: 'Esports & Gaming Lounge', subtitle: '100 m² · VR & Gaming Gear', x: 52, y: 20, w: 10, h: 6, category: 'shop', door: { x: 57, y: 20, width: 1.5, wall: 'north' } },
  { id: 'audio-boutique', floor: 1, name: 'Audio & Hi-Fi Studio', subtitle: '60 m² · Headphones & Speakers', x: 62, y: 20, w: 6, h: 6, category: 'shop', door: { x: 65, y: 20, width: 1.2, wall: 'north' } },
  { id: 'camera-lab', floor: 1, name: 'Camera & Drone Lab', subtitle: '60 m² · Imaging & Drones', x: 68, y: 20, w: 6, h: 6, category: 'shop', door: { x: 71, y: 20, width: 1.2, wall: 'north' } },
  // Fashion & Specialty Stalls L2
  { id: 'sporting-goods', floor: 1, name: 'Sporting Goods & Athleisure', subtitle: 'Sports Equipment & Shoes', x: 6, y: 36, w: 8, h: 8, category: 'shop', door: { x: 10, y: 36, width: 1.2, wall: 'north' } },
  { id: 'denim-studio', floor: 1, name: 'Denim & Casual Studio', subtitle: 'Jeans & Jackets', x: 14, y: 36, w: 7, h: 8, category: 'shop', door: { x: 17.5, y: 36, width: 1.2, wall: 'north' } },
  { id: 'kids-boutique', floor: 1, name: 'Kids Apparel & Toys', subtitle: 'Children’s Boutique', x: 21, y: 36, w: 7, h: 8, category: 'shop', door: { x: 24.5, y: 36, width: 1.2, wall: 'north' } },
  { id: 'lingerie-studio', floor: 1, name: 'Lingerie Studio', subtitle: 'Intimate Apparel', x: 6, y: 46, w: 6, h: 6, category: 'shop', door: { x: 9, y: 46, width: 1.2, wall: 'north' } },
  { id: 'sneaker-vault', floor: 1, name: 'Sneaker Vault', subtitle: 'Collector Kicks & Shoes', x: 12, y: 46, w: 6, h: 6, category: 'shop', door: { x: 15, y: 46, width: 1.2, wall: 'north' } },
  { id: 'beauty-spa', floor: 1, name: 'Beauty Salon & Day Spa', subtitle: 'Hair, Nails & Esthetics', x: 18, y: 46, w: 10, h: 6, category: 'shop', door: { x: 23, y: 46, width: 1.5, wall: 'north' } },
  // East Lower Specialty L2
  { id: 'dental-clinic', floor: 1, name: 'Dental & Health Clinic', subtitle: 'Accessible Health Suite', x: 52, y: 36, w: 7, h: 8, category: 'shop', door: { x: 55.5, y: 36, width: 1.2, wall: 'north' } },
  { id: 'home-furnish', floor: 1, name: 'Home Furnishings Studio', subtitle: 'Interior Design & Lighting', x: 59, y: 36, w: 7, h: 8, category: 'shop', door: { x: 62.5, y: 36, width: 1.2, wall: 'north' } },
  { id: 'music-vinyl', floor: 1, name: 'Music & Vinyl Emporium', subtitle: 'Guitars, Audio & Records', x: 66, y: 36, w: 8, h: 8, category: 'shop', door: { x: 70, y: 36, width: 1.2, wall: 'north' } },
  { id: 'craft-hub', floor: 1, name: 'Art & Craft Hub', subtitle: 'Stationery & Paints', x: 52, y: 46, w: 7, h: 6, category: 'shop', door: { x: 55.5, y: 46, width: 1.2, wall: 'north' } },
  { id: 'japanese-novelty', floor: 1, name: 'Japanese Novelty Stalls', subtitle: 'Anime & Gifts', x: 59, y: 46, w: 7, h: 6, category: 'shop', door: { x: 62.5, y: 46, width: 1.2, wall: 'north' } },
  { id: 'organic-tea', floor: 1, name: 'Organic Tea & Herbology', subtitle: 'Specialty Teas & Honey', x: 66, y: 46, w: 8, h: 6, category: 'dining', door: { x: 70, y: 46, width: 1.2, wall: 'north' } },
  // Restrooms L2
  { id: 'f1-pwd-west', floor: 1, name: 'West PWD Restroom', subtitle: 'BP 344 · 2.5m x 2.5m · 1.5m Turn Circle', x: 18, y: 28, w: 3.5, h: 3.5, category: 'restroom', door: { x: 18, y: 30, width: 0.9, wall: 'west' } },
  { id: 'f1-pwd-east', floor: 1, name: 'East PWD Restroom', subtitle: 'BP 344 · 2.5m x 2.5m · 1.5m Turn Circle', x: 58, y: 28, w: 3.5, h: 3.5, category: 'restroom', door: { x: 61.5, y: 30, width: 0.9, wall: 'east' } },

  // ==================== LEVEL 3: THIRD FLOOR ====================
  // Cinema Complex
  {
    id: 'cinema-1', floor: 2, name: 'Cinema 1: Digital Surround',
    subtitle: '180 Seats · 4 BP 344 Wheelchair Bays · Curved Screen',
    x: 52, y: 8, w: 11, h: 18, category: 'conference',
    door: { x: 57.5, y: 26, width: 2.0, wall: 'south', label: 'Sound Lock Entry' },
  },
  {
    id: 'cinema-2', floor: 2, name: 'Cinema 2: Dolby Atmos',
    subtitle: '180 Seats · 4 BP 344 Wheelchair Bays · Laser Projection',
    x: 63, y: 8, w: 11, h: 18, category: 'conference',
    door: { x: 68.5, y: 26, width: 2.0, wall: 'south', label: 'Sound Lock Entry' },
  },
  { id: 'box-office', floor: 2, name: 'Cinema Box Office', subtitle: 'Ticketing & BP 344 Accessible Window', x: 53, y: 26.5, w: 4, h: 3.5, category: 'reception' },
  { id: 'concessions', floor: 2, name: 'Cinema Concessions & Snacks', subtitle: 'Popcorn, Drinks & Candies', x: 59, y: 26.5, w: 14, h: 3.5, category: 'dining' },

  // Gourmet Food Hall Stalls
  { id: 'food-asian', floor: 2, name: 'Food Stall: Asian Wok Express', subtitle: 'Stir Fry & Dimsum', x: 6, y: 8, w: 6, h: 5, category: 'dining', door: { x: 11, y: 10, width: 1.2, wall: 'east' } },
  { id: 'food-grill', floor: 2, name: 'Food Stall: Sizzling Steak & Grill', subtitle: 'Steaks & BBQ', x: 6, y: 13, w: 6, h: 5, category: 'dining', door: { x: 11, y: 15, width: 1.2, wall: 'east' } },
  { id: 'food-ramen', floor: 2, name: 'Food Stall: Artisan Ramen Lab', subtitle: 'Noodles & Gyoza', x: 6, y: 18, w: 6, h: 5, category: 'dining', door: { x: 11, y: 20, width: 1.2, wall: 'east' } },
  { id: 'food-pizza', floor: 2, name: 'Food Stall: Woodfired Pizza & Pasta', subtitle: 'Italian Fare', x: 6, y: 23, w: 6, h: 5, category: 'dining', door: { x: 11, y: 25, width: 1.2, wall: 'east' } },
  { id: 'food-mexican', floor: 2, name: 'Food Stall: Mexican Cantina', subtitle: 'Tacos & Burritos', x: 22, y: 8, w: 6, h: 5, category: 'dining', door: { x: 23, y: 10, width: 1.2, wall: 'west' } },
  { id: 'food-filipino', floor: 2, name: 'Food Stall: Filipino Heritage Flavors', subtitle: 'Kare-Kare & Inasal', x: 22, y: 13, w: 6, h: 5, category: 'dining', door: { x: 23, y: 15, width: 1.2, wall: 'west' } },
  { id: 'food-juice', floor: 2, name: 'Food Stall: Fresh Juice & Smoothie Bar', subtitle: 'Fruit Shakes', x: 22, y: 18, w: 6, h: 5, category: 'dining', door: { x: 23, y: 20, width: 1.2, wall: 'west' } },
  { id: 'food-dessert', floor: 2, name: 'Food Stall: Gourmet Crepes & Gelato', subtitle: 'Desserts', x: 22, y: 23, w: 6, h: 5, category: 'dining', door: { x: 23, y: 25, width: 1.2, wall: 'west' } },
  { id: 'food-seating', floor: 2, name: 'Food Hall Dining Concourse', subtitle: '150 Seats · BP 344 Wheelchair Tables (0.75m)', x: 12, y: 8, w: 10, h: 20, category: 'dining' },

  // Entertainment Zone L3
  { id: 'arcade-zone', floor: 2, name: 'Amusement Arcade & VR Zone', subtitle: '180 m² · Arcade Games, Simulators & VR', x: 6, y: 36, w: 12, h: 12, category: 'fitness', door: { x: 12, y: 36, width: 2.0, wall: 'north' } },
  { id: 'bowling-lounge', floor: 2, name: 'Billiards & Bowling Lounge', subtitle: '144 m² · 4 Mini Bowling Lanes & 4 Pool Tables', x: 18, y: 36, w: 10, h: 12, category: 'fitness', door: { x: 23, y: 36, width: 2.0, wall: 'north' } },

  // Mall Admin, Security & Clinic L3
  { id: 'admin-hq', floor: 2, name: 'Mall Administration HQ', subtitle: 'Operations, Finance & Leasing Offices', x: 52, y: 36, w: 11, h: 7, category: 'office', door: { x: 57.5, y: 36, width: 1.5, wall: 'north' } },
  { id: 'security-command', floor: 2, name: 'Security & CCTV Command Center', subtitle: '24/7 Monitoring & Dispatch', x: 63, y: 36, w: 11, h: 7, category: 'office', door: { x: 68.5, y: 36, width: 1.5, wall: 'north' } },
  { id: 'clinic-firstaid', floor: 2, name: 'Emergency First Aid & Medical Clinic', subtitle: 'BP 344 Accessible Clinic · Doctor On Duty', x: 52, y: 44, w: 11, h: 8, category: 'office', door: { x: 57.5, y: 44, width: 1.2, wall: 'north' } },
  { id: 'staff-lockers', floor: 2, name: 'Staff Lockers & Facilities', subtitle: 'Rest & Storage Area', x: 63, y: 44, w: 11, h: 8, category: 'office', door: { x: 68.5, y: 44, width: 1.2, wall: 'north' } },

  // Restrooms L3
  { id: 'f2-pwd-west', floor: 2, name: 'West PWD Restroom', subtitle: 'BP 344 · 2.5m x 2.5m · 1.5m Turn Circle', x: 18, y: 28, w: 3.5, h: 3.5, category: 'restroom', door: { x: 18, y: 30, width: 0.9, wall: 'west' } },
  { id: 'f2-pwd-east', floor: 2, name: 'East PWD Restroom', subtitle: 'BP 344 · 2.5m x 2.5m · 1.5m Turn Circle', x: 58, y: 28, w: 3.5, h: 3.5, category: 'restroom', door: { x: 61.5, y: 30, width: 0.9, wall: 'east' } },
];

// ----------------------------------------------------------------------------
// GRAPH NODES & EDGES (DIJKSTRA MULTI-FLOOR ROUTING)
// ----------------------------------------------------------------------------
export const mallNodes: MapNode[] = [];
export const mallEdges: Edge[] = [];
const mallNodeMap: Record<string, MapNode> = {};

const mn = (
  id: string,
  label: string,
  floor: FloorId,
  xm: number,
  ym: number,
  category: MapNode['category'] = 'facility',
  doorMeters?: [number, number],
) => {
  const node: MapNode = {
    id,
    name: label,
    floor,
    x: mpx(xm),
    y: mpx(ym),
    category,
    facility: category !== 'facility' || label.includes('Entrance') || label.includes('Plaza') || label.includes('Parking'),
    labelX: doorMeters ? mpx(doorMeters[0]) : undefined,
    labelY: doorMeters ? mpx(doorMeters[1]) : undefined,
  };
  mallNodes.push(node);
  mallNodeMap[id] = node;
};

const me = (
  from: string, to: string,
  kind: PathKind = 'corridor',
  accessible = true,
  overrideDistance?: number,
  viaMeters?: [number, number][],
  traversable = true,
) => {
  const via = viaMeters?.map(([vx, vy]) => [mpx(vx), mpx(vy)] as [number, number]);
  const pts: [number, number][] = [[mallNodeMap[from].x, mallNodeMap[from].y], ...(via ?? []), [mallNodeMap[to].x, mallNodeMap[to].y]];
  let pxLen = 0;
  for (let i = 1; i < pts.length; i++) pxLen += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const distance = overrideDistance ?? Math.round(pxLen * MALL_METERS_PER_PIXEL * 100) / 100;
  mallEdges.push({ id: `${from}--${to}`, from, to, distance, kind, accessible, traversable, via });
};

// 1. Core vertical circulation on every floor
for (const fl of [0, 1, 2] as const) {
  // Scenic Lift
  mn(`lift-scenic-${fl}`, 'Scenic Glass Elevator', fl, 46, 30, 'elevator', [46, 28]);
  mn(`f${fl}-scenic-j`, 'Scenic lift landing', fl, 44, 30);
  me(`lift-scenic-${fl}`, `f${fl}-scenic-j`);

  // Escalators
  mn(`escalator-${fl}`, 'Criss-Cross Escalator Bank', fl, 40, 28, 'stairs', [40, 26]);
  mn(`f${fl}-escala-j`, 'Escalator landing', fl, 40, 31);
  me(`escalator-${fl}`, `f${fl}-escala-j`);

  // West Core
  mn(`lift-west-${fl}`, 'West Passenger Elevator', fl, 8.5, 28, 'elevator', [8.5, 26]);
  mn(`stairs-west-${fl}`, 'West Fire Stairwell', fl, 12.5, 28, 'stairs', [12.5, 26]);
  mn(`ramp-west-${fl}`, 'West Accessible Ramp', fl, 8.5, 32, 'facility', [8.5, 34]);
  mn(`f${fl}-west-core-j`, 'West circulation foyer', fl, 11, 30);
  me(`lift-west-${fl}`, `f${fl}-west-core-j`);
  me(`stairs-west-${fl}`, `f${fl}-west-core-j`);
  me(`ramp-west-${fl}`, `f${fl}-west-core-j`, 'ramp', true);

  // East Core
  mn(`lift-east-${fl}`, 'East Service & Passenger Lift', fl, 71.5, 28, 'elevator', [71.5, 26]);
  mn(`stairs-east-${fl}`, 'East Fire Stairwell', fl, 67.5, 28, 'stairs', [67.5, 26]);
  mn(`ramp-east-${fl}`, 'East Accessible Ramp', fl, 71.5, 32, 'facility', [71.5, 34]);
  mn(`f${fl}-east-core-j`, 'East circulation foyer', fl, 69, 30);
  me(`lift-east-${fl}`, `f${fl}-east-core-j`);
  me(`stairs-east-${fl}`, `f${fl}-east-core-j`);
  me(`ramp-east-${fl}`, `f${fl}-east-core-j`, 'ramp', true);

  // Inter-floor linkages
  if (fl > 0) {
    const prev = (fl - 1) as FloorId;
    me(`lift-scenic-${prev}`, `lift-scenic-${fl}`, 'elevator', true, 6.0);
    me(`lift-west-${prev}`, `lift-west-${fl}`, 'elevator', true, 6.0);
    me(`lift-east-${prev}`, `lift-east-${fl}`, 'elevator', true, 6.0);
    me(`escalator-${prev}`, `escalator-${fl}`, 'stairs', false, 7.5);
    me(`stairs-west-${prev}`, `stairs-west-${fl}`, 'stairs', false, 8.0);
    me(`stairs-east-${prev}`, `stairs-east-${fl}`, 'stairs', false, 8.0);
  }

  // Cross-concourse spinal connections
  mn(`f${fl}-atrium-center-j`, 'Grand Atrium concourse', fl, 40, 30);
  mn(`f${fl}-spine-west-j`, 'West concourse junction', fl, 28, 30);
  mn(`f${fl}-spine-east-j`, 'East concourse junction', fl, 52, 30);

  me(`f${fl}-atrium-center-j`, `f${fl}-escala-j`);
  me(`f${fl}-atrium-center-j`, `f${fl}-scenic-j`);
  me(`f${fl}-atrium-center-j`, `f${fl}-spine-west-j`);
  me(`f${fl}-atrium-center-j`, `f${fl}-spine-east-j`);
  me(`f${fl}-spine-west-j`, `f${fl}-west-core-j`);
  me(`f${fl}-spine-east-j`, `f${fl}-east-core-j`);

  // Secondary North and South main shopping aisles
  mn(`f${fl}-north-aisle-w`, 'North-west shopping aisle', fl, 28, 20);
  mn(`f${fl}-north-aisle-e`, 'North-east shopping aisle', fl, 52, 20);
  mn(`f${fl}-south-aisle-w`, 'South-west shopping aisle', fl, 28, 42);
  mn(`f${fl}-south-aisle-e`, 'South-east shopping aisle', fl, 52, 42);

  me(`f${fl}-spine-west-j`, `f${fl}-north-aisle-w`);
  me(`f${fl}-spine-west-j`, `f${fl}-south-aisle-w`);
  me(`f${fl}-spine-east-j`, `f${fl}-north-aisle-e`);
  me(`f${fl}-spine-east-j`, `f${fl}-south-aisle-e`);

  // PWD Restrooms per floor
  mn(`pwd-toilet-west-${fl}`, 'West PWD Restroom', fl, 18, 30, 'restroom');
  mn(`pwd-toilet-east-${fl}`, 'East PWD Restroom', fl, 61.5, 30, 'restroom');
  me(`f${fl}-west-core-j`, `pwd-toilet-west-${fl}`);
  me(`f${fl}-east-core-j`, `pwd-toilet-east-${fl}`);
}

// ---------------- LEVEL 1 (GROUND FLOOR) SPECIFIC NODES & CONNECTIONS ----------------
mn('main-entrance-north', 'North Main Plaza Entrance', 0, 40, 6, 'entrance', [40, 4]);
mn('entrance-south', 'South Plaza Promenade Entrance', 0, 40, 54, 'entrance', [40, 56]);
mn('entrance-west', 'West Garden Entrance', 0, 4, 30, 'entrance', [2, 30]);
mn('entrance-east', 'East Transit Hub Entrance', 0, 76, 30, 'entrance', [78, 30]);

mn('north-steps-j', 'North entrance steps', 0, 42, 4);
mn('north-ramp-top', 'North accessible ramp top', 0, 37, 6);
mn('north-ramp-bot', 'North accessible ramp foot', 0, 34, 2);
mn('north-plaza-walkway', 'North exterior plaza walkway', 0, 40, 2);

mn('pwd-parking-1', 'Accessible Parking Bay 1 (PWD)', 0, 20, 56, 'parking');
mn('pwd-parking-2', 'Accessible Parking Bay 2 (PWD)', 0, 24, 56, 'parking');
mn('pwd-loading-zone', 'PWD Passenger Drop-off Zone', 0, 78, 30, 'parking');

me('north-plaza-walkway', 'north-steps-j', 'stairs', false);
me('north-steps-j', 'main-entrance-north', 'stairs', false);
me('north-plaza-walkway', 'north-ramp-bot');
me('north-ramp-bot', 'north-ramp-top', 'ramp', true, 5.0);
me('north-ramp-top', 'main-entrance-north');
me('main-entrance-north', 'f0-atrium-center-j');

me('pwd-parking-1', 'entrance-south');
me('pwd-parking-2', 'entrance-south');
me('entrance-south', 'f0-atrium-center-j');

me('entrance-west', 'f0-west-core-j');
me('pwd-loading-zone', 'entrance-east');
me('entrance-east', 'f0-east-core-j');

// Ground floor facilities
mn('supermarket-node', 'Anchor Supermarket & Hypermarket', 0, 52, 17, 'shop');
mn('dept-store-1-node', 'Anchor Department Store L1', 0, 28, 17, 'shop');
mn('concierge-node', 'Customer Concierge & PWD Desk', 0, 40, 34, 'reception');
mn('pharmacy-node', 'Pharmacy & Drugstore', 0, 9, 36, 'shop');
mn('optical-node', 'Optical & Eyewear Clinic', 0, 14.5, 36, 'shop');
mn('jewelry-node', 'Jewelry & Luxury Timepieces', 0, 19.5, 36, 'shop');
mn('cosmetics-node', 'Cosmetics Boutique', 0, 25, 36, 'shop');
mn('bank-node', 'Bank Branch & ATM Hub', 0, 9.5, 46, 'shop');
mn('fashion-node', 'Fast Fashion Boutique', 0, 16.5, 46, 'shop');
mn('footwear-node', 'Footwear & Leather Goods', 0, 24, 46, 'shop');

mn('bookstore-node', 'Bookstore & Stationery', 0, 55.5, 36, 'shop');
mn('deli-node', 'Gourmet Delicatessen', 0, 62.5, 36, 'dining');
mn('electronics-node', 'Electronics Center', 0, 70, 36, 'shop');
mn('convenience-node', 'Convenience Mart 24/7', 0, 55.5, 46, 'shop');
mn('luggage-node', 'Luggage & Travel Gear', 0, 62.5, 46, 'shop');
mn('homeware-node', 'Homeware & Living', 0, 70, 46, 'shop');

mn('kiosk-coffee-node', 'Artisan Coffee Kiosk', 0, 34, 25, 'dining');
mn('kiosk-gadgets-node', 'Mobile Gadgets Kiosk', 0, 34, 33, 'shop');
mn('kiosk-bakery-node', 'Fresh Bakery Kiosk', 0, 44, 25, 'dining');
mn('kiosk-eyewear-node', 'Eyewear Express Kiosk', 0, 44, 33, 'shop');

me('f0-north-aisle-e', 'supermarket-node');
me('f0-north-aisle-w', 'dept-store-1-node');
me('f0-atrium-center-j', 'concierge-node');
me('f0-atrium-center-j', 'kiosk-coffee-node');
me('f0-atrium-center-j', 'kiosk-gadgets-node');
me('f0-atrium-center-j', 'kiosk-bakery-node');
me('f0-atrium-center-j', 'kiosk-eyewear-node');

me('f0-south-aisle-w', 'pharmacy-node');
me('f0-south-aisle-w', 'optical-node');
me('f0-south-aisle-w', 'jewelry-node');
me('f0-south-aisle-w', 'cosmetics-node');
me('f0-south-aisle-w', 'bank-node');
me('f0-south-aisle-w', 'fashion-node');
me('f0-south-aisle-w', 'footwear-node');

me('f0-south-aisle-e', 'bookstore-node');
me('f0-south-aisle-e', 'deli-node');
me('f0-south-aisle-e', 'electronics-node');
me('f0-south-aisle-e', 'convenience-node');
me('f0-south-aisle-e', 'luggage-node');
me('f0-south-aisle-e', 'homeware-node');

// ---------------- LEVEL 2 SPECIFIC NODES & CONNECTIONS ----------------
mn('dept-store-2-node', 'Anchor Department Store L2', 1, 28, 17, 'shop');
mn('flagship-pc-node', 'Flagship Computers & Laptops', 1, 52, 14, 'shop');
mn('flagship-mobile-node', 'Smartphones & Smart Devices', 1, 63, 14, 'shop');
mn('esports-node', 'Esports & Gaming Lounge', 1, 57, 20, 'shop');
mn('audio-node', 'Audio & Hi-Fi Studio', 1, 65, 20, 'shop');
mn('camera-node', 'Camera & Drone Lab', 1, 71, 20, 'shop');

mn('sporting-node', 'Sporting Goods & Athleisure', 1, 10, 36, 'shop');
mn('denim-node', 'Denim & Casual Studio', 1, 17.5, 36, 'shop');
mn('kids-node', 'Kids Apparel & Toys', 1, 24.5, 36, 'shop');
mn('lingerie-node', 'Lingerie Studio', 1, 9, 46, 'shop');
mn('sneakers-node', 'Sneaker Vault', 1, 15, 46, 'shop');
mn('spa-node', 'Beauty Salon & Day Spa', 1, 23, 46, 'shop');

mn('dental-node', 'Dental & Health Clinic', 1, 55.5, 36, 'shop');
mn('homefurnish-node', 'Home Furnishings Studio', 1, 62.5, 36, 'shop');
mn('musicvinyl-node', 'Music & Vinyl Emporium', 1, 70, 36, 'shop');
mn('crafthub-node', 'Art & Craft Hub', 1, 55.5, 46, 'shop');
mn('japanesenovelty-node', 'Japanese Novelty Stalls', 1, 62.5, 46, 'shop');
mn('organictea-node', 'Organic Tea & Herbology', 1, 70, 46, 'dining');

me('f1-north-aisle-w', 'dept-store-2-node');
me('f1-north-aisle-e', 'flagship-pc-node');
me('f1-north-aisle-e', 'flagship-mobile-node');
me('f1-north-aisle-e', 'esports-node');
me('f1-north-aisle-e', 'audio-node');
me('f1-north-aisle-e', 'camera-node');

me('f1-south-aisle-w', 'sporting-node');
me('f1-south-aisle-w', 'denim-node');
me('f1-south-aisle-w', 'kids-node');
me('f1-south-aisle-w', 'lingerie-node');
me('f1-south-aisle-w', 'sneakers-node');
me('f1-south-aisle-w', 'spa-node');

me('f1-south-aisle-e', 'dental-node');
me('f1-south-aisle-e', 'homefurnish-node');
me('f1-south-aisle-e', 'musicvinyl-node');
me('f1-south-aisle-e', 'crafthub-node');
me('f1-south-aisle-e', 'japanesenovelty-node');
me('f1-south-aisle-e', 'organictea-node');

// ---------------- LEVEL 3 SPECIFIC NODES & CONNECTIONS ----------------
mn('cinema-1-node', 'Cinema 1: Digital Surround', 2, 57.5, 24, 'conference');
mn('cinema-2-node', 'Cinema 2: Dolby Atmos', 2, 68.5, 24, 'conference');
mn('box-office-node', 'Cinema Box Office', 2, 55, 26, 'reception');
mn('concessions-node', 'Cinema Concessions & Snacks', 2, 62, 26, 'dining');

mn('food-asian-node', 'Food Stall: Asian Wok', 2, 11, 10, 'dining');
mn('food-grill-node', 'Food Stall: Sizzling Grill', 2, 11, 15, 'dining');
mn('food-ramen-node', 'Food Stall: Ramen Lab', 2, 11, 20, 'dining');
mn('food-pizza-node', 'Food Stall: Pizza & Pasta', 2, 11, 25, 'dining');
mn('food-mexican-node', 'Food Stall: Mexican Cantina', 2, 23, 10, 'dining');
mn('food-filipino-node', 'Food Stall: Filipino Heritage', 2, 23, 15, 'dining');
mn('food-juice-node', 'Food Stall: Fresh Juices', 2, 23, 20, 'dining');
mn('food-dessert-node', 'Food Stall: Gourmet Crepes', 2, 23, 25, 'dining');
mn('food-seating-node', 'Food Hall Dining Concourse', 2, 17, 18, 'dining');

mn('arcade-node', 'Amusement Arcade & VR Zone', 2, 13, 38, 'fitness');
mn('bowling-node', 'Billiards & Bowling Lounge', 2, 24, 38, 'fitness');
mn('admin-node', 'Mall Administration HQ', 2, 58, 38, 'office');
mn('security-node', 'Security & CCTV Command', 2, 69, 38, 'office');
mn('clinic-node', 'Emergency First Aid & Clinic', 2, 57, 46, 'office');
mn('lockers-node', 'Staff Lockers & Facilities', 2, 68, 46, 'office');

me('f2-north-aisle-e', 'cinema-1-node');
me('f2-north-aisle-e', 'cinema-2-node');
me('f2-north-aisle-e', 'box-office-node');
me('f2-north-aisle-e', 'concessions-node');

me('f2-north-aisle-w', 'food-seating-node');
me('food-seating-node', 'food-asian-node');
me('food-seating-node', 'food-grill-node');
me('food-seating-node', 'food-ramen-node');
me('food-seating-node', 'food-pizza-node');
me('food-seating-node', 'food-mexican-node');
me('food-seating-node', 'food-filipino-node');
me('food-seating-node', 'food-juice-node');
me('food-seating-node', 'food-dessert-node');

me('f2-south-aisle-w', 'arcade-node');
me('f2-south-aisle-w', 'bowling-node');
me('f2-south-aisle-e', 'admin-node');
me('f2-south-aisle-e', 'security-node');
me('f2-south-aisle-e', 'clinic-node');
me('f2-south-aisle-e', 'lockers-node');

export const mallGraph: HotelGraph = {
  nodes: mallNodes,
  edges: mallEdges,
};

// ----------------------------------------------------------------------------
// SVG FLOOR PLAN ARTWORK GENERATION (CRISP HIGH-RES VECTOR CANVAS)
// ----------------------------------------------------------------------------
function esc(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderMallFloorSvg(floor: FloorId): string {
  const rooms = mallRooms.filter(r => r.floor === floor);
  const elements: string[] = [];

  // Background sheet with subtle warm paper texture
  elements.push(`<rect width="${MALL_PLAN_WIDTH}" height="${MALL_PLAN_HEIGHT}" fill="#FBFBF9" stroke="#0F172A" stroke-width="4"/>`);

  // Structural Grid Lines & Bubbles (every 8 meters: x=8, 16... 72; y=8, 16... 48)
  for (let x = 8; x <= 72; x += 8) {
    const pxVal = mpx(x);
    elements.push(`<line x1="${pxVal}" y1="20" x2="${pxVal}" y2="${MALL_PLAN_HEIGHT - 20}" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="8,6"/>`);
    const label = `${(x / 8)}`;
    elements.push(`<circle cx="${pxVal}" cy="30" r="14" fill="#FFFFFF" stroke="#64748B" stroke-width="1.5"/>`);
    elements.push(`<text x="${pxVal}" y="35" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#334155">${label}</text>`);
  }
  const yLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  for (let y = 8; y <= 48; y += 8) {
    const pyVal = mpx(y);
    elements.push(`<line x1="20" y1="${pyVal}" x2="${MALL_PLAN_WIDTH - 20}" y2="${pyVal}" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="8,6"/>`);
    const label = yLabels[(y / 8) - 1] ?? '';
    elements.push(`<circle cx="30" cy="${pyVal}" r="14" fill="#FFFFFF" stroke="#64748B" stroke-width="1.5"/>`);
    elements.push(`<text x="30" y="${pyVal + 4}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#334155">${label}</text>`);
  }

  // Outer Building Envelope Wall (x=4m to 76m, y=6m to 54m)
  const bx = mpx(4), by = mpx(6), bw = mpx(72), bh = mpx(48);
  elements.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#FFFFFF" stroke="#1E293B" stroke-width="6"/>`);

  // Corridors & Concourse Flooring fill
  elements.push(`<rect x="${bx + 4}" y="${by + 4}" width="${bw - 8}" height="${bh - 8}" fill="#F8FAFC" stroke="none"/>`);

  // Central Grand Atrium (x=30m to 50m, y=22m to 38m)
  const ax = mpx(30), ay = mpx(22), aw = mpx(20), ah = mpx(16);
  if (floor === 0) {
    // Ground floor atrium tile pattern & medallion
    elements.push(`<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="#F1F5F9" stroke="#94A3B8" stroke-width="2" stroke-dasharray="6,4"/>`);
    elements.push(`<circle cx="${ax + aw / 2}" cy="${ay + ah / 2}" r="${mpx(6)}" fill="none" stroke="#CBD5E1" stroke-width="2"/>`);
    elements.push(`<circle cx="${ax + aw / 2}" cy="${ay + ah / 2}" r="${mpx(3)}" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4,4"/>`);
    // Planter lounge seating
    elements.push(`<rect x="${ax + mpx(2)}" y="${ay + mpx(2)}" width="${mpx(4)}" height="${mpx(1.2)}" rx="4" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5"/>`);
    elements.push(`<text x="${ax + mpx(4)}" y="${ay + mpx(2.9)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" fill="#15803D">🌿 Planter Lounge</text>`);
    elements.push(`<rect x="${ax + aw - mpx(6)}" y="${ay + mpx(2)}" width="${mpx(4)}" height="${mpx(1.2)}" rx="4" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5"/>`);
    elements.push(`<text x="${ax + aw - mpx(4)}" y="${ay + mpx(2.9)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" fill="#15803D">🌿 Planter Lounge</text>`);
    elements.push(`<text x="${ax + aw / 2}" y="${ay + 25}" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="bold" fill="#334155">CENTRAL GRAND ATRIUM (CLERESTORY SKYLIGHT ABOVE)</text>`);
  } else {
    // Upper floors open void with red safety warning outline & glass balustrade
    elements.push(`<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="#F8FAFC" stroke="#DC2626" stroke-width="3" stroke-dasharray="8,6"/>`);
    elements.push(`<line x1="${ax}" y1="${ay}" x2="${ax + aw}" y2="${ay + ah}" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6,6"/>`);
    elements.push(`<line x1="${ax}" y1="${ay + ah}" x2="${ax + aw}" y2="${ay}" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6,6"/>`);
    elements.push(`<text x="${ax + aw / 2}" y="${ay + 30}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#DC2626">OPEN ATRIUM VOID · 1.20m SAFETY GLASS BALUSTRADE (BP 344)</text>`);
    if (floor === 1) {
      // Skybridge on Level 2 with glass balustrades
      const sbX = mpx(37.5), sbW = mpx(5);
      elements.push(`<rect x="${sbX}" y="${ay}" width="${sbW}" height="${ah}" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5"/>`);
      elements.push(`<line x1="${sbX + 4}" y1="${ay}" x2="${sbX + 4}" y2="${ay + ah}" stroke="#0284C7" stroke-width="3" stroke-dasharray="4,2"/>`);
      elements.push(`<line x1="${sbX + sbW - 4}" y1="${ay}" x2="${sbX + sbW - 4}" y2="${ay + ah}" stroke="#0284C7" stroke-width="3" stroke-dasharray="4,2"/>`);
      elements.push(`<text x="${sbX + sbW / 2}" y="${ay + ah / 2 - 8}" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#0F172A">MEZZANINE SKYBRIDGE</text>`);
      elements.push(`<text x="${sbX + sbW / 2}" y="${ay + ah / 2 + 8}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" fill="#0369A1">5.0m CLEAR WIDTH (BP 344)</text>`);
    }
  }

  // Draw Rooms Base Rectangles
  for (const r of rooms) {
    const rx = mpx(r.x), ry = mpx(r.y), rw = mpx(r.w), rh = mpx(r.h);
    let fill = '#FFFDF5';
    let stroke = '#94A3B8';
    if (r.category === 'restroom') {
      fill = '#F0F9FF'; stroke = '#0284C7';
    } else if (r.category === 'dining') {
      fill = '#FFF7ED'; stroke = '#EA580C';
    } else if (r.category === 'conference') {
      fill = '#FAF5FF'; stroke = '#7C3AED';
    } else if (r.category === 'fitness') {
      fill = '#FDF2F8'; stroke = '#DB2777';
    } else if (r.category === 'office') {
      fill = '#F8FAFC'; stroke = '#475569';
    } else if (r.w >= 18) {
      fill = '#FEFCE8'; stroke = '#CA8A04';
    }

    elements.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="2"/>`);
    elements.push(`<text x="${rx + rw / 2}" y="${ry + Math.min(20, rh / 2)}" text-anchor="middle" font-family="Georgia, serif" font-size="${rw > 200 ? 13 : 10.5}" font-weight="bold" fill="#0F172A">${esc(r.name)}</text>`);
    if (r.subtitle) {
      elements.push(`<text x="${rx + rw / 2}" y="${ry + Math.min(34, rh / 2 + 13)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${rw > 200 ? 9.5 : 8}" fill="#475569">${esc(r.subtitle)}</text>`);
    }

    // Doorway opening if specified
    if (r.door) {
      const { x, y, width, wall, label } = r.door;
      const dx = mpx(x), dy = mpx(y), dw = mpx(width);
      if (wall === 'north' || wall === 'south') {
        elements.push(`<rect x="${dx - dw / 2}" y="${dy - 6}" width="${dw}" height="12" fill="#FFFFFF" stroke="none"/>`);
        elements.push(`<line x1="${dx - dw / 2}" y1="${dy}" x2="${dx - dw / 2}" y2="${dy + 12}" stroke="#CA8A04" stroke-width="2"/>`);
      } else {
        elements.push(`<rect x="${dx - 6}" y="${dy - dw / 2}" width="12" height="${dw}" fill="#FFFFFF" stroke="none"/>`);
        elements.push(`<line x1="${dx}" y1="${dy - dw / 2}" x2="${dx + 12}" y2="${dy - dw / 2}" stroke="#CA8A04" stroke-width="2"/>`);
      }
      if (label) {
        elements.push(`<text x="${dx}" y="${dy + 4}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="bold" fill="#A16207">${esc(label)}</text>`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // DETAILED ARCHITECTURAL INTERIOR DIVISIONS & FIXTURES PER FLOOR
  // --------------------------------------------------------------------------
  if (floor === 0) {
    // 1. SUPERMARKET INTERIOR DIVISIONS (x=52 to 74, y=8 to 26)
    // 6 Double-sided Gondola Product Aisles (from x=56 to 70)
    for (let i = 0; i < 6; i++) {
      const gx = mpx(56 + i * 2.4);
      const gy = mpx(12);
      const gw = mpx(1.4);
      const gh = mpx(12);
      elements.push(`<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="#E2E8F0" stroke="#64748B" stroke-width="1.2"/>`);
      // Aisle shelf dividers
      for (let sy = gy + 15; sy < gy + gh - 10; sy += 20) {
        elements.push(`<line x1="${gx}" y1="${sy}" x2="${gx + gw}" y2="${sy}" stroke="#94A3B8" stroke-width="0.8"/>`);
      }
      // Aisle number tag
      elements.push(`<rect x="${gx + gw / 2 - 8}" y="${gy + 4}" width="16" height="12" rx="2" fill="#0284C7"/>`);
      elements.push(`<text x="${gx + gw / 2}" y="${gy + 13}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7.5" font-weight="bold" fill="#FFFFFF">${i + 1}</text>`);
    }

    // Supermarket Checkout Bank along West wall (x=53.5, y=10 to 24)
    for (let c = 0; c < 5; c++) {
      const cy = mpx(10 + c * 2.8);
      const cx = mpx(53.2);
      const isPwdLane = c === 0;
      elements.push(`<rect x="${cx}" y="${cy}" width="${mpx(1.8)}" height="${mpx(1.6)}" fill="${isPwdLane ? '#EFF6FF' : '#F1F5F9'}" stroke="${isPwdLane ? '#0284C7' : '#64748B'}" stroke-width="1.2"/>`);
      elements.push(`<line x1="${cx}" y1="${cy + mpx(0.8)}" x2="${cx + mpx(1.8)}" y2="${cy + mpx(0.8)}" stroke="#94A3B8" stroke-width="1"/>`);
      if (isPwdLane) {
        elements.push(`<text x="${cx + mpx(0.9)}" y="${cy + mpx(0.55)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6.5" font-weight="bold" fill="#0284C7">♿ PWD LANE</text>`);
        elements.push(`<text x="${cx + mpx(0.9)}" y="${cy + mpx(1.3)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6" fill="#0369A1">1.20m LOW CNTR</text>`);
      } else {
        elements.push(`<text x="${cx + mpx(0.9)}" y="${cy + mpx(0.55)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6.5" fill="#475569">LANE ${c + 1}</text>`);
      }
    }

    // Produce & Chilled Dairy perimeter cases
    elements.push(`<rect x="${mpx(72.5)}" y="${mpx(10)}" width="${mpx(1.2)}" height="${mpx(14)}" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2"/>`);
    elements.push(`<text x="${mpx(73.1)}" y="${mpx(17)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7.5" font-weight="bold" fill="#15803D" transform="rotate(90 ${mpx(73.1)} ${mpx(17)})">CHILLED DAIRY &amp; PRODUCE CASES</text>`);

    // 2. DEPARTMENT STORE L1 FIXTURES (x=6 to 28, y=8 to 26)
    // Central Display Pods
    for (let px = 10; px <= 24; px += 5) {
      for (let py = 12; py <= 22; py += 5) {
        elements.push(`<rect x="${mpx(px)}" y="${mpx(py)}" width="${mpx(2.2)}" height="${mpx(2)}" rx="3" fill="#FEF3C7" stroke="#D97706" stroke-width="1.2"/>`);
        elements.push(`<circle cx="${mpx(px + 1.1)}" cy="${mpx(py + 1)}" r="${mpx(0.5)}" fill="none" stroke="#B45309" stroke-width="0.8"/>`);
      }
    }
    // Fitting Cabins along West Wall (x=6.5 to 8.5, y=10 to 22)
    elements.push(`<rect x="${mpx(6.5)}" y="${mpx(10)}" width="${mpx(2.5)}" height="${mpx(3)}" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.2"/>`);
    elements.push(`<text x="${mpx(7.75)}" y="${mpx(11.5)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#0284C7">♿ PWD CABIN</text>`);
    elements.push(`<text x="${mpx(7.75)}" y="${mpx(12.4)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6" fill="#0369A1">2.0m x 2.0m Bench</text>`);
    for (let k = 0; k < 3; k++) {
      elements.push(`<rect x="${mpx(6.5)}" y="${mpx(14 + k * 2.8)}" width="${mpx(2.2)}" height="${mpx(2.2)}" fill="#F8FAFC" stroke="#64748B" stroke-width="1"/>`);
      elements.push(`<text x="${mpx(7.6)}" y="${mpx(15.3 + k * 2.8)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6.5" fill="#475569">Fitting ${k + 1}</text>`);
    }

    // 3. CONCIERGE & ATRIUM KIOSKS (Floor 0)
    // Concierge Dual Counter: Standing + 0.80m Wheelchair Accessible Counter
    const ccX = mpx(37), ccY = mpx(34), ccW = mpx(6), ccH = mpx(3);
    elements.push(`<rect x="${ccX}" y="${ccY}" width="${ccW}" height="${ccH}" fill="#FFFFFF" stroke="#047857" stroke-width="2" rx="4"/>`);
    elements.push(`<rect x="${ccX + 4}" y="${ccY + 4}" width="${ccW - 8}" height="${ccH - 8}" fill="#ECFDF5" stroke="none"/>`);
    elements.push(`<text x="${ccX + ccW / 2}" y="${ccY + 18}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" fill="#065F46">CONCIERGE &amp; PWD DESK</text>`);
    elements.push(`<text x="${ccX + ccW / 2}" y="${ccY + 32}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7.5" fill="#047857">0.80m Counter · Hearing Loop · Wheelchair Loan</text>`);

    // Coffee Kiosk counter & barstools
    elements.push(`<rect x="${mpx(32.5)}" y="${mpx(24.5)}" width="${mpx(2.5)}" height="${mpx(2.5)}" fill="#FFF7ED" stroke="#EA580C" stroke-width="1.2"/>`);
    elements.push(`<text x="${mpx(33.75)}" y="${mpx(26)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#C2410C">☕ Espresso Bar</text>`);

    // Bakery Kiosk counter
    elements.push(`<rect x="${mpx(45)}" y="${mpx(24.5)}" width="${mpx(2.5)}" height="${mpx(2.5)}" fill="#FFFBEB" stroke="#D97706" stroke-width="1.2"/>`);
    elements.push(`<text x="${mpx(46.25)}" y="${mpx(26)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#B45309">🥐 Glass Pastry</text>`);
  } else if (floor === 1) {
    // --------------------------------------------------------------------------
    // LEVEL 2: SECOND FLOOR FIXTURES
    // --------------------------------------------------------------------------
    // 1. CYBERZONE TECH HUB (x=52 to 74, y=8 to 26)
    // Flagship Computers: Long demo benches
    for (let bx = 54; bx <= 61; bx += 3.5) {
      elements.push(`<rect x="${mpx(bx)}" y="${mpx(11)}" width="${mpx(2.2)}" height="${mpx(7.5)}" rx="2" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.2"/>`);
      elements.push(`<text x="${mpx(bx + 1.1)}" y="${mpx(15)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#0369A1" transform="rotate(90 ${mpx(bx + 1.1)} ${mpx(15)})">LAPTOP DEMO BENCH</text>`);
    }

    // Smartphones: 4 demo island pedestals
    for (let px = 65; px <= 71; px += 3) {
      for (let py = 11; py <= 17; py += 3.5) {
        elements.push(`<circle cx="${mpx(px)}" cy="${mpx(py)}" r="${mpx(1.1)}" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.2"/>`);
        elements.push(`<rect x="${mpx(px - 0.4)}" y="${mpx(py - 0.6)}" width="${mpx(0.8)}" height="${mpx(1.2)}" rx="1" fill="#1D4ED8"/>`);
      }
    }

    // Esports Lounge: Gaming rigs
    for (let gx = 53.5; gx <= 60; gx += 2.2) {
      elements.push(`<rect x="${mpx(gx)}" y="${mpx(22)}" width="${mpx(1.6)}" height="${mpx(1.8)}" fill="#1E1B4B" stroke="#818CF8" stroke-width="1.2"/>`);
      elements.push(`<text x="${mpx(gx + 0.8)}" y="${mpx(23.2)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6" fill="#C7D2FE">RIG</text>`);
    }

    // Audio Hi-Fi listening booths
    elements.push(`<rect x="${mpx(63)}" y="${mpx(21.5)}" width="${mpx(4)}" height="${mpx(3)}" fill="#FAF5FF" stroke="#9333EA" stroke-width="1.2"/>`);
    elements.push(`<text x="${mpx(65)}" y="${mpx(23.2)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#7E22CE">🎧 Acoustic Studio</text>`);

    // 2. SPECIALTY SHOPS FIXTURES (L2)
    // Beauty Spa styling stations (x=18 to 28, y=46 to 52)
    for (let sx = 20; sx <= 26; sx += 2.5) {
      elements.push(`<circle cx="${mpx(sx)}" cy="${mpx(49)}" r="${mpx(0.8)}" fill="#FDF2F8" stroke="#DB2777" stroke-width="1"/>`);
      elements.push(`<rect x="${mpx(sx - 0.6)}" y="${mpx(46.5)}" width="${mpx(1.2)}" height="${mpx(0.5)}" fill="#BE185D"/>`);
    }
    // Dental Clinic exam chairs (x=52 to 59, y=36 to 44)
    elements.push(`<rect x="${mpx(54)}" y="${mpx(39)}" width="${mpx(3)}" height="${mpx(1.6)}" rx="3" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.2"/>`);
    elements.push(`<text x="${mpx(55.5)}" y="${mpx(40.1)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6.5" font-weight="bold" fill="#0369A1">Dental Operatory</text>`);
  } else if (floor === 2) {
    // --------------------------------------------------------------------------
    // LEVEL 3: THIRD FLOOR FIXTURES
    // --------------------------------------------------------------------------
    // 1. CINEMA 1 & 2 DETAILED STADIUM SEATING & CURVED SCREEN
    for (const cInfo of [
      { id: 1, cx: 52, w: 11, label: 'CINEMA 1: DIGITAL SURROUND' },
      { id: 2, cx: 63, w: 11, label: 'CINEMA 2: DOLBY ATMOS' },
    ]) {
      const sx1 = mpx(cInfo.cx + 1), sx2 = mpx(cInfo.cx + cInfo.w - 1);
      const sy = mpx(9.5);
      // Curved Projection Screen
      elements.push(`<path d="M ${sx1} ${sy + 10} Q ${mpx(cInfo.cx + cInfo.w / 2)} ${sy - 5} ${sx2} ${sy + 10}" fill="none" stroke="#7C3AED" stroke-width="4"/>`);
      elements.push(`<text x="${mpx(cInfo.cx + cInfo.w / 2)}" y="${sy + 6}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="bold" fill="#6D28D9">CURVED GIANT SCREEN</text>`);

      // 6 Tiered Stadium Seating Rows
      for (let r = 0; r < 6; r++) {
        const ry = mpx(12 + r * 2);
        elements.push(`<line x1="${mpx(cInfo.cx + 1.2)}" y1="${ry}" x2="${mpx(cInfo.cx + cInfo.w - 1.2)}" y2="${ry}" stroke="#C4B5FD" stroke-width="1.5"/>`);
        // Individual seats along row
        for (let st = cInfo.cx + 2; st <= cInfo.cx + cInfo.w - 2.5; st += 1.2) {
          elements.push(`<rect x="${mpx(st)}" y="${ry - 6}" width="18" height="12" rx="2" fill="#EDE9FE" stroke="#8B5CF6" stroke-width="0.8"/>`);
        }
      }

      // BP 344 Dedicated Wheelchair Bays on flat accessible tier (front/mid cross-aisle)
      const wBayY = mpx(23.5);
      elements.push(`<rect x="${mpx(cInfo.cx + 2)}" y="${wBayY}" width="${mpx(3.5)}" height="${mpx(1.8)}" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.5" stroke-dasharray="3,2"/>`);
      elements.push(`<text x="${mpx(cInfo.cx + 3.75)}" y="${wBayY + mpx(1.1)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7.5" font-weight="bold" fill="#0284C7">♿ PWD BAYS (BP 344)</text>`);

      // Sound lock acoustic double-door vestibule
      const vzY = mpx(25);
      elements.push(`<rect x="${mpx(cInfo.cx + 4.5)}" y="${vzY}" width="${mpx(2.5)}" height="${mpx(1.5)}" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1.2"/>`);
      elements.push(`<text x="${mpx(cInfo.cx + 5.75)}" y="${vzY + mpx(1)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6.5" font-weight="bold" fill="#6D28D9">Acoustic Lock</text>`);
    }

    // Cinema Concessions Popcorn & Soda Counter (x=59 to 73, y=26.5 to 30)
    elements.push(`<rect x="${mpx(59.5)}" y="${mpx(27)}" width="${mpx(13)}" height="${mpx(2)}" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>`);
    elements.push(`<text x="${mpx(66)}" y="${mpx(28.3)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" font-weight="bold" fill="#92400E">🍿 CONCESSIONS &amp; REFRESHMENT BAR</text>`);

    // 2. GOURMET FOOD HALL KITCHENS & SEATING CONCOURSE (x=6 to 28, y=8 to 30)
    // Central Dining Concourse (x=13 to 21, y=10 to 28)
    // 6 Family dining tables with 4 seats each
    for (let ty = 11; ty <= 25; ty += 4.5) {
      // Regular table
      elements.push(`<rect x="${mpx(13.5)}" y="${mpx(ty)}" width="${mpx(2.4)}" height="${mpx(1.8)}" rx="2" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.2"/>`);
      elements.push(`<circle cx="${mpx(13.5 - 0.5)}" cy="${mpx(ty + 0.9)}" r="${mpx(0.4)}" fill="#FED7AA"/>`);
      elements.push(`<circle cx="${mpx(13.5 + 2.9)}" cy="${mpx(ty + 0.9)}" r="${mpx(0.4)}" fill="#FED7AA"/>`);

      // Accessible BP 344 Table with International Symbol of Access
      elements.push(`<rect x="${mpx(17.5)}" y="${mpx(ty)}" width="${mpx(3)}" height="${mpx(1.8)}" rx="2" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.5"/>`);
      elements.push(`<text x="${mpx(19)}" y="${mpx(ty + 1.1)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#0284C7">♿ PWD TABLE</text>`);
      elements.push(`<text x="${mpx(19)}" y="${mpx(ty + 1.6)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6" fill="#0369A1">0.70m Knee Clr</text>`);
    }

    // Food Stalls: Kitchen Prep Line & Service Windows
    for (let ky = 8; ky <= 23; ky += 5) {
      // West stall service counters
      elements.push(`<line x1="${mpx(10.8)}" y1="${mpx(ky + 1)}" x2="${mpx(10.8)}" y2="${mpx(ky + 4)}" stroke="#C2410C" stroke-width="2"/>`);
      elements.push(`<rect x="${mpx(10.2)}" y="${mpx(ky + 3)}" width="${mpx(0.6)}" height="${mpx(1)}" fill="#EFF6FF" stroke="#0284C7" stroke-width="1"/>`);
      // East stall service counters
      elements.push(`<line x1="${mpx(22.2)}" y1="${mpx(ky + 1)}" x2="${mpx(22.2)}" y2="${mpx(ky + 4)}" stroke="#C2410C" stroke-width="2"/>`);
      elements.push(`<rect x="${mpx(22.2)}" y="${mpx(ky + 3)}" width="${mpx(0.6)}" height="${mpx(1)}" fill="#EFF6FF" stroke="#0284C7" stroke-width="1"/>`);
    }

    // 3. ENTERTAINMENT & AMUSEMENT (L3)
    // Arcade video cabinets in rows (x=7 to 17, y=38 to 46)
    for (let ax = 7.5; ax <= 15.5; ax += 2.2) {
      elements.push(`<rect x="${mpx(ax)}" y="${mpx(38)}" width="${mpx(1.4)}" height="${mpx(1.2)}" fill="#1E1B4B" stroke="#EC4899" stroke-width="1"/>`);
      elements.push(`<rect x="${mpx(ax)}" y="${mpx(42)}" width="${mpx(1.4)}" height="${mpx(1.2)}" fill="#1E1B4B" stroke="#EC4899" stroke-width="1"/>`);
    }
    // Bowling Lanes (x=19 to 27, y=38 to 46)
    for (let bi = 0; bi < 2; bi++) {
      const byL = mpx(38 + bi * 3.5);
      elements.push(`<rect x="${mpx(19.5)}" y="${byL}" width="${mpx(7.5)}" height="${mpx(2)}" fill="#FEF3C7" stroke="#D97706" stroke-width="1.2"/>`);
      elements.push(`<text x="${mpx(23)}" y="${byL + mpx(1.2)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7.5" font-weight="bold" fill="#B45309">BOWLING LANE ${bi + 1}</text>`);
    }

    // 4. ADMIN & MEDICAL CLINIC (L3)
    // Clinic Examination Bed and Doctor's Consultation Desk (x=53 to 62, y=45 to 51)
    elements.push(`<rect x="${mpx(53.5)}" y="${mpx(46)}" width="${mpx(3.5)}" height="${mpx(1.8)}" rx="2" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.2"/>`);
    elements.push(`<text x="${mpx(55.25)}" y="${mpx(47.2)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#0369A1">Exam Bed</text>`);
    elements.push(`<rect x="${mpx(58)}" y="${mpx(46)}" width="${mpx(2.5)}" height="${mpx(1.5)}" fill="#F8FAFC" stroke="#64748B" stroke-width="1.2"/>`);
    elements.push(`<text x="${mpx(59.25)}" y="${mpx(47)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6.5" fill="#475569">Dr. Desk</text>`);
  }

  // --------------------------------------------------------------------------
  // RESTROOM SUITES ON ALL FLOORS (BP 344 STRICT COMPLIANCE)
  // --------------------------------------------------------------------------
  // West PWD Restroom (x=18 to 21.5, y=28 to 31.5)
  const wpwX = mpx(18), wpwY = mpx(28), wpwW = mpx(3.5), wpwH = mpx(3.5);
  elements.push(`<rect x="${wpwX}" y="${wpwY}" width="${wpwW}" height="${wpwH}" fill="#EFF6FF" stroke="#0284C7" stroke-width="2" rx="3"/>`);
  // 1.50m Turning Circle guide
  elements.push(`<circle cx="${wpwX + wpwW / 2}" cy="${wpwY + wpwH / 2}" r="${mpx(1.5 / 2)}" fill="none" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="4,3"/>`);
  elements.push(`<text x="${wpwX + wpwW / 2}" y="${wpwY + wpwH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6.5" font-weight="bold" fill="#0284C7">1.50m ⟲</text>`);
  // Water closet fixture with grab bars
  elements.push(`<rect x="${wpwX + 6}" y="${wpwY + 6}" width="${mpx(0.8)}" height="${mpx(1.0)}" rx="3" fill="#FFFFFF" stroke="#0369A1" stroke-width="1.2"/>`);
  elements.push(`<line x1="${wpwX + 4}" y1="${wpwY + 4}" x2="${wpwX + 4}" y2="${wpwY + mpx(1.4)}" stroke="#0284C7" stroke-width="3"/>`);
  elements.push(`<text x="${wpwX + wpwW / 2}" y="${wpwY + wpwH - 6}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#0284C7">♿ BP 344 PWD TOILET</text>`);

  // East PWD Restroom (x=58 to 61.5, y=28 to 31.5)
  const epwX = mpx(58), epwY = mpx(28), epwW = mpx(3.5), epwH = mpx(3.5);
  elements.push(`<rect x="${epwX}" y="${epwY}" width="${epwW}" height="${epwH}" fill="#EFF6FF" stroke="#0284C7" stroke-width="2" rx="3"/>`);
  elements.push(`<circle cx="${epwX + epwW / 2}" cy="${epwY + epwH / 2}" r="${mpx(1.5 / 2)}" fill="none" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="4,3"/>`);
  elements.push(`<text x="${epwX + epwW / 2}" y="${epwY + epwH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="6.5" font-weight="bold" fill="#0284C7">1.50m ⟲</text>`);
  elements.push(`<rect x="${epwX + epwW - mpx(0.8) - 6}" y="${epwY + 6}" width="${mpx(0.8)}" height="${mpx(1.0)}" rx="3" fill="#FFFFFF" stroke="#0369A1" stroke-width="1.2"/>`);
  elements.push(`<line x1="${epwX + epwW - 4}" y1="${epwY + 4}" x2="${epwX + epwW - 4}" y2="${epwY + mpx(1.4)}" stroke="#0284C7" stroke-width="3"/>`);
  elements.push(`<text x="${epwX + epwW / 2}" y="${epwY + epwH - 6}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" fill="#0284C7">♿ BP 344 PWD TOILET</text>`);

  // --------------------------------------------------------------------------
  // TACTILE WARNING PAVING & VERTICAL TRANSPORTATION ELEMENTS
  // --------------------------------------------------------------------------
  // Tactile Ground Surface Indicators (TGSI) in Safety Yellow (#F59E0B)
  const drawTactile = (tx: number, ty: number, tw: number, th: number) => {
    elements.push(`<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5"/>`);
    elements.push(`<line x1="${tx}" y1="${ty + th / 2}" x2="${tx + tw}" y2="${ty + th / 2}" stroke="#D97706" stroke-width="1.5" stroke-dasharray="3,3"/>`);
  };

  // Scenic Glass Lift
  const slX = mpx(44.5), slY = mpx(28.5), slW = mpx(3), slH = mpx(3);
  drawTactile(slX - 12, slY, 10, slH);
  elements.push(`<rect x="${slX}" y="${slY}" width="${slW}" height="${slH}" fill="#EFF6FF" stroke="#0284C7" stroke-width="2.5" rx="3"/>`);
  elements.push(`<rect x="${slX + 4}" y="${slY + 4}" width="${slW - 8}" height="${slH - 8}" fill="#FFFFFF" stroke="#0284C7" stroke-width="1" stroke-dasharray="2,2"/>`);
  elements.push(`<line x1="${slX}" y1="${slY + slH / 2}" x2="${slX + 6}" y2="${slY + slH / 2}" stroke="#0284C7" stroke-width="3"/>`);
  elements.push(`<text x="${slX + slW / 2}" y="${slY + slH / 2 - 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9.5" font-weight="bold" fill="#0284C7">♿ SCENIC LIFT</text>`);
  elements.push(`<text x="${slX + slW / 2}" y="${slY + slH / 2 + 10}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="7.5" fill="#0369A1">1.40m x 1.70m Cab</text>`);

  // Escalators with step treads & direction indicators
  const escX = mpx(37), escY = mpx(26), escW = mpx(6), escH = mpx(5);
  drawTactile(escX, escY - 10, escW, 8);
  drawTactile(escX, escY + escH + 2, escW, 8);
  elements.push(`<rect x="${escX}" y="${escY}" width="${escW}" height="${escH}" fill="#FEF2F2" stroke="#DC2626" stroke-width="2.5" rx="3"/>`);
  // Criss-cross escalator divider and treads
  elements.push(`<line x1="${escX + escW / 2}" y1="${escY}" x2="${escX + escW / 2}" y2="${escY + escH}" stroke="#B91C1C" stroke-width="1.5"/>`);
  for (let ey = escY + 6; ey < escY + escH - 4; ey += 6) {
    elements.push(`<line x1="${escX + 2}" y1="${ey}" x2="${escX + escW / 2 - 2}" y2="${ey}" stroke="#EF4444" stroke-width="1"/>`);
    elements.push(`<line x1="${escX + escW / 2 + 2}" y1="${ey}" x2="${escX + escW - 2}" y2="${ey}" stroke="#EF4444" stroke-width="1"/>`);
  }
  elements.push(`<text x="${escX + escW / 4}" y="${escY + escH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" font-weight="bold" fill="#991B1B">▲ UP</text>`);
  elements.push(`<text x="${escX + (escW * 3) / 4}" y="${escY + escH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" font-weight="bold" fill="#991B1B">▼ DOWN</text>`);

  // West Core: Lift, Stairs & Ramp
  const wLiftX = mpx(7), wLiftY = mpx(26.5), wLiftW = mpx(3), wLiftH = mpx(3);
  drawTactile(wLiftX + wLiftW + 2, wLiftY, 8, wLiftH);
  elements.push(`<rect x="${wLiftX}" y="${wLiftY}" width="${wLiftW}" height="${wLiftH}" fill="#EFF6FF" stroke="#0284C7" stroke-width="2" rx="2"/>`);
  elements.push(`<text x="${wLiftX + wLiftW / 2}" y="${wLiftY + wLiftH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" font-weight="bold" fill="#0284C7">♿ WEST LIFT</text>`);

  const wStairX = mpx(11), wStairY = mpx(26.5), wStairW = mpx(3), wStairH = mpx(3);
  elements.push(`<rect x="${wStairX}" y="${wStairY}" width="${wStairW}" height="${wStairH}" fill="#F8FAFC" stroke="#0F172A" stroke-width="2"/>`);
  for (let wy = wStairY + 8; wy < wStairY + wStairH - 4; wy += 8) {
    elements.push(`<line x1="${wStairX}" y1="${wy}" x2="${wStairX + wStairW}" y2="${wy}" stroke="#64748B" stroke-width="1"/>`);
  }
  elements.push(`<text x="${wStairX + wStairW / 2}" y="${wStairY + wStairH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="bold" fill="#0F172A">WEST STAIRS</text>`);

  const wRampX = mpx(7), wRampY = mpx(30.5), wRampW = mpx(7), wRampH = mpx(2.5);
  drawTactile(wRampX + wRampW + 2, wRampY, 8, wRampH);
  elements.push(`<rect x="${wRampX}" y="${wRampY}" width="${wRampW}" height="${wRampH}" fill="#EFF6FF" stroke="#0284C7" stroke-width="2"/>`);
  elements.push(`<line x1="${wRampX + 4}" y1="${wRampY + wRampH / 2}" x2="${wRampX + wRampW - 4}" y2="${wRampY + wRampH / 2}" stroke="#0284C7" stroke-width="2" marker-end="url(#arrow)"/>`);
  elements.push(`<text x="${wRampX + wRampW / 2}" y="${wRampY + wRampH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" font-weight="bold" fill="#0284C7">♿ RAMP (1:12 SLOPE)</text>`);

  // East Core: Lift, Stairs & Ramp
  const eLiftX = mpx(70), eLiftY = mpx(26.5), eLiftW = mpx(3), eLiftH = mpx(3);
  drawTactile(eLiftX - 10, eLiftY, 8, eLiftH);
  elements.push(`<rect x="${eLiftX}" y="${eLiftY}" width="${eLiftW}" height="${eLiftH}" fill="#EFF6FF" stroke="#0284C7" stroke-width="2" rx="2"/>`);
  elements.push(`<text x="${eLiftX + eLiftW / 2}" y="${eLiftY + eLiftH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" font-weight="bold" fill="#0284C7">♿ EAST LIFT</text>`);

  const eStairX = mpx(66), eStairY = mpx(26.5), eStairW = mpx(3), eStairH = mpx(3);
  elements.push(`<rect x="${eStairX}" y="${eStairY}" width="${eStairW}" height="${eStairH}" fill="#F8FAFC" stroke="#0F172A" stroke-width="2"/>`);
  for (let ey = eStairY + 8; ey < eStairY + eStairH - 4; ey += 8) {
    elements.push(`<line x1="${eStairX}" y1="${ey}" x2="${eStairX + eStairW}" y2="${ey}" stroke="#64748B" stroke-width="1"/>`);
  }
  elements.push(`<text x="${eStairX + eStairW / 2}" y="${eStairY + eStairH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="bold" fill="#0F172A">EAST STAIRS</text>`);

  const eRampX = mpx(66), eRampY = mpx(30.5), eRampW = mpx(7), eRampH = mpx(2.5);
  drawTactile(eRampX - 10, eRampY, 8, eRampH);
  elements.push(`<rect x="${eRampX}" y="${eRampY}" width="${eRampW}" height="${eRampH}" fill="#EFF6FF" stroke="#0284C7" stroke-width="2"/>`);
  elements.push(`<line x1="${eRampX + eRampW - 4}" y1="${eRampY + eRampH / 2}" x2="${eRampX + 4}" y2="${eRampY + eRampH / 2}" stroke="#0284C7" stroke-width="2"/>`);
  elements.push(`<text x="${eRampX + eRampW / 2}" y="${eRampY + eRampH / 2 + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" font-weight="bold" fill="#0284C7">♿ RAMP (1:12 SLOPE)</text>`);

  // Outdoor Entrances & PWD elements on Floor 0
  if (floor === 0) {
    // North Entrance & Ramp
    const nEntX = mpx(36), nEntY = mpx(6), nEntW = mpx(8);
    elements.push(`<rect x="${nEntX}" y="${nEntY - 10}" width="${nEntW}" height="20" fill="#FFFFFF" stroke="none"/>`);
    elements.push(`<text x="${nEntX + nEntW / 2}" y="${nEntY - 15}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#047857">NORTH MAIN ENTRANCE (2.40m AUTO DOOR)</text>`);

    const nRampX = mpx(33), nRampY = mpx(1.5), nRampW = mpx(4), nRampH = mpx(4.5);
    elements.push(`<rect x="${nRampX}" y="${nRampY}" width="${nRampW}" height="${nRampH}" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.8"/>`);
    elements.push(`<text x="${nRampX + nRampW / 2}" y="${nRampY + nRampH / 2 + 4}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" fill="#0284C7">♿ RAMP (1:12)</text>`);

    // South Entrance
    const sEntX = mpx(36), sEntY = mpx(54), sEntW = mpx(8);
    elements.push(`<rect x="${sEntX}" y="${sEntY - 10}" width="${sEntW}" height="20" fill="#FFFFFF" stroke="none"/>`);
    elements.push(`<text x="${sEntX + sEntW / 2}" y="${sEntY + 25}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#047857">SOUTH PROMENADE ENTRANCE</text>`);

    // 4 PWD Parking bays
    for (let i = 0; i < 4; i++) {
      const pxBay = mpx(18 + i * 3.7), pyBay = mpx(54.5), pwBay = mpx(3.7), phBay = mpx(4.5);
      elements.push(`<rect x="${pxBay}" y="${pyBay}" width="${pwBay}" height="${phBay}" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.5"/>`);
      elements.push(`<text x="${pxBay + pwBay / 2}" y="${pyBay + phBay / 2 + 4}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8.5" font-weight="bold" fill="#0284C7">♿ PWD ${i + 1} (3.70m)</text>`);
    }

    // East Passenger Loading Zone
    const elzX = mpx(76.5), elzY = mpx(26), elzW = mpx(3.2), elzH = mpx(8);
    elements.push(`<rect x="${elzX}" y="${elzY}" width="${elzW}" height="${elzH}" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.5"/>`);
    elements.push(`<text x="${elzX + elzW / 2}" y="${elzY + elzH / 2}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" font-weight="bold" fill="#0284C7" transform="rotate(90 ${elzX + elzW / 2} ${elzY + elzH / 2})">♿ PWD DROP-OFF (3.6m x 8.0m)</text>`);
  }

  // Dimension Callouts in emerald green
  elements.push(`<line x1="${bx}" y1="${by - 25}" x2="${bx + bw}" y2="${by - 25}" stroke="#047857" stroke-width="2"/>`);
  elements.push(`<text x="${bx + bw / 2}" y="${by - 32}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#047857">72.00 m OVERALL BUILDING WIDTH</text>`);

  elements.push(`<line x1="${bx - 25}" y1="${by}" x2="${bx - 25}" y2="${by + bh}" stroke="#047857" stroke-width="2"/>`);
  elements.push(`<text x="${bx - 32}" y="${by + bh / 2}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#047857" transform="rotate(-90 ${bx - 32} ${by + bh / 2})">48.00 m OVERALL DEPTH</text>`);

  // Title Block in corner
  const titleText = floor === 0
    ? 'LEVEL 1: GROUND FLOOR · GRAND CONCOURSE & HYPERMARKET'
    : floor === 1
      ? 'LEVEL 2: SECOND FLOOR · FASHION BOUTIQUES & CYBERZONE'
      : 'LEVEL 3: THIRD FLOOR · FOOD HALL & CINEMA COMPLEX';

  elements.push(`<rect x="${MALL_PLAN_WIDTH - 460}" y="${MALL_PLAN_HEIGHT - 65}" width="440" height="50" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" rx="4"/>`);
  elements.push(`<text x="${MALL_PLAN_WIDTH - 445}" y="${MALL_PLAN_HEIGHT - 45}" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#0F172A">${esc(titleText)}</text>`);
  elements.push(`<text x="${MALL_PLAN_WIDTH - 445}" y="${MALL_PLAN_HEIGHT - 26}" font-family="system-ui, sans-serif" font-size="10" fill="#0284C7">♿ BATAS PAMBANSA BLG. 344 COMPLIANT · SCALE 1:200</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MALL_PLAN_WIDTH} ${MALL_PLAN_HEIGHT}" width="${MALL_PLAN_WIDTH}" height="${MALL_PLAN_HEIGHT}">${elements.join('\n')}</svg>`;
}

export function mallFloorSvgDataUrl(floor: FloorId): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(renderMallFloorSvg(floor));
}

// ----------------------------------------------------------------------------
// BUILDING OBJECT FOR WORKSPACE & APPLICATION
// ----------------------------------------------------------------------------
export const mallFloors: BuildingFloor[] = [
  {
    id: 0,
    name: 'Level 1: Ground Floor',
    short: '1F',
    description: 'Grand Concourse, Hypermarket, Retail Boutiques, PWD Parking & Drop-off',
    image: mallFloorSvgDataUrl(0),
    width: MALL_PLAN_WIDTH,
    height: MALL_PLAN_HEIGHT,
    metersPerPixel: MALL_METERS_PER_PIXEL,
  },
  {
    id: 1,
    name: 'Level 2: Second Floor',
    short: '2F',
    description: 'Fashion Boutiques, Cyberzone & Gadget Hub, Mezzanine Skybridge',
    image: mallFloorSvgDataUrl(1),
    width: MALL_PLAN_WIDTH,
    height: MALL_PLAN_HEIGHT,
    metersPerPixel: MALL_METERS_PER_PIXEL,
  },
  {
    id: 2,
    name: 'Level 3: Third Floor',
    short: '3F',
    description: 'Grand Gourmet Food Hall, Cinema Complex, Family Amusement & Clinic',
    image: mallFloorSvgDataUrl(2),
    width: MALL_PLAN_WIDTH,
    height: MALL_PLAN_HEIGHT,
    metersPerPixel: MALL_METERS_PER_PIXEL,
  },
];

export const mallBuilding: Building = {
  id: 'grand-mall',
  name: 'Regional Shopping Mall (BP 344 Compliant)',
  sample: true,
  status: 'ready',
  updatedAt: '2026-11-11T23:00:00.000Z',
  graph: mallGraph,
  floors: mallFloors,
};
