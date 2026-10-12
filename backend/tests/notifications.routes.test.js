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
vi.mock('../src/repositories/notifications.repository.js', () => ({
  listInbox: vi.fn(),
  countUnread: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  insertNotification: vi.fn(),
  markNotificationSent: vi.fn(),
  markNotificationError: vi.fn(),
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';
import * as repo from '../src/repositories/notifications.repository.js';

const user = { id: 'u1', email: 'p@becore.test', fullName: 'Par', role: 'participant' };
const ID = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const auth = (req) => req.set('Authorization', 'Bearer token');
const item = (over = {}) => ({
  id: ID,
  type: 'event_updated',
  subject: 'Cambios en Partido',
  message: 'El partido ahora es a las 7:00 p. m.',
  eventId: 'e1',
  appointmentId: null,
  readAt: null,
  createdAt: '2026-10-12T10:00:00.000Z',
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: user.id } }, error: null });
  findProfileById.mockResolvedValue(user);
});

describe('avisos de la app', () => {
  it('sin sesión → 401', async () => {
    expect((await request(app).get('/api/v1/notifications')).status).toBe(401);
  });

  it('GET /notifications: lista del usuario con meta.unread', async () => {
    repo.listInbox.mockResolvedValue([item()]);
    repo.countUnread.mockResolvedValue(1);
    const res = await auth(request(app).get('/api/v1/notifications?limit=5'));
    expect(res.status).toBe(200);
    expect(repo.listInbox).toHaveBeenCalledWith('u1', 5);
    expect(res.body).toEqual({ data: [item()], meta: { unread: 1 } });
  });

  it('GET /notifications/unread-count', async () => {
    repo.countUnread.mockResolvedValue(3);
    const res = await auth(request(app).get('/api/v1/notifications/unread-count'));
    expect(res.body.data).toEqual({ count: 3 });
  });

  it('POST /notifications/:id/read marca la propia', async () => {
    repo.markRead.mockResolvedValue(item({ readAt: '2026-10-12T11:00:00.000Z' }));
    const res = await auth(request(app).post(`/api/v1/notifications/${ID}/read`));
    expect(res.status).toBe(200);
    expect(repo.markRead).toHaveBeenCalledWith('u1', ID);
    expect(res.body.data.readAt).toBeTruthy();
  });

  it('POST /notifications/:id/read de otro usuario o inexistente → 404', async () => {
    repo.markRead.mockResolvedValue(null);
    const res = await auth(request(app).post(`/api/v1/notifications/${ID}/read`));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('id inválido → 400', async () => {
    const res = await auth(request(app).post('/api/v1/notifications/abc/read'));
    expect(res.status).toBe(400);
  });

  it('POST /notifications/read-all', async () => {
    repo.markAllRead.mockResolvedValue(4);
    const res = await auth(request(app).post('/api/v1/notifications/read-all'));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ updated: 4 });
  });
});
