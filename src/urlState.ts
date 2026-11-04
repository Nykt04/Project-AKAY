import type { RouteMode } from './types';

/** Shareable guest state: `?est=<building>&from=<node>&to=<node>&mode=shortest|accessible`. */
export interface RouteParams { est?: string; from?: string; to?: string; mode?: RouteMode; view?: 'guest' | 'research' }

export function readRouteParams(): RouteParams {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  const mode = p.get('mode');
  const viewParam = p.get('view');
  return {
    est: p.get('est') ?? undefined,
    from: p.get('from') ?? undefined,
    to: p.get('to') ?? undefined,
    mode: mode === 'shortest' || mode === 'accessible' ? mode : undefined,
    view: viewParam === 'research' ? 'research' : 'guest',
  };
}

export function routeUrl(params: RouteParams, origin = typeof window === 'undefined' ? '' : window.location.origin + window.location.pathname) {
  const p = new URLSearchParams();
  if (params.est) p.set('est', params.est);
  if (params.from) p.set('from', params.from);
  if (params.to) p.set('to', params.to);
  if (params.mode) p.set('mode', params.mode);
  if (params.view && params.view !== 'guest') p.set('view', params.view);
  const query = p.toString();
  return query ? `${origin}?${query}` : origin;
}

export function writeRouteParams(params: RouteParams) {
  if (typeof window === 'undefined') return;
  const next = routeUrl(params);
  if (next !== window.location.origin + window.location.pathname + window.location.search) window.history.replaceState(null, '', next + window.location.hash);
}
