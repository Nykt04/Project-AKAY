export type FloorId = 0 | 1 | 2;
export type PathKind = 'corridor' | 'stairs' | 'ramp' | 'elevator';
export type RouteMode = 'shortest' | 'accessible';
export interface MapNode { id: string; name: string; floor: FloorId; x: number; y: number; labelX?: number; labelY?: number; facility?: boolean; category?: 'reception' | 'dining' | 'restroom' | 'stairs' | 'elevator' | 'lounge' | 'conference' | 'room' | 'fitness' | 'entrance'; }
export interface Edge { id: string; from: string; to: string; distance: number; kind: PathKind; accessible: boolean; traversable: boolean; via?: [number, number][]; }
export interface WalkableArea { name: string; x: number; y: number; width: number; height: number; }
export interface HotelGraph { nodes: MapNode[]; edges: Edge[]; walkableAreas?: Record<FloorId, WalkableArea[]>; }
export interface RouteResult { mode: RouteMode; status: 'found' | 'unreachable' | 'invalid'; nodeIds: string[]; edgeIds: string[]; distance: number | null; computationMs: number; visitedNodes: number; message?: string; }
