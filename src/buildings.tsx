import { createContext, useContext, useMemo } from 'react';
import { hotel, floors as sampleFloors } from './hotel';
import { floorSvgDataUrl, METERS_PER_PIXEL, PLAN_HEIGHT, PLAN_WIDTH } from './civicPlan';
import { mallBuilding } from './mallPlan';
import { campusBuilding } from './campusPlan';
import type { HotelGraph, MapNode, Edge } from './types';

export { mallBuilding } from './mallPlan';
export { campusBuilding } from './campusPlan';

export interface BuildingFloor {
  id: number; name: string; short: string; description: string;
  image: string; width: number; height: number; metersPerPixel?: number;
}
export interface Building {
  id: string; name: string; floors: BuildingFloor[]; graph: HotelGraph;
  status: 'draft' | 'ready'; updatedAt: string; sample?: boolean;
}
export const sampleBuilding: Building = {
  id: 'linden-sample', name: 'Civic Center', sample: true, status: 'ready', updatedAt: '', graph: hotel,
  floors: sampleFloors.map(f => ({ ...f, image: floorSvgDataUrl(f.id), width: PLAN_WIDTH, height: PLAN_HEIGHT, metersPerPixel: METERS_PER_PIXEL })),
};

export const BUILT_IN_SAMPLES: readonly Building[] = [mallBuilding, campusBuilding];
const SAMPLE_ALIASES: Record<string, readonly string[]> = {
  [mallBuilding.id]: ['mall', 'grand-mall'],
  [campusBuilding.id]: ['campus'],
};

export function sampleEstParam(building: Building): string | undefined {
  if (building.id === sampleBuilding.id) return undefined;
  return SAMPLE_ALIASES[building.id]?.[0] ?? building.id;
}

export function sampleMatchesEst(est: string | undefined, building: Building): boolean {
  if (est === building.id) return true;
  if (building.id === sampleBuilding.id) return !est || est === 'sample';
  return !!est && (SAMPLE_ALIASES[building.id]?.includes(est) ?? false);
}

export function resolveBuiltInSample(est: string | undefined, deletedIds: readonly string[]): Building | undefined {
  if (!est) return undefined;
  return BUILT_IN_SAMPLES.find(b => !deletedIds.includes(b.id) && sampleMatchesEst(est, b));
}
export function buildingData(building: Building) {
  return {
    building, hotel: building.graph, floors: building.floors,
    nodeById: Object.fromEntries(building.graph.nodes.map(n => [n.id,n])) as Record<string,MapNode>,
    edgeById: Object.fromEntries(building.graph.edges.map(e => [e.id,e])) as Record<string,Edge>,
    facilities: building.graph.nodes.filter(n => n.facility),
    floorName: (id: number) => building.floors.find(f => f.id === id)?.name ?? 'Unknown floor',
  };
}
export const BuildingContext = createContext(sampleBuilding);
export const useBuilding = () => {
  const building = useContext(BuildingContext);
  return useMemo(() => buildingData(building), [building]);
};

const openDatabase = () => new Promise<IDBDatabase>((resolve,reject) => {
  const request = indexedDB.open('indoor-wayfinding',1);
  request.onupgradeneeded = () => request.result.createObjectStore('buildings',{keyPath:'id'});
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
export async function loadBuildings(): Promise<Building[]> {
  const db = await openDatabase();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('buildings','readonly'), request = tx.objectStore('buildings').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}
export async function saveBuilding(building: Building) {
  const db = await openDatabase();
  return new Promise<void>((resolve,reject) => {
    const tx = db.transaction('buildings','readwrite');
    tx.objectStore('buildings').put(building);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Could not save this map.')); };
  });
}
export async function deleteBuilding(id: string) {
  const db = await openDatabase();
  return new Promise<void>((resolve,reject) => {
    const tx = db.transaction('buildings','readwrite');
    tx.objectStore('buildings').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Could not delete this facility.')); };
  });
}
