import { useCallback, useEffect, useState } from 'react';
import type { Edge, HotelGraph, MapNode } from './types';

/**
 * Temporary service closures (e.g. an elevator out of order) entered by staff on this device.
 * They are stored per establishment in localStorage and only ever remove connections from routing.
 */
const key = (buildingId: string) => `wayfinding-closures:${buildingId}`;
const EVENT = 'wayfinding-closures-change';

export const closableKinds: Edge['kind'][] = ['elevator', 'ramp', 'stairs'];
export const closableEdges = (graph: HotelGraph) => graph.edges.filter(e => closableKinds.includes(e.kind) && e.traversable);

export function readClosures(buildingId: string): string[] {
  if (typeof window === 'undefined') return [];
  try { const value = JSON.parse(window.localStorage.getItem(key(buildingId)) ?? '[]'); return Array.isArray(value) ? value.filter(v => typeof v === 'string') : []; }
  catch { return []; }
}
export function writeClosures(buildingId: string, edgeIds: string[]) {
  if (typeof window === 'undefined') return;
  try { edgeIds.length ? window.localStorage.setItem(key(buildingId), JSON.stringify(edgeIds)) : window.localStorage.removeItem(key(buildingId)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: buildingId }));
}

export function useClosures(buildingId: string) {
  const [closed, setClosed] = useState<string[]>(() => readClosures(buildingId));
  useEffect(() => {
    setClosed(readClosures(buildingId));
    const sync = () => setClosed(readClosures(buildingId));
    window.addEventListener(EVENT, sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, [buildingId]);
  const update = useCallback((next: string[]) => writeClosures(buildingId, next), [buildingId]);
  return [closed, update] as const;
}

/** Returns a graph copy where closed connections are not traversable. Ids and geometry are unchanged. */
export function applyClosures(graph: HotelGraph, closed: readonly string[]): HotelGraph {
  if (!closed.length) return graph;
  const set = new Set(closed);
  return { ...graph, edges: graph.edges.map(e => set.has(e.id) ? { ...e, traversable: false } : e) };
}

const kindLabel: Record<string, string> = { elevator: 'Elevator', ramp: 'Ramp', stairs: 'Stairs' };
export function closureLabel(edge: Edge, nodeById: Record<string, MapNode>, floorName: (id: number) => string) {
  const a = nodeById[edge.from], b = nodeById[edge.to];
  if (!a || !b) return kindLabel[edge.kind] ?? edge.kind;
  if (a.floor !== b.floor) {
    const edgeName = a.name === b.name ? a.name : `${a.name} ↔ ${b.name}`;
    return `${edgeName} · ${floorName(a.floor)} ↔ ${floorName(b.floor)}`;
  }
  const place = [a, b].find(n => n.facility)?.name ?? `${a.name} ↔ ${b.name}`;
  return `${kindLabel[edge.kind] === 'Stairs' ? 'Steps' : kindLabel[edge.kind]} · ${place} (${floorName(a.floor)})`;
}
