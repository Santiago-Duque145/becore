import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../src/repositories/events.repository.js', () => ({ listPublicEventIdsBetween: vi.fn() }));
vi.mock('../src/repositories/attendance.repository.js', () => ({ countConfirmedPeople: vi.fn() }));

import app from '../src/app.js';
import { listPublicEventIdsBetween } from '../src/repositories/events.repository.js';
import { countConfirmedPeople } from '../src/repositories/attendance.repository.js';
import {
  CACHE_TTL_MS,
  getPublicStats,
  resetPublicStatsCache,
  weekBounds,
} from '../src/services/public-stats.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  resetPublicStatsCache();
  listPublicEventIdsBetween.mockResolvedValue(['e1', 'e2', 'e3']);
  countConfirmedPeople.mockResolvedValue(7);
});

describe('GET /api/v1/public/stats', () => {
  it('responde 200 sin token, solo con los dos conteos y Cache-Control de 5 min', async () => {
    const res = await request(app).get('/api/v1/public/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { eventsThisWeek: 3, confirmedPeople: 7 } });
    expect(res.headers['cache-control']).toBe('public, max-age=300');
    expect(countConfirmedPeople).toHaveBeenCalledWith(['e1', 'e2', 'e3']);
  });

  it('devuelve ceros cuando no hay eventos esta semana', async () => {
    listPublicEventIdsBetween.mockResolvedValue([]);
    countConfirmedPeople.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/public/stats');
    expect(res.body).toEqual({ data: { eventsThisWeek: 0, confirmedPeople: 0 } });
  });

  it('un error de la base termina en 500 INTERNAL_ERROR y no se guarda en caché', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    listPublicEventIdsBetween.mockRejectedValueOnce(new Error('db caída'));
    const fail = await request(app).get('/api/v1/public/stats');
    expect(fail.status).toBe(500);
    expect(fail.body.error.code).toBe('INTERNAL_ERROR');

    const ok = await request(app).get('/api/v1/public/stats');
    expect(ok.status).toBe(200);
    expect(listPublicEventIdsBetween).toHaveBeenCalledTimes(2);
  });
});

describe('getPublicStats (caché en memoria)', () => {
  const t0 = Date.parse('2026-10-21T15:00:00.000Z');

  it('reutiliza el resultado durante 5 minutos y vuelve a consultar después', async () => {
    await getPublicStats(t0);
    await getPublicStats(t0 + CACHE_TTL_MS - 1);
    expect(listPublicEventIdsBetween).toHaveBeenCalledTimes(1);

    countConfirmedPeople.mockResolvedValue(9);
    expect(await getPublicStats(t0 + CACHE_TTL_MS)).toEqual({ eventsThisWeek: 3, confirmedPeople: 9 });
    expect(listPublicEventIdsBetween).toHaveBeenCalledTimes(2);
  });

  it('las peticiones simultáneas comparten una sola consulta', async () => {
    const [a, b] = await Promise.all([getPublicStats(t0), getPublicStats(t0)]);
    expect(a).toEqual(b);
    expect(listPublicEventIdsBetween).toHaveBeenCalledTimes(1);
  });
});

describe('weekBounds (semana de lunes a lunes en hora de Bogotá)', () => {
  it('un miércoles cubre del lunes 05:00 UTC al lunes siguiente', () => {
    expect(weekBounds(Date.parse('2026-10-21T15:00:00.000Z'))).toEqual({
      fromIso: '2026-10-19T05:00:00.000Z',
      toIso: '2026-10-26T05:00:00.000Z',
    });
  });

  it('el domingo a las 23:30 de Bogotá (lunes 04:30 UTC) sigue en la semana anterior', () => {
    expect(weekBounds(Date.parse('2026-10-26T04:30:00.000Z')).fromIso).toBe('2026-10-19T05:00:00.000Z');
  });

  it('el lunes a las 00:00 de Bogotá empieza la semana nueva', () => {
    expect(weekBounds(Date.parse('2026-10-26T05:00:00.000Z')).fromIso).toBe('2026-10-26T05:00:00.000Z');
  });
});
