import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

vi.mock('../src/config/supabase.js', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('../src/repositories/profiles.repository.js', () => ({
  findProfileById: vi.fn(),
  updateProfile: vi.fn(),
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById, updateProfile } from '../src/repositories/profiles.repository.js';

const mockProfile = {
  id: 'user-uuid',
  email: 'test@becore.test',
  fullName: 'Test User',
  role: 'participant',
  createdAt: '2026-10-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/v1/me', () => {
  it('sin token → 401', async () => {
    const res = await request(app).get('/api/v1/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('token inválido → 401', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });
    const res = await request(app).get('/api/v1/me').set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
  });

  it('token válido → 200 con perfil', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } }, error: null });
    findProfileById.mockResolvedValue(mockProfile);
    const res = await request(app).get('/api/v1/me').set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@becore.test');
  });
});

describe('PATCH /api/v1/me', () => {
  it('nombre de 1 letra → 400 VALIDATION_ERROR', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } }, error: null });
    findProfileById.mockResolvedValue(mockProfile);
    const res = await request(app)
      .patch('/api/v1/me')
      .set('Authorization', 'Bearer valid-token')
      .send({ fullName: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('nombre válido → 200 con perfil actualizado', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } }, error: null });
    findProfileById.mockResolvedValue(mockProfile);
    updateProfile.mockResolvedValue({ ...mockProfile, fullName: 'Nuevo Nombre' });
    const res = await request(app)
      .patch('/api/v1/me')
      .set('Authorization', 'Bearer valid-token')
      .send({ fullName: 'Nuevo Nombre' });
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Nuevo Nombre');
  });
});
