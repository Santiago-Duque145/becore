import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

vi.mock('../src/config/supabase.js', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn() } },
}));
vi.mock('../src/repositories/profiles.repository.js', () => ({
  findProfileById: vi.fn(),
  updateProfile: vi.fn(),
}));
vi.mock('../src/repositories/events.repository.js', () => ({
  listRecommendationCandidates: vi.fn(),
  findEventById: vi.fn(),
}));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  findUserAttendances: vi.fn(),
  listConfirmedPreviewIds: vi.fn(),
  listConfirmedUserIds: vi.fn(),
}));
vi.mock('../src/repositories/preferences.repository.js', () => ({
  findPreferencesByUserId: vi.fn(),
}));
vi.mock('../src/services/notifications.service.js', () => ({ notify: vi.fn() }));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';
import * as repo from '../src/repositories/events.repository.js';
import { findUserAttendances } from '../src/repositories/attendance.repository.js';
import { findPreferencesByUserId } from '../src/repositories/preferences.repository.js';

const participant = { id: 'par-1', email: 'p@becore.test', fullName: 'Par', role: 'participant' };
const auth = (req) => req.set('Authorization', 'Bearer token');

beforeEach(() => {
  vi.clearAllMocks();
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: participant.id } }, error: null });
  findProfileById.mockResolvedValue(participant);
  findUserAttendances.mockResolvedValue([]);
});

describe('GET /api/v1/events/recommended', () => {
  it('sin sesión → 401', async () => {
    const res = await request(app).get('/api/v1/events/recommended');
    expect(res.status).toBe(401);
  });

  it('no se confunde con /events/:id y responde Event + reason', async () => {
    findPreferencesByUserId.mockResolvedValue({ categories: ['sport'], days: [], timeSlots: [], zone: null });
    repo.listRecommendationCandidates.mockResolvedValue([
      {
        id: 'e1',
        title: 'Partido',
        category: 'sport',
        location: 'Cancha',
        startsAt: '2030-10-31T13:00:00.000Z',
        capacity: 10,
        confirmedCount: 3,
        status: 'published',
        organizerId: 'org',
        organizer: { id: 'org', fullName: 'Org' },
      },
    ]);
    const res = await auth(request(app).get('/api/v1/events/recommended'));
    expect(res.status).toBe(200);
    expect(repo.findEventById).not.toHaveBeenCalled();
    expect(res.body.data).toEqual([expect.objectContaining({ id: 'e1', reason: 'Porque te gusta el deporte', availableSpots: 7 })]);
  });

  it('sin preferencias → lista vacía', async () => {
    findPreferencesByUserId.mockResolvedValue(null);
    const res = await auth(request(app).get('/api/v1/events/recommended?limit=3'));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta).toEqual({ emptyReason: 'no_preferences' }); // aditivo: data sigue siendo el arreglo
  });

  it('con resultados no agrega meta (el contrato de siempre)', async () => {
    findPreferencesByUserId.mockResolvedValue({ categories: ['sport'], days: [], timeSlots: [], zone: null });
    repo.listRecommendationCandidates.mockResolvedValue([
      { id: 'e1', title: 'P', category: 'sport', location: 'C', startsAt: '2030-10-31T13:00:00.000Z', capacity: 10, confirmedCount: 0, status: 'published', organizerId: 'o', organizer: { id: 'o' } },
    ]);
    const res = await auth(request(app).get('/api/v1/events/recommended'));
    expect(res.body).not.toHaveProperty('meta');
  });

  it('limit fuera de rango → 400', async () => {
    const res = await auth(request(app).get('/api/v1/events/recommended?limit=50'));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
