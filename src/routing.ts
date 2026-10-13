import type { HotelGraph, RouteMode, RouteResult } from './types';
import { geometryErrors } from './geometry';

export function validateGraph(graph: HotelGraph): string[] {
  const ids = new Set<string>(), edgeIds = new Set<string>(), errors: string[] = [];
  for (const node of graph.nodes) { if (ids.has(node.id)) errors.push(`Duplicate node: ${node.id}`); ids.add(node.id); }
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) errors.push(`Duplicate edge: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push(`Missing endpoint: ${edge.id}`);
    if (!Number.isFinite(edge.distance) || edge.distance < 0) errors.push(`Invalid distance: ${edge.id}`);
  }
  return [...errors, ...geometryErrors(graph)];
}

/** Distances are meters, not time or accessibility penalties. Edges are bidirectional. */
export function findRoute(graph: HotelGraph, start: string, end: string, mode: RouteMode): RouteResult {
  const started = performance.now();
  const result: RouteResult = { mode, status: 'invalid', nodeIds: [], edgeIds: [], distance: null, computationMs: 0, visitedNodes: 0 };
  const finish = (patch: Partial<RouteResult>) => ({ ...result, ...patch, computationMs: performance.now() - started });
  if (!graph.nodes.some(n => n.id === start) || !graph.nodes.some(n => n.id === end)) return finish({ message: 'Choose a starting point and destination from the hotel directory.' });
  if (validateGraph(graph).length) return finish({ message: 'The map contains invalid connections.' });
  const adjacency = new Map(graph.nodes.map(n => [n.id, [] as { next: string; edgeId: string; distance: number }[]]));
  for (const edge of graph.edges) {
    if (!edge.traversable || (mode === 'accessible' && (!edge.accessible || edge.kind === 'stairs'))) continue;
    adjacency.get(edge.from)!.push({ next: edge.to, edgeId: edge.id, distance: edge.distance });
    adjacency.get(edge.to)!.push({ next: edge.from, edgeId: edge.id, distance: edge.distance });
  }
  const distances = new Map(graph.nodes.map(n => [n.id, Infinity]));
  const previous = new Map<string, { node: string; edge: string }>();
  const settled = new Set<string>();
  distances.set(start, 0);
  while (true) {
    // Stable ID tie-break makes equal-cost demonstrations reproducible.
    const current = [...distances].filter(([id]) => !settled.has(id)).sort((a,b) => a[1]-b[1] || a[0].localeCompare(b[0]))[0];
    if (!current || current[1] === Infinity) break;
    const [id, distance] = current;
    settled.add(id);
    if (id === end) break;
    for (const edge of adjacency.get(id)!) {
      if (settled.has(edge.next)) continue;
      const candidate = distance + edge.distance;
      if (candidate < distances.get(edge.next)!) { distances.set(edge.next, candidate); previous.set(edge.next, { node: id, edge: edge.edgeId }); }
    }
  }
  if (!settled.has(end)) return finish({ status: 'unreachable', visitedNodes: settled.size, message: mode === 'accessible' ? 'No accessible route connects these locations in the sample map.' : 'No public route connects these locations in the sample map.' });
  const nodeIds = [end], edgeIds: string[] = [];
  let cursor = end;
  while (cursor !== start) { const p = previous.get(cursor)!; nodeIds.unshift(p.node); edgeIds.unshift(p.edge); cursor = p.node; }
  return finish({ status: 'found', nodeIds, edgeIds, distance: distances.get(end)!, visitedNodes: settled.size });
}
