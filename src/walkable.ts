import type { FloorId, WalkableArea } from './types';
import { civicWalkableAreas } from './civicPlan';

export const walkableAreas: Record<FloorId, WalkableArea[]> = civicWalkableAreas;
