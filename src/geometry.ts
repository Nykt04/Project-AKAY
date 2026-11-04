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
  // Fast path: by convexity, if one rectangle contains both endpoints, the segment is covered.
  for (let i = 0; i < areas.length; i++) {
    if (contains(areas[i], from) && contains(areas[i], to)) return true;
  }
  const eps = 1e-7;
  const minX = Math.min(from[0], to[0]) - eps, maxX = Math.max(from[0], to[0]) + eps;
  const minY = Math.min(from[1], to[1]) - eps, maxY = Math.max(from[1], to[1]) + eps;
  const local = areas.filter(a => a.x + a.width >= minX && a.x <= maxX && a.y + a.height >= minY && a.y <= maxY);
  const inside = (point: Point) => local.some(area => contains(area, point));
  if (!inside(from) || !inside(to)) return false;
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const crossings = [0, 1];
  for (const area of local) {
    if (dx !== 0) for (const x of [area.x, area.x + area.width]) {
      const t = (x - from[0]) / dx;
      if (t > 0 && t < 1) crossings.push(t);
    }
    if (dy !== 0) for (const y of [area.y, area.y + area.height]) {
      const t = (y - from[1]) / dy;
      if (t > 0 && t < 1) crossings.push(t);
    }
  }
  crossings.sort((a, b) => a - b);
  for (let i = 1; i < crossings.length; i++) {
    if (crossings[i] - crossings[i - 1] < 1e-9) continue;
    const t = (crossings[i - 1] + crossings[i]) / 2;
    if (!inside([from[0] + t * dx, from[1] + t * dy])) return false;
  }
  return true;
}

/** Geometry-free research graphs are allowed; a mapped floor must have its map. */
export function pointIsMapped(graph: HotelGraph, node: MapNode): boolean {
  if (graph.clearanceGrids) {
    const grid = graph.clearanceGrids[node.floor];
    if (!grid || !clearSegment(grid, [node.x, node.y], [node.x, node.y])) return false;
  }
  if (graph.walkableAreas) {
    const areas = graph.walkableAreas[node.floor];
    if (!areas || !segmentIsWalkable([node.x, node.y], [node.x, node.y], areas)) return false;
  }
  return true;
}

export function geometryErrors(graph: HotelGraph): string[] {
  if (!graph.walkableAreas && !graph.clearanceGrids) return [];
  const nodes = Object.fromEntries(graph.nodes.map(node => [node.id, node]));
  const mappedCache = new Map<string, boolean>();
  const isMapped = (node: MapNode) => {
    let ok = mappedCache.get(node.id);
    if (ok === undefined) { ok = pointIsMapped(graph, node); mappedCache.set(node.id, ok); }
    return ok;
  };
  const errors: string[] = [];
  for (const edge of graph.edges) {
    if (!edge.traversable || !nodes[edge.from] || !nodes[edge.to]) continue;
    const from = nodes[edge.from], to = nodes[edge.to];
    if (!isMapped(from) || !isMapped(to)) {
      errors.push(`Path endpoint is outside mapped walkable space: ${edge.id}`);
      continue;
    }
    if (from.floor !== to.floor) {
      if (!['stairs', 'elevator'].includes(edge.kind) || from.category !== edge.kind || to.category !== edge.kind
        || (graph.walkableAreas && (from.x !== to.x || from.y !== to.y))) errors.push(`Invalid floor transition: ${edge.id}`);
      continue;
    }
    const points = edgeGeometry(edge, nodes);
    const areas = graph.walkableAreas?.[from.floor], grid = graph.clearanceGrids?.[from.floor];
    for (let i = 1; i < points.length; i++) {
      if ((areas && !segmentIsWalkable(points[i - 1], points[i], areas)) || (grid && !clearSegment(grid, points[i - 1], points[i]))) {
        errors.push(`Path leaves mapped walkable space: ${edge.id}, segment ${i}`);
      }
    }
  }
  return errors;
}
