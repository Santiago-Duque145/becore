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
vi.mock('../src/repositories/attendance.repository.js', () => ({
  findUserAttendances: vi.fn(),
  confirmAttendance: vi.fn(),
  cancelAttendance: vi.fn(),
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';
import * as repo from '../src/repositories/attendance.repository.js';
import { AppError } from '../src/utils/app-error.js';

const organizer = { id: 'org-1', email: 'o@becore.test', fullName: 'Org', role: 'organizer' };
const participant = { id: 'par-1', email: 'p@becore.test', fullName: 'Par', role: 'participant' };
const EVENT_ID = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const PATH = `/api/v1/events/${EVENT_ID}/attendance`;

function loginAs(profile) {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: profile.id } }, error: null });
  findProfileById.mockResolvedValue(profile);
}

beforeEach(() => vi.clearAllMocks());

describe('POST/DELETE /events/:id/attendance', () => {
  it('sin token → 401', async () => {
    expect((await request(app).post(PATH)).status).toBe(401);
    expect((await request(app).delete(PATH)).status).toBe(401);
  });

  it('organizador → 403', async () => {
    loginAs(organizer);
    const res = await request(app).post(PATH).set('Authorization', 'Bearer t');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(repo.confirmAttendance).not.toHaveBeenCalled();
  });

  it('id inválido → 400', async () => {
    loginAs(participant);
    const res = await request(app).post('/api/v1/events/no-es-uuid/attendance').set('Authorization', 'Bearer t');
    expect(res.status).toBe(400);
  });

  it('participante confirma → 201', async () => {
    loginAs(participant);
    repo.confirmAttendance.mockResolvedValue(4);
    const res = await request(app).post(PATH).set('Authorization', 'Bearer t');
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ confirmedCount: 4, myAttendance: { status: 'confirmed', checkedIn: false } });
  });

  it('evento lleno → 409 EVENT_FULL', async () => {
    loginAs(participant);
    repo.confirmAttendance.mockRejectedValue(new AppError(409, 'EVENT_FULL', 'El evento ya no tiene cupos'));
    const res = await request(app).post(PATH).set('Authorization', 'Bearer t');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EVENT_FULL');
  });

  it('activity: limit fuera de rango → 400', async () => {
    loginAs(participant);
    const base = `/api/v1/events/${EVENT_ID}/activity`;
    for (const limit of ['0', '21', 'abc']) {
      const res = await request(app).get(`${base}?limit=${limit}`).set('Authorization', 'Bearer t');
      expect(res.status).toBe(400);
    }
  });

  it('attendees: participante → 403', async () => {
    loginAs(participant);
    const res = await request(app).get(`/api/v1/events/${EVENT_ID}/attendees`).set('Authorization', 'Bearer t');
    expect(res.status).toBe(403);
  });

  it('check-in: body inválido → 400', async () => {
    loginAs(organizer);
    const res = await request(app)
      .patch(`/api/v1/events/${EVENT_ID}/attendees/${EVENT_ID}`)
      .set('Authorization', 'Bearer t')
      .send({ checkedIn: 'si' });
    expect(res.status).toBe(400);
  });

  it('participante cancela → 200', async () => {
    loginAs(participant);
    repo.cancelAttendance.mockResolvedValue(3);
    const res = await request(app).delete(PATH).set('Authorization', 'Bearer t');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ confirmedCount: 3, myAttendance: { status: 'cancelled', checkedIn: false } });
  });
});
