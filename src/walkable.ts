import type { FloorId, WalkableArea } from './types';

// Traced from the demonstration raster images in normalized 1000 × 760 coordinates.
// These conservative centerline envelopes deliberately exclude room walls and furniture.
// Door openings differ between the three generated images; do not share their envelopes.
const area = (name: string, x: number, y: number, width: number, height: number): WalkableArea => ({ name, x, y, width, height });
const corridors = () => [
  area('Upper public corridor', 130, 235, 665, 45),
  area('East public corridor', 745, 235, 45, 225),
  area('Lower public corridor', 245, 425, 545, 30),
  area('Lower west passage', 245, 425, 55, 245),
  area('Stairwell approach and left flight', 375, 195, 30, 60),
  area('Elevator door and cabin', 530, 195, 35, 60),
];
export const walkableAreas: Record<FloorId, WalkableArea[]> = {
  0: [
    ...corridors(),
    area('West steps passage', 140, 245, 40, 210),
    area('Reception north opening', 160, 440, 35, 80),
    area('Reception east doorway', 170, 485, 90, 30),
    area('Restroom door', 178, 210, 22, 48),
    area('Restroom interior approach', 178, 125, 22, 90),
    area('Restroom destination', 145, 125, 55, 20),
    area('Restaurant doorway', 775, 200, 30, 60),
    area('Restaurant foyer', 780, 190, 55, 25),
    area('Lounge north opening', 400, 435, 25, 55),
    area('Lounge foyer', 400, 475, 60, 20),
  ],
  1: [
    ...corridors(),
    area('Conference double doorway', 205, 190, 35, 70),
    area('Room 101 north doorway', 200, 435, 25, 85),
    area('Room 101 corridor approach', 210, 435, 55, 15),
    area('Room 102 north-east doorway', 610, 435, 20, 80),
    area('Reading room step threshold', 728, 195, 25, 65),
    area('Reading room foyer', 735, 195, 35, 20),
  ],
  2: [
    ...corridors(),
    area('Fitness studio doorway', 215, 190, 25, 70),
    area('Suite 201 east doorway', 200, 480, 65, 20),
    area('Suite 201 foyer', 200, 485, 18, 40),
    area('Suite 202 north doorway', 405, 435, 25, 55),
    area('Suite 202 foyer', 415, 480, 35, 25),
    area('Terrace lounge doorway', 755, 195, 20, 65),
    area('Terrace lounge foyer', 760, 195, 40, 15),
  ],
};
