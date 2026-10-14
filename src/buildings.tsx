import { createContext, useContext } from 'react';
import { hotel, floors as sampleFloors } from './hotel';
import type { HotelGraph, MapNode, Edge } from './types';

export interface BuildingFloor {
  id: number; name: string; short: string; description: string;
  image: string; width: number; height: number; metersPerPixel?: number;
}
export interface Building {
  id: string; name: string; floors: BuildingFloor[]; graph: HotelGraph;
  status: 'draft' | 'ready'; updatedAt: string; sample?: boolean;
}
export const sampleBuilding: Building = {
  id: 'linden-sample', name: 'Linden Hotel', sample: true, status: 'ready', updatedAt: '', graph: hotel,
  floors: sampleFloors.map(f => ({ ...f, image: `/assets/floor-${f.id}.png`, width: 1000, height: 760 })),
};
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
export const useBuilding = () => buildingData(useContext(BuildingContext));

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
