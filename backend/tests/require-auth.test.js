import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

vi.mock('../src/config/supabase.js', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn() } },
}));
vi.mock('../src/repositories/profiles.repository.js', () => ({
  findProfileById: vi.fn(),
  updateProfile: vi.fn(),
  completeOnboarding: vi.fn(),
}));
vi.mock('../src/repositories/preferences.repository.js', () => ({
  findPreferencesByUserId: vi.fn().mockResolvedValue(null),
  upsertPreferences: vi.fn(),
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';

const get = () => request(app).get('/api/v1/me').set('Authorization', 'Bearer token');

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
});

describe('requireAuth: 401 solo por sesión; los fallos de base son 500', () => {
  it('token inválido → 401 UNAUTHENTICATED', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });
    const res = await get();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('el perfil no existe → 401 UNAUTHENTICATED', async () => {
    findProfileById.mockResolvedValue(null);
    const res = await get();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('error de base al leer el perfil → 500 INTERNAL_ERROR con el formato de api.md, sin detalles internos', async () => {
    findProfileById.mockRejectedValue({ code: '42703', message: 'column profiles.gender does not exist' });
    const res = await get();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Algo salió mal, intenta de nuevo' } });
  });
});
