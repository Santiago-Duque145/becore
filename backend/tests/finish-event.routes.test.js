import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

vi.mock('../src/config/supabase.js', () => ({ supabaseAdmin: { auth: { getUser: vi.fn() } } }));
vi.mock('../src/repositories/profiles.repository.js', () => ({ findProfileById: vi.fn(), updateProfile: vi.fn() }));
vi.mock('../src/services/events.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  finishEvent: vi.fn(),
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';
import * as eventsService from '../src/services/events.service.js';
import { AppError } from '../src/utils/app-error.js';

const EVENT_ID = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const PATH = `/api/v1/events/${EVENT_ID}/finish`;

function loginAs(role) {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  findProfileById.mockResolvedValue({ id: 'u1', email: 'u@becore.test', fullName: 'U', role });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /events/:id/finish', () => {
  it('sin token → 401', async () => expect((await request(app).post(PATH)).status).toBe(401));

  it('participante → 403', async () => {
    loginAs('participant');
    expect((await request(app).post(PATH).set('Authorization', 'Bearer t')).status).toBe(403);
    expect(eventsService.finishEvent).not.toHaveBeenCalled();
  });

  it('id inválido → 400', async () => {
    loginAs('organizer');
    expect((await request(app).post('/api/v1/events/xx/finish').set('Authorization', 'Bearer t')).status).toBe(400);
  });

  it('organizador → 200 con el evento finalizado', async () => {
    loginAs('organizer');
    eventsService.finishEvent.mockResolvedValue({ id: EVENT_ID, status: 'finished' });
    const res = await request(app).post(PATH).set('Authorization', 'Bearer t');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('finished');
  });

  it('evento que no está en curso → 409', async () => {
    loginAs('organizer');
    eventsService.finishEvent.mockRejectedValue(new AppError(409, 'EVENT_NOT_IN_PROGRESS', 'Solo puedes finalizar un evento que está en curso'));
    const res = await request(app).post(PATH).set('Authorization', 'Bearer t');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EVENT_NOT_IN_PROGRESS');
  });
});
