import type { Edge, HotelGraph, MapNode, WalkableArea } from './types';
import { clearSegment } from './scan';

export type Point = [number, number];

/** One source of truth for the centerline tested by routing and drawn by the map. */
export function edgeGeometry(edge: Edge, nodes: Record<string, MapNode>): Point[] {
  const from = nodes[edge.from], to = nodes[edge.to];
  return [[from.x, from.y], ...(edge.via ?? []), [to.x, to.y]];
}

function contains(area: WalkableArea, [x, y]: Point) {
  const epsilon = 1e-7;
  return x >= area.x - epsilon && x <= area.x + area.width + epsilon
    && y >= area.y - epsilon && y <= area.y + area.height + epsilon;
}

/** Exact segment coverage by a union of axis-aligned walkable rectangles. */
export function segmentIsWalkable(from: Point, to: Point, areas: WalkableArea[]): boolean {
  const inside = (point: Point) => areas.some(area => contains(area, point));
  if (!inside(from) || !inside(to)) return false;
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const crossings = new Set([0, 1]);
  for (const area of areas) {
    if (dx !== 0) for (const x of [area.x, area.x + area.width]) {
      const t = (x - from[0]) / dx;
      if (t > 0 && t < 1) crossings.add(t);
    }
    if (dy !== 0) for (const y of [area.y, area.y + area.height]) {
      const t = (y - from[1]) / dy;
      if (t > 0 && t < 1) crossings.add(t);
    }
  }
  const intervals = [...crossings].sort((a, b) => a - b);
  return intervals.slice(1).every((end, i) => {
    const t = (intervals[i] + end) / 2;
    return inside([from[0] + t * dx, from[1] + t * dy]);
  });
}

export function geometryErrors(graph: HotelGraph): string[] {
  if (!graph.walkableAreas && !graph.clearanceGrids) return [];
  const nodes = Object.fromEntries(graph.nodes.map(node => [node.id, node]));
  const errors: string[] = [];
  for (const edge of graph.edges) {
    if (!edge.traversable || !nodes[edge.from] || !nodes[edge.to]) continue;
    const from = nodes[edge.from], to = nodes[edge.to];
    if (from.floor !== to.floor) {
      if (!['stairs', 'elevator'].includes(edge.kind) || from.category !== edge.kind || to.category !== edge.kind
        || (graph.walkableAreas && (from.x !== to.x || from.y !== to.y))) errors.push(`Invalid floor transition: ${edge.id}`);
      continue;
    }
    const points = edgeGeometry(edge, nodes);
    for (let i = 1; i < points.length; i++) {
      const areas = graph.walkableAreas?.[from.floor], grid = graph.clearanceGrids?.[from.floor];
      if ((areas && !segmentIsWalkable(points[i - 1], points[i], areas)) || (grid && !clearSegment(grid,points[i-1],points[i]))) {
        errors.push(`Path leaves mapped walkable space: ${edge.id}, segment ${i}`);
      }
    }
  }
  return errors;
}
