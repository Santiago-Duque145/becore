import { describe, it, expect, vi } from 'vitest';
import { queryKeys } from './query-keys.js';
import { prefetchInitialRoute } from './startup-prefetch.js';
import { descubreRequest } from '../pages/descubre/descubre-filters.js';

const fakeDeps = (session = { access_token: 't' }) => ({
  loadPage: vi.fn(),
  getSession: vi.fn().mockResolvedValue(session),
  prefetch: vi.fn(),
});
const keys = (deps) => deps.prefetch.mock.calls.map(([options]) => options.queryKey);

describe('descubreRequest: la misma petición en la página y en la precarga', () => {
  it('sin filtros: próximos eventos y "Para ti"', () => {
    expect(descubreRequest(new URLSearchParams(''))).toEqual({ filters: { scope: 'upcoming' }, showParaTi: true });
  });
  it('con categoría, búsqueda o mapa no hay "Para ti"', () => {
    expect(descubreRequest(new URLSearchParams('cat=sport'))).toEqual({ filters: { scope: 'upcoming', category: 'sport' }, showParaTi: false });
    expect(descubreRequest(new URLSearchParams('q=cine')).showParaTi).toBe(false);
    expect(descubreRequest(new URLSearchParams('vista=mapa'))).toEqual({ filters: { scope: 'upcoming', pageSize: 50 }, showParaTi: false });
  });
});

describe('prefetchInitialRoute', () => {
  it('en /descubre con sesión: baja la página y pide lista y "Para ti" con las claves de la página', async () => {
    const deps = fakeDeps();
    expect(await prefetchInitialRoute({ pathname: '/descubre', search: '' }, deps)).toBe(true);
    expect(deps.loadPage).toHaveBeenCalledOnce();
    expect(keys(deps)).toEqual([queryKeys.events({ scope: 'upcoming' }), queryKeys.recommendedEvents]);
    expect(deps.prefetch.mock.calls[0][1]).toBe('infinite');
  });

  it('respeta los filtros de la URL (sin "Para ti" si hay categoría)', async () => {
    const deps = fakeDeps();
    await prefetchInitialRoute({ pathname: '/descubre', search: '?cat=culture' }, deps);
    expect(keys(deps)).toEqual([queryKeys.events({ scope: 'upcoming', category: 'culture' })]);
  });

  it('sin sesión no pide nada a la API (un 401 cerraría la sesión)', async () => {
    const deps = fakeDeps(null);
    expect(await prefetchInitialRoute({ pathname: '/descubre', search: '' }, deps)).toBe(false);
    expect(deps.prefetch).not.toHaveBeenCalled();
  });

  it('en otras rutas no hace nada', async () => {
    const deps = fakeDeps();
    expect(await prefetchInitialRoute({ pathname: '/perfil', search: '' }, deps)).toBe(false);
    expect(deps.loadPage).not.toHaveBeenCalled();
    expect(deps.getSession).not.toHaveBeenCalled();
  });
});
