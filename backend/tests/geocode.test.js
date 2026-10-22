import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { createGeocoder } from '../src/services/geocode.service.js';
import { coordinatesTogether, createEventSchema, updateEventSchema } from '../src/schemas/events.schemas.js';

vi.mock('../src/config/supabase.js', () => ({ supabaseAdmin: { auth: { getUser: vi.fn() } } }));
vi.mock('../src/repositories/profiles.repository.js', () => ({ findProfileById: vi.fn(), updateProfile: vi.fn() }));
vi.mock('../src/services/geocode.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  searchPlaces: vi.fn(),
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';
import { searchPlaces } from '../src/services/geocode.service.js';

const nominatimRow = { display_name: 'Parque Lleras, El Poblado, Medellín', lat: '6.2087', lon: '-75.5678' };

function fakeFetch(rows = [nominatimRow], ok = true) {
  return vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => rows }));
}

describe('geocodificador (Nominatim simulado)', () => {
  it('manda la consulta limitada a Colombia, con User-Agent del proyecto, y devuelve lat/lng numéricos', async () => {
    const fetchImpl = fakeFetch();
    const { search } = createGeocoder({ fetchImpl, sleep: async () => {} });
    const results = await search('Parque Lleras');

    expect(results).toEqual([{ label: 'Parque Lleras, El Poblado, Medellín', lat: 6.2087, lng: -75.5678 }]);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url.hostname).toBe('nominatim.openstreetmap.org');
    expect(url.searchParams.get('countrycodes')).toBe('co');
    expect(url.searchParams.get('q')).toBe('Parque Lleras');
    expect(options.headers['User-Agent']).toMatch(/BeCore/);
  });

  it('cachea: la misma búsqueda (sin importar mayúsculas ni espacios) no vuelve a salir a internet', async () => {
    const fetchImpl = fakeFetch();
    const { search } = createGeocoder({ fetchImpl, sleep: async () => {} });
    await search('Parque Lleras');
    await search('  parque   LLERAS ');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('la caché vence a las 24 horas', async () => {
    let clock = 1_000_000;
    const fetchImpl = fakeFetch();
    const { search } = createGeocoder({ fetchImpl, now: () => clock, sleep: async () => {} });
    await search('Parque Lleras');
    clock += 25 * 3600 * 1000;
    await search('Parque Lleras');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('máximo 1 petición por segundo: espera entre búsquedas distintas', async () => {
    let clock = 1_000_000;
    const sleep = vi.fn(async (ms) => {
      clock += ms;
    });
    const { search } = createGeocoder({ fetchImpl: fakeFetch(), now: () => clock, sleep });
    await search('uno');
    await search('dos');
    expect(sleep).toHaveBeenCalledOnce();
    expect(sleep.mock.calls[0][0]).toBeGreaterThanOrEqual(1000);
  });

  it('peticiones simultáneas salen en fila, no a la vez', async () => {
    let clock = 1_000_000;
    const sleep = vi.fn(async (ms) => {
      clock += ms;
    });
    const times = [];
    const fetchImpl = vi.fn(async () => {
      times.push(clock);
      return { ok: true, json: async () => [] };
    });
    const { search } = createGeocoder({ fetchImpl, now: () => clock, sleep });
    await Promise.all([search('a1'), search('b2'), search('c3')]);
    expect(times).toHaveLength(3);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(1000);
    expect(times[2] - times[1]).toBeGreaterThanOrEqual(1000);
  });

  it('si Nominatim falla → 502 GEOCODE_UNAVAILABLE y no se guarda en caché', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = fakeFetch([], false);
    const { search } = createGeocoder({ fetchImpl, sleep: async () => {} });
    await expect(search('Parque Lleras')).rejects.toMatchObject({ status: 502, code: 'GEOCODE_UNAVAILABLE' });
    await expect(search('Parque Lleras')).rejects.toMatchObject({ status: 502 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('descarta resultados sin coordenadas válidas', async () => {
    const { search } = createGeocoder({ fetchImpl: fakeFetch([nominatimRow, { display_name: 'raro', lat: 'x', lon: 'y' }]), sleep: async () => {} });
    expect(await search('algo')).toHaveLength(1);
  });
});

function loginAs(role) {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  findProfileById.mockResolvedValue({ id: 'u1', email: 'u@becore.test', fullName: 'U', role });
}
const get = (path) => request(app).get(path).set('Authorization', 'Bearer t');

describe('GET /api/v1/geocode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sin token → 401', async () => expect((await request(app).get('/api/v1/geocode?q=lleras')).status).toBe(401));

  it('participante → 403', async () => {
    loginAs('participant');
    expect((await get('/api/v1/geocode?q=lleras')).status).toBe(403);
    expect(searchPlaces).not.toHaveBeenCalled();
  });

  it('consulta muy corta o ausente → 400', async () => {
    loginAs('organizer');
    expect((await get('/api/v1/geocode?q=ab')).status).toBe(400);
    expect((await get('/api/v1/geocode')).status).toBe(400);
  });

  it('organizador → 200 con los lugares', async () => {
    loginAs('organizer');
    searchPlaces.mockResolvedValue([{ label: 'Parque Lleras', lat: 6.2, lng: -75.5 }]);
    const res = await get('/api/v1/geocode?q=Parque%20Lleras');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ label: 'Parque Lleras', lat: 6.2, lng: -75.5 }]);
    expect(searchPlaces).toHaveBeenCalledWith('Parque Lleras');
  });

  it('Nominatim caído → 502', async () => {
    loginAs('organizer');
    const { AppError } = await import('../src/utils/app-error.js');
    searchPlaces.mockRejectedValue(new AppError(502, 'GEOCODE_UNAVAILABLE', 'No pudimos buscar esa dirección ahora.'));
    const res = await get('/api/v1/geocode?q=Parque%20Lleras');
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('GEOCODE_UNAVAILABLE');
  });
});

describe('coordenadas del evento (Zod)', () => {
  const base = {
    title: 'Partido',
    category: 'sport',
    location: 'Cancha norte',
    startsAt: new Date(Date.now() + 86_400_000).toISOString(),
    capacity: 10,
  };
  const ok = (body) => createEventSchema.safeParse(body).success;

  it('sin coordenadas es válido (son opcionales)', () => expect(ok(base)).toBe(true));
  it('acepta latitud y longitud de Medellín', () => expect(ok({ ...base, latitude: 6.2442, longitude: -75.5812 })).toBe(true));
  it('acepta los límites exactos', () => {
    expect(ok({ ...base, latitude: 90, longitude: 180 })).toBe(true);
    expect(ok({ ...base, latitude: -90, longitude: -180 })).toBe(true);
  });
  it('rechaza latitud o longitud fuera de rango', () => {
    expect(ok({ ...base, latitude: 90.0001, longitude: 0 })).toBe(false);
    expect(ok({ ...base, latitude: -91, longitude: 0 })).toBe(false);
    expect(ok({ ...base, latitude: 0, longitude: 180.5 })).toBe(false);
    expect(ok({ ...base, latitude: 0, longitude: -181 })).toBe(false);
  });
  it('rechaza una sola coordenada', () => {
    expect(ok({ ...base, latitude: 6.2 })).toBe(false);
    expect(ok({ ...base, longitude: -75.5 })).toBe(false);
    expect(ok({ ...base, latitude: 6.2, longitude: null })).toBe(false);
  });
  it('rechaza textos en lugar de números', () => expect(ok({ ...base, latitude: '6.2', longitude: '-75.5' })).toBe(false));
  it('al editar, null en las dos quita la ubicación', () => {
    expect(updateEventSchema.safeParse({ latitude: null, longitude: null }).success).toBe(true);
    expect(updateEventSchema.safeParse({ latitude: null }).success).toBe(false);
    expect(updateEventSchema.safeParse({ latitude: 6.2, longitude: -75.5 }).success).toBe(true);
  });
  it('coordinatesTogether', () => {
    expect(coordinatesTogether({})).toBe(true);
    expect(coordinatesTogether({ latitude: 1, longitude: 2 })).toBe(true);
    expect(coordinatesTogether({ latitude: 1 })).toBe(false);
  });
});
