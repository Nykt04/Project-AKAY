import type { HotelGraph, RouteMode, RouteResult } from './types';
import { geometryErrors, pointIsMapped } from './geometry';

type QueueEntry = { id: string; distance: number };
const compare = (a: QueueEntry, b: QueueEntry) => {
  const diff = a.distance - b.distance;
  return Math.abs(diff) > 1e-12 ? diff : (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
};

/**
 * ============================================================================
 * [ALGORITHM: PRIORITY QUEUE (BINARY MIN-HEAP)]
 * Always pops the unvisited node with the smallest cumulative distance in O(log V).
 * Ties are broken deterministically by node ID.
 * ============================================================================
 */
class RouteQueue {
  private entries: QueueEntry[] = [];
  push(entry: QueueEntry) {
    const items = this.entries;
    let index = items.length;
    items.push(entry);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (compare(items[parent], entry) <= 0) break;
      items[index] = items[parent];
      index = parent;
    }
    items[index] = entry;
  }
  pop(): QueueEntry | undefined {
    const items = this.entries, first = items[0], last = items.pop();
    if (items.length && last) {
      let index = 0;
      while (index * 2 + 1 < items.length) {
        let child = index * 2 + 1;
        if (child + 1 < items.length && compare(items[child + 1], items[child]) < 0) child++;
        if (compare(last, items[child]) <= 0) break;
        items[index] = items[child];
        index = child;
      }
      items[index] = last;
    }
    return first;
  }
}

const validationCache = new WeakMap<HotelGraph, { sig: string; errors: string[] }>();

function graphSignature(graph: HotelGraph): string {
  let s = `${graph.nodes.length}:${graph.edges.length}:`;
  for (let i = 0; i < graph.nodes.length; i++) {
    const n = graph.nodes[i];
    s += `${n.id},${n.floor},${n.x},${n.y},${n.category ?? ''};`;
  }
  for (let i = 0; i < graph.edges.length; i++) {
    const e = graph.edges[i];
    s += `${e.id},${e.from},${e.to},${e.distance},${e.kind},${e.traversable ? 1 : 0}`;
    if (e.via?.length) for (let j = 0; j < e.via.length; j++) s += `,${e.via[j][0]}_${e.via[j][1]}`;
    s += ';';
  }
  if (graph.walkableAreas) s += `W:${Object.keys(graph.walkableAreas).join(',')};`;
  if (graph.clearanceGrids) {
    s += 'G:';
    for (const [k, g] of Object.entries(graph.clearanceGrids)) {
      let sum = 0;
      for (let i = 0; i < g.cells.length; i++) sum = (sum * 31 + g.cells[i]) | 0;
      s += `${k}:${g.width}x${g.height}:${g.imageWidth}x${g.imageHeight}:${sum},`;
    }
  }
  return s;
}

