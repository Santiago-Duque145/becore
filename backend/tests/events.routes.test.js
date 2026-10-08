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
  insertEvent: vi.fn(),
  findEventById: vi.fn(),
  updateEvent: vi.fn(),
  listEvents: vi.fn(),
}));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  findUserAttendances: vi.fn(),
  listConfirmedUserIds: vi.fn().mockResolvedValue([]),
}));
vi.mock('../src/services/notifications.service.js', () => ({
  notify: vi.fn(),
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';
import * as repo from '../src/repositories/events.repository.js';
import { findUserAttendances } from '../src/repositories/attendance.repository.js';

const organizer = { id: 'org-1', email: 'o@becore.test', fullName: 'Org', role: 'organizer' };
const participant = { id: 'par-1', email: 'p@becore.test', fullName: 'Par', role: 'participant' };
const EVENT_ID = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const future = (h = 48) => new Date(Date.now() + h * 3600 * 1000).toISOString();

const validBody = () => ({
  title: 'Partido 5v5',
  category: 'sport',
  location: 'Cancha Estadio',
  startsAt: future(),
  capacity: 12,
});

const storedEvent = (over = {}) => ({
  id: EVENT_ID,
  title: 'Partido 5v5',
  description: '',
  category: 'sport',
  location: 'Cancha Estadio',
  startsAt: future(),
  endsAt: null,
  capacity: 12,
  confirmedCount: 0,
  status: 'draft',
  cancelledAt: null,
  organizerId: 'org-1',
  organizer: { id: 'org-1', fullName: 'Org' },
  createdAt: future(0),
  updatedAt: future(0),
  ...over,
});

function loginAs(profile) {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: profile.id } }, error: null });
  findProfileById.mockResolvedValue(profile);
}
const auth = (req) => req.set('Authorization', 'Bearer token');

beforeEach(() => {
  vi.clearAllMocks();
  findUserAttendances.mockResolvedValue([]);
});

describe('POST /api/v1/events', () => {
  it('organizador crea evento válido → 201', async () => {
    loginAs(organizer);
    repo.insertEvent.mockResolvedValue(storedEvent());
    const res = await auth(request(app).post('/api/v1/events')).send(validBody());
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ id: EVENT_ID, status: 'draft', availableSpots: 12 });
  });

  it('cupo 0 → 400 VALIDATION_ERROR por campo', async () => {
    loginAs(organizer);
    const res = await auth(request(app).post('/api/v1/events')).send({ ...validBody(), capacity: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('capacity');
    expect(repo.insertEvent).not.toHaveBeenCalled();
  });

  it('cupo 1001 y fecha pasada → 400', async () => {
    loginAs(organizer);
    const tooBig = await auth(request(app).post('/api/v1/events')).send({ ...validBody(), capacity: 1001 });
    expect(tooBig.status).toBe(400);
    const past = await auth(request(app).post('/api/v1/events')).send({ ...validBody(), startsAt: future(-5) });
    expect(past.status).toBe(400);
  });

  it('participante → 403', async () => {
    loginAs(participant);
    const res = await auth(request(app).post('/api/v1/events')).send(validBody());
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(repo.insertEvent).not.toHaveBeenCalled();
  });

  it('sin token → 401', async () => {
    const res = await request(app).post('/api/v1/events').send(validBody());
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/events/:id', () => {
  it('evento ajeno → 403', async () => {
    loginAs({ ...organizer, id: 'org-2' });
    repo.findEventById.mockResolvedValue(storedEvent({ status: 'published' }));
    const res = await auth(request(app).patch(`/api/v1/events/${EVENT_ID}`)).send({ title: 'Otro título' });
    expect(res.status).toBe(403);
  });

  it('cupo bajo confirmados → 409 CAPACITY_BELOW_CONFIRMED', async () => {
    loginAs(organizer);
    repo.findEventById.mockResolvedValue(storedEvent({ status: 'published', confirmedCount: 8 }));
    const res = await auth(request(app).patch(`/api/v1/events/${EVENT_ID}`)).send({ capacity: 5 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CAPACITY_BELOW_CONFIRMED');
  });

  it('body vacío → 400', async () => {
    loginAs(organizer);
    const res = await auth(request(app).patch(`/api/v1/events/${EVENT_ID}`)).send({});
    expect(res.status).toBe(400);
  });
});

describe('transiciones', () => {
  it('cancelar y luego publicar → 409 de transición/estado', async () => {
    loginAs(organizer);
    repo.findEventById.mockResolvedValue(storedEvent({ status: 'published' }));
    repo.updateEvent.mockResolvedValue(storedEvent({ status: 'cancelled' }));
    const cancel = await auth(request(app).post(`/api/v1/events/${EVENT_ID}/cancel`));
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('cancelled');

    repo.findEventById.mockResolvedValue(storedEvent({ status: 'cancelled' }));
    const publish = await auth(request(app).post(`/api/v1/events/${EVENT_ID}/publish`));
    expect(publish.status).toBe(409);
  });

  it('publicar un evento ya publicado → 409 INVALID_EVENT_TRANSITION', async () => {
    loginAs(organizer);
    repo.findEventById.mockResolvedValue(storedEvent({ status: 'published' }));
    const res = await auth(request(app).post(`/api/v1/events/${EVENT_ID}/publish`));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_EVENT_TRANSITION');
  });
});

describe('GET /api/v1/events', () => {
  it('lista con meta y valida query', async () => {
    loginAs(participant);
    repo.listEvents.mockResolvedValue({ rows: [storedEvent({ status: 'published' })], total: 1 });
    const res = await auth(request(app).get('/api/v1/events?category=sport&page=1'));
    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ total: 1, page: 1, pageSize: 12 });
    const bad = await auth(request(app).get('/api/v1/events?category=otra'));
    expect(bad.status).toBe(400);
  });

  it('participante no ve borrador ajeno por id → 404', async () => {
    loginAs(participant);
    repo.findEventById.mockResolvedValue(storedEvent({ status: 'draft' }));
    const res = await auth(request(app).get(`/api/v1/events/${EVENT_ID}`));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('EVENT_NOT_FOUND');
  });

  it('id inválido → 400', async () => {
    loginAs(participant);
    const res = await auth(request(app).get('/api/v1/events/no-es-uuid'));
    expect(res.status).toBe(400);
  });
});
