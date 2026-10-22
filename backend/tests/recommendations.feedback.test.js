import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { ATTRIBUTION_WINDOW_MS, computeAiMetrics, recordAction } from '../src/services/recommendations/feedback.js';
import { DEMO_ORGANIZER_EMAIL } from '../src/constants/demo.js';

vi.mock('../src/config/supabase.js', () => ({ supabaseAdmin: { auth: { getUser: vi.fn() } } }));
vi.mock('../src/repositories/profiles.repository.js', () => ({ findProfileById: vi.fn(), updateProfile: vi.fn() }));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';
import * as aiRepo from '../src/repositories/ai.repository.js';

const EVENT = '11111111-1111-4111-8111-111111111111';

describe('recordAction: clic y confirmado atribuidos al último "mostrado" (7 días)', () => {
  const repo = (shown, insert = vi.fn(async () => {})) => ({ findLatestShown: vi.fn(async () => shown), insertRecommendationEvents: insert });

  it('si no se le mostró en "Para ti" en 7 días, no registra nada', async () => {
    const r = repo(null);
    expect(await recordAction('u1', EVENT, 'clicked', { repo: r, now: () => 1_000_000_000_000 })).toBe(false);
    expect(r.insertRecommendationEvents).not.toHaveBeenCalled();
    expect(r.findLatestShown.mock.calls[0][2]).toBe(new Date(1_000_000_000_000 - ATTRIBUTION_WINDOW_MS).toISOString());
  });

  it('hereda la variante y el origen del "mostrado"', async () => {
    const r = repo({ variant: 'ai', source: 'gemini' });
    expect(await recordAction('u1', EVENT, 'confirmed', { repo: r })).toBe(true);
    expect(r.insertRecommendationEvents).toHaveBeenCalledWith([{ userId: 'u1', eventId: EVENT, variant: 'ai', action: 'confirmed', source: 'gemini' }]);
  });

  it('un segundo clic del mismo usuario y evento no es un error (índice único): devuelve false', async () => {
    const r = repo({ variant: 'rules', source: 'rules' }, vi.fn(async () => Promise.reject({ code: '23505' })));
    expect(await recordAction('u1', EVENT, 'clicked', { repo: r })).toBe(false);
  });

  it('otros errores de la base sí se propagan', async () => {
    const r = repo({ variant: 'rules', source: 'rules' }, vi.fn(async () => Promise.reject({ code: '42P01' })));
    await expect(recordAction('u1', EVENT, 'clicked', { repo: r })).rejects.toEqual({ code: '42P01' });
  });
});

describe('computeAiMetrics', () => {
  const row = (userId, eventId, variant, source, action, organizerEmail = 'org@real.co') => ({ userId, eventId, variant, source, action, organizerEmail });
  const rows = [
    // rules: 2 usuarios, 3 pares mostrados (u1·a se mostró dos veces), 1 clic, 1 confirmado
    row('u1', 'a', 'rules', 'rules', 'shown'),
    row('u1', 'a', 'rules', 'rules', 'shown'),
    row('u1', 'b', 'rules', 'rules', 'shown'),
    row('u2', 'a', 'rules', 'rules', 'shown'),
    row('u1', 'a', 'rules', 'rules', 'clicked'),
    row('u1', 'a', 'rules', 'rules', 'confirmed'),
    // ai: u3 vio c por plantilla y luego por Gemini; confirmó c (origen gemini)
    row('u3', 'c', 'ai', 'template', 'shown'),
    row('u3', 'c', 'ai', 'gemini', 'shown'),
    row('u3', 'd', 'ai', 'gemini', 'shown'),
    row('u3', 'c', 'ai', 'gemini', 'clicked'),
    row('u3', 'c', 'ai', 'gemini', 'confirmed'),
    // demo: no cuenta
    row('u3', 'demo', 'ai', 'gemini', 'shown', DEMO_ORGANIZER_EMAIL),
    row('u3', 'demo', 'ai', 'gemini', 'confirmed', DEMO_ORGANIZER_EMAIL),
  ];
  const ratings = [
    { userId: 'u1', eventId: 'a', stars: 4 },
    { userId: 'u3', eventId: 'c', stars: 5 },
    { userId: 'u2', eventId: 'a', stars: 1 }, // u2 no lo confirmó desde "Para ti": no cuenta
  ];
  const m = computeAiMetrics(rows, ratings);

  it('mostrados = pares distintos (usuario, evento); CTR y tasa de confirmación sobre esos pares', () => {
    expect(m.rules).toMatchObject({ users: 2, shown: 3, clicked: 1, confirmed: 1, ctr: 0.333, confirmRate: 0.333, avgRating: 4, ratings: 1 });
    expect(m.ai).toMatchObject({ users: 1, shown: 2, clicked: 1, confirmed: 1, ctr: 0.5, confirmRate: 0.5, avgRating: 5 });
  });

  it('dentro de "ai" separa lo que vino de Gemini de lo que salió de la plantilla', () => {
    expect(m.ai.bySource.gemini).toMatchObject({ shown: 2, clicked: 1, confirmed: 1 });
    expect(m.ai.bySource.template).toMatchObject({ shown: 1, clicked: 0, confirmed: 0, ctr: 0 });
  });

  it('excluye los eventos de demostración', () => {
    expect(m.excludedDemoRows).toBe(2);
  });

  it('sin datos: ceros y tasas en null (no "0 %")', () => {
    const empty = computeAiMetrics([], []);
    expect(empty.rules).toEqual({ users: 0, shown: 0, clicked: 0, confirmed: 0, ctr: null, confirmRate: null, avgRating: null, ratings: 0 });
  });
});

describe('rutas de IA4', () => {
  const as = (role) => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    findProfileById.mockResolvedValue({ id: 'u1', email: 'u@x.co', fullName: 'U', role });
  };
  beforeEach(() => vi.clearAllMocks());

  it('POST /recommendations/feedback: 204 aunque no se registre; 400 con datos inválidos', async () => {
    as('participant');
    const ok = await request(app).post('/api/v1/recommendations/feedback').set('Authorization', 'Bearer t').send({ eventId: EVENT, action: 'clicked' });
    expect(ok.status).toBe(204);
    expect(aiRepo.findLatestShown).toHaveBeenCalledWith('u1', EVENT, expect.any(String));
    const bad = await request(app).post('/api/v1/recommendations/feedback').set('Authorization', 'Bearer t').send({ eventId: 'x', action: 'confirmed' });
    expect(bad.status).toBe(400);
  });

  it('GET /admin/ai-metrics: solo organizadores', async () => {
    as('participant');
    expect((await request(app).get('/api/v1/admin/ai-metrics').set('Authorization', 'Bearer t')).status).toBe(403);
    as('organizer');
    const res = await request(app).get('/api/v1/admin/ai-metrics').set('Authorization', 'Bearer t');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('rules');
    expect(res.body.data.ai).toHaveProperty('bySource');
  });
});