export function validateGraph(graph: HotelGraph): string[] {
  const sig = graphSignature(graph);
  const cached = validationCache.get(graph);
  if (cached && cached.sig === sig) return cached.errors;
  const ids = new Set<string>(), edgeIds = new Set<string>(), errors: string[] = [];
  for (const node of graph.nodes) {
    if (ids.has(node.id)) errors.push(`Duplicate node: ${node.id}`);
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) errors.push(`Invalid coordinates: ${node.id}`);
    ids.add(node.id);
  }
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) errors.push(`Duplicate edge: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push(`Missing endpoint: ${edge.id}`);
    if (!Number.isFinite(edge.distance) || edge.distance < 0) errors.push(`Invalid distance: ${edge.id}`);
    if (edge.via?.some(p => !Array.isArray(p) || p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) {
      errors.push(`Invalid via coordinates: ${edge.id}`);
    }
  }
  const result = [...errors, ...geometryErrors(graph)];
  validationCache.set(graph, { sig, errors: result });
  return result;
}

/** One settled node in a Dijkstra run, recorded only when a trace array is supplied. */
export interface TraceStep {
  node: string;
  distance: number;
  relaxed: { node: string; edgeId: string; distance: number }[];
}

/**
 * ============================================================================
 * CORE DIJKSTRA ALGORITHM & ROUTE DECISION-MAKING ENGINE
 * ============================================================================
 *
 * Computes the optimal path through a multi-floor facility graph.
 *
 * DECISION-MAKING MATRIX:
 * 1. Mode Selection ('shortest' vs 'accessible'):
 *    - 'shortest':   Optimizes purely for metric distance (meters). Allows stairs
 *                    and connections not certified as step-free.
 *    - 'accessible': Strictly prunes stairs (kind === 'stairs') and any edge
 *                    where accessible !== true. Restricts movement to elevators,
 *                    ramps, and level corridors.
 * 2. Unreviewed & Safety Gating:
 *    - Unreviewed AI-detected connections (reviewed !== true) are excluded
 *      when obstacle clearance grids are present (fail-closed safety).
 * 3. Terminal Room Shortcut Barrier:
 *    - Private rooms and facilities cannot be used as intermediate transit corridors.
 *      Once entered, expansion stops unless the room was the starting point.
 * 4. Priority Queue Tie-Breaking:
 *    - Floating-point distances are compared with a 1e-12 epsilon. Ties are broken
 *      alphabetically by node ID for deterministic, reproducible paths.
 *
 * USAGE IN THE APP:
 * - src/App.tsx: Called in compute() for both 'shortest' and 'accessible' modes
 *   whenever start/destination change, giving real-time comparison.
 * - src/DijkstraPlayback.tsx: Called with a `trace` accumulator to step through
 *   the algorithm visually in the Research View.
 * - src/scenarios.ts: Evaluated against regression suites to verify invariants.
 */
export function findRoute(
  graph: HotelGraph,
  start: string,
  end: string,
  mode: RouteMode,
  trace?: TraceStep[]
): RouteResult {
  const started = performance.now();
  const result: RouteResult = {
    mode,
    status: 'invalid',
    nodeIds: [],
    edgeIds: [],
    distance: null,
    computationMs: 0,
    visitedNodes: 0,
  };
  const finish = (patch: Partial<RouteResult>) => ({
    ...result,
    ...patch,
    computationMs: performance.now() - started,
  });

  const nodes = new Map(graph.nodes.map(n => [n.id, n]));
  const startNode = nodes.get(start);
  const endNode = nodes.get(end);

  // ==========================================================================
  // [DECISION 1: PRE-FLIGHT GRAPH & OBSTACLE VALIDATION]
  // Rejects missing endpoints, points on walls/obstacles, or invalid geometry.
  // ==========================================================================
  if (!startNode || !endNode) {
    return finish({ message: 'Choose a starting point and destination from the building directory.' });
  }

  // DECISION: Reject locations placed directly on walls/obstacles or unmapped regions
  if (graph.clearanceGrids && (!pointIsMapped(graph, startNode) || !pointIsMapped(graph, endNode))) {
    return finish({
      message: 'A selected location is on an obstacle or has no verified floor map. Correct its position before routing.',
    });
  }

  // DECISION: Pre-flight graph geometry and topology validation
  if (validateGraph(graph).length) {
    return finish({ message: 'The map contains invalid connections.' });
  }

  // ==========================================================================
  // [DECISION 2: CONSTRAINT FILTERING (ACCESSIBLE VS. SHORTEST)]
  // Builds the adjacency list and prunes blocked or inaccessible edges.
  // ==========================================================================
  const adjacency = new Map(graph.nodes.map(n => [n.id, [] as { next: string; edgeId: string; distance: number }[]]));

  for (const edge of graph.edges) {
    // 1. Filter out closed or un-traversable connections
    if (!edge.traversable || edge.reviewed === false) continue;

    // 2. Filter unreviewed connections when floor obstacle mask is active (safety gate)
    if (graph.clearanceGrids && edge.reviewed !== true) continue;

    // 3. DECISION: Accessible route vs Shortest route filter
    //    If mode is 'accessible', exclude stairs and uncertified non-accessible paths.
    if (mode === 'accessible' && (!edge.accessible || edge.kind === 'stairs')) {
      continue;
    }

    // Bidirectional edge mapping
    adjacency.get(edge.from)!.push({ next: edge.to, edgeId: edge.id, distance: edge.distance });
    adjacency.get(edge.to)!.push({ next: edge.from, edgeId: edge.id, distance: edge.distance });
  }

  // ==========================================================================
  // [ALGORITHM: DIJKSTRA SHORTEST-PATH SEARCH LOOP]
  // ==========================================================================
  const distances = new Map(graph.nodes.map(n => [n.id, Infinity]));
  const previous = new Map<string, { node: string; edge: string }>();
  const settled = new Set<string>();
  const queue = new RouteQueue();

  // Initialize start node
  distances.set(start, 0);
  queue.push({ id: start, distance: 0 });

  while (true) {
    // Pop the unvisited node with the smallest known distance (O(log V))
    const current = queue.pop();
    if (!current) break; // Queue exhausted

    const { id, distance } = current;

    // Discard stale priority queue entries (lazy deletion)
    if (settled.has(id) || distance !== distances.get(id)) continue;

    // Mark node as settled (shortest distance is mathematically finalized)
    settled.add(id);

    // Record step if research telemetry trace was requested
    const step: TraceStep | undefined = trace ? { node: id, distance, relaxed: [] } : undefined;
    if (step) trace!.push(step);

    // Target reached: break early, shortest path to 'end' is guaranteed
    if (id === end) break;

    // ========================================================================
    // [DECISION 3: ROOM SHORTCUT BARRIER]
    // Rooms are destinations, NEVER intermediate corridors.
    // ========================================================================
    if (id !== start && nodes.get(id)?.category === 'room') continue;

    // ========================================================================
    // [DECISION 4: EDGE RELAXATION & DISTANCE UPDATE]
    // Updates neighbor distance if (current distance + edge weight) is shorter.
    // ========================================================================
    for (const edge of adjacency.get(id)!) {
      if (settled.has(edge.next)) continue;

      const candidate = distance + edge.distance;

      // Update shortest path if candidate is strictly shorter (accounting for 1e-12 float epsilon)
      if (candidate < distances.get(edge.next)! - 1e-12) {
        distances.set(edge.next, candidate);
        previous.set(edge.next, { node: id, edge: edge.edgeId });
        queue.push({ id: edge.next, distance: candidate });
        step?.relaxed.push({ node: edge.next, edgeId: edge.edgeId, distance: candidate });
      }
    }
  }

  // ==========================================================================
  // [ALGORITHM: OUTCOME EVALUATION & PATH RECONSTRUCTION (BACKTRACKING)]
  // ==========================================================================
  if (!settled.has(end)) {
    return finish({
      status: 'unreachable',
      visitedNodes: settled.size,
      message:
        mode === 'accessible'
          ? 'No accessible route connects these locations in this map.'
          : 'No public route connects these locations in this map.',
    });
  }

  // Backtrack from destination to origin using recorded predecessor pointers
  const nodeIds = [end];
  const edgeIds: string[] = [];
  let cursor = end;

  while (cursor !== start) {
    const p = previous.get(cursor)!;
    nodeIds.push(p.node);
    edgeIds.push(p.edge);
    cursor = p.node;
  }

  nodeIds.reverse();
  edgeIds.reverse();

  return finish({
    status: 'found',
    nodeIds,
    edgeIds,
    distance: distances.get(end)!,
    visitedNodes: settled.size,
  });
}
