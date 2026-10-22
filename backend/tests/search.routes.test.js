import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

vi.mock('../src/config/supabase.js', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn() } },
}));
vi.mock('../src/repositories/profiles.repository.js', () => ({
  findProfileById: vi.fn(),
  updateProfile: vi.fn(),
  findAvatarsByIds: vi.fn(async () => []),
}));
vi.mock('../src/repositories/events.repository.js', () => ({
  listEvents: vi.fn(),
  findEventById: vi.fn(),
}));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  findUserAttendances: vi.fn(async () => []),
  listConfirmedPreviewIds: vi.fn(async () => ({})),
  listConfirmedUserIds: vi.fn(),
}));
vi.mock('../src/services/notifications.service.js', () => ({ notify: vi.fn() }));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';
import * as repo from '../src/repositories/events.repository.js';
import * as searchRepo from '../src/repositories/search.repository.js';

const participant = { id: 'par-1', email: 'p@becore.test', fullName: 'Par', role: 'participant' };
const auth = (req) => req.set('Authorization', 'Bearer token');
const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const SEARCH_ID = '22222222-2222-4222-8222-222222222222';

const event = {
  id: EVENT_ID,
  title: 'Cine al aire libre',
  description: 'Trae tu cobija',
  category: 'culture',
  location: 'Parque de Belén',
  startsAt: '2030-11-02T23:00:00.000Z',
  capacity: 50,
  confirmedCount: 0,
  status: 'published',
  organizerId: 'org',
};

beforeEach(() => {
  vi.clearAllMocks();
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: participant.id } }, error: null });
  findProfileById.mockResolvedValue(participant);
  repo.listEvents.mockResolvedValue({ rows: [event], total: 1 });
});

describe('GET /api/v1/events/search', () => {
  it('sin sesión → 401', async () => {
    expect((await request(app).get('/api/v1/events/search?q=cine')).status).toBe(401);
  });

  it('q de menos de 2 letras o categoría inválida → 400', async () => {
    expect((await auth(request(app).get('/api/v1/events/search?q=a'))).status).toBe(400);
    expect((await auth(request(app).get('/api/v1/events/search'))).status).toBe(400);
    expect((await auth(request(app).get('/api/v1/events/search?q=cine&category=x'))).status).toBe(400);
  });

  it('no se confunde con /events/:id; con la IA apagada responde en modo clásico', async () => {
    const res = await auth(request(app).get('/api/v1/events/search?q=Belén&category=culture'));
    expect(res.status).toBe(200);
    expect(res.body.data.map((e) => e.id)).toEqual([EVENT_ID]);
    expect(res.body.data[0]).not.toHaveProperty('organizerId');
    expect(res.body.meta).toMatchObject({ mode: 'classic', total: 1 });
    expect(res.body.meta.searchId).toMatch(/^[0-9a-f-]{36}$/);
    expect(repo.listEvents).toHaveBeenCalledWith(expect.objectContaining({ scope: 'upcoming', category: 'culture' }));
    expect(repo.findEventById).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/events/search/:searchId/open', () => {
  it('204 y marca la búsqueda', async () => {
    const res = await auth(request(app).post(`/api/v1/events/search/${SEARCH_ID}/open`).send({ eventId: EVENT_ID }));
    expect(res.status).toBe(204);
    await new Promise((resolve) => setImmediate(resolve));
    expect(searchRepo.markSearchOpened).toHaveBeenCalledWith(SEARCH_ID, EVENT_ID);
  });

  it('ids inválidos → 400; sin sesión → 401', async () => {
    expect((await auth(request(app).post('/api/v1/events/search/x/open').send({ eventId: EVENT_ID }))).status).toBe(400);
    expect((await auth(request(app).post(`/api/v1/events/search/${SEARCH_ID}/open`).send({ eventId: 'x' }))).status).toBe(400);
    expect((await request(app).post(`/api/v1/events/search/${SEARCH_ID}/open`).send({ eventId: EVENT_ID })).status).toBe(401);
  });
});
