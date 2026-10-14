export type FloorId = number;
export type PathKind = 'corridor' | 'stairs' | 'ramp' | 'elevator';
export type RouteMode = 'shortest' | 'accessible';
export interface MapNode { id: string; name: string; floor: FloorId; x: number; y: number; labelX?: number; labelY?: number; facility?: boolean; category?: 'facility' | 'reception' | 'dining' | 'restroom' | 'stairs' | 'elevator' | 'lounge' | 'conference' | 'room' | 'fitness' | 'entrance'; }
export interface Edge { id: string; from: string; to: string; distance: number; kind: PathKind; accessible: boolean; traversable: boolean; reviewed?: boolean; via?: [number, number][]; }
export interface ClearanceGrid { width: number; height: number; imageWidth: number; imageHeight: number; cells: number[]; }
export interface WalkableArea { name: string; x: number; y: number; width: number; height: number; }
export interface HotelGraph { nodes: MapNode[]; edges: Edge[]; walkableAreas?: Record<FloorId, WalkableArea[]>; clearanceGrids?: Record<FloorId, ClearanceGrid>; }
export interface RouteResult { mode: RouteMode; status: 'found' | 'unreachable' | 'invalid'; nodeIds: string[]; edgeIds: string[]; distance: number | null; computationMs: number; visitedNodes: number; message?: string; }
