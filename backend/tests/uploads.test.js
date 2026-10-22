import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

const storageApi = {
  createSignedUploadUrl: vi.fn(),
  getPublicUrl: vi.fn((path) => ({ data: { publicUrl: `https://cdn.test/${path}` } })),
};
vi.mock('../src/config/supabase.js', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn() }, storage: { from: () => storageApi } },
}));
vi.mock('../src/repositories/profiles.repository.js', () => ({
  findProfileById: vi.fn(),
  updateProfile: vi.fn(),
  findAvatarsByIds: vi.fn(),
}));
vi.mock('../src/repositories/preferences.repository.js', () => ({
  findPreferencesByUserId: vi.fn(),
  upsertPreferences: vi.fn(),
}));
vi.mock('../src/repositories/events.repository.js', () => ({
  insertEvent: vi.fn(),
  findEventById: vi.fn(),
  updateEvent: vi.fn(),
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById, updateProfile } from '../src/repositories/profiles.repository.js';
import { findPreferencesByUserId } from '../src/repositories/preferences.repository.js';
import { insertEvent } from '../src/repositories/events.repository.js';
import { assertOwnPath } from '../src/services/storage.service.js';

const organizer = { id: 'org-1', email: 'o@becore.test', fullName: 'Org', role: 'organizer' };
const participant = { id: 'par-1', email: 'p@becore.test', fullName: 'Par', role: 'participant' };

function loginAs(profile) {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: profile.id } }, error: null });
  findProfileById.mockResolvedValue(profile);
}
const auth = (req) => req.set('Authorization', 'Bearer t');

beforeEach(() => {
  vi.clearAllMocks();
  storageApi.createSignedUploadUrl.mockResolvedValue({ data: { token: 'tok' }, error: null });
  findPreferencesByUserId.mockResolvedValue(null);
});

describe('assertOwnPath', () => {
  it('acepta solo archivos dentro de la carpeta del usuario', () => {
    expect(() => assertOwnPath('u1', 'u1/foto.webp')).not.toThrow();
    for (const path of ['u2/foto.webp', 'u1/a/b.webp', 'u1/', 'foto.webp', 'u1/..']) {
      expect(() => assertOwnPath('u1', path)).toThrowError(expect.objectContaining({ status: 403 }));
    }
  });
});

describe('POST /me/avatar/upload-url', () => {
  it('cada usuario recibe una ruta dentro de su propia carpeta', async () => {
    loginAs(participant);
    const res = await auth(request(app).post('/api/v1/me/avatar/upload-url')).send({ contentType: 'image/webp' });
    expect(res.status).toBe(201);
    expect(res.body.data.path).toMatch(/^par-1\/[\w-]+\.webp$/);
    expect(res.body.data.token).toBe('tok');
  });

  it('rechaza tipos que no son imagen → 400', async () => {
    loginAs(participant);
    const res = await auth(request(app).post('/api/v1/me/avatar/upload-url')).send({ contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(storageApi.createSignedUploadUrl).not.toHaveBeenCalled();
  });
});

describe('PUT /me/avatar', () => {
  it('no deja referenciar el archivo de otro usuario → 403', async () => {
    loginAs(participant);
    const res = await auth(request(app).put('/api/v1/me/avatar')).send({ path: 'otro-usuario/foto.webp' });
    expect(res.status).toBe(403);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('guarda la URL pública de su propia foto', async () => {
    loginAs(participant);
    updateProfile.mockResolvedValue({ ...participant, avatarUrl: 'https://cdn.test/par-1/foto.webp' });
    const res = await auth(request(app).put('/api/v1/me/avatar')).send({ path: 'par-1/foto.webp' });
    expect(res.status).toBe(200);
    expect(updateProfile).toHaveBeenCalledWith('par-1', { avatarUrl: 'https://cdn.test/par-1/foto.webp' });
  });
});

describe('PUT /me/avatar-preset', () => {
  it('rechaza un avatar fuera de la lista → 400', async () => {
    loginAs(participant);
    expect((await auth(request(app).put('/api/v1/me/avatar-preset')).send({ preset: 'hacker' })).status).toBe(400);
  });

  it('elegir un avatar reemplaza la foto subida', async () => {
    loginAs(participant);
    updateProfile.mockResolvedValue({ ...participant, avatarPreset: 'goleador' });
    const res = await auth(request(app).put('/api/v1/me/avatar-preset')).send({ preset: 'goleador' });
    expect(res.status).toBe(200);
    expect(updateProfile).toHaveBeenCalledWith('par-1', { avatarPreset: 'goleador', avatarUrl: null });
  });
});

describe('portadas de evento', () => {
  it('un participante no puede pedir subir una portada → 403', async () => {
    loginAs(participant);
    const res = await auth(request(app).post('/api/v1/events/cover-upload-url')).send({ contentType: 'image/webp' });
    expect(res.status).toBe(403);
  });

  it('el organizador sube dentro de su carpeta', async () => {
    loginAs(organizer);
    const res = await auth(request(app).post('/api/v1/events/cover-upload-url')).send({ contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.data.path).toMatch(/^org-1\/[\w-]+\.png$/);
  });

  it('con withOriginal también da la URL del original, al lado de la portada (P8)', async () => {
    loginAs(organizer);
    const res = await auth(request(app).post('/api/v1/events/cover-upload-url')).send({ contentType: 'image/webp', withOriginal: true });
    expect(res.status).toBe(201);
    const { path, original } = res.body.data;
    expect(path).toMatch(/^org-1\/[\w-]+\.webp$/);
    expect(original.path).toBe(path.replace('.webp', '-original.webp'));
    expect(original).toHaveProperty('token');
    const plain = await auth(request(app).post('/api/v1/events/cover-upload-url')).send({ contentType: 'image/webp' });
    expect(plain.body.data).not.toHaveProperty('original');
  });

  it('crear un evento con la portada de otro organizador → 403', async () => {
    loginAs(organizer);
    const body = {
      title: 'Partido',
      category: 'sport',
      location: 'Cancha norte',
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      capacity: 10,
      coverPath: 'otro-organizador/portada.webp',
    };
    const res = await auth(request(app).post('/api/v1/events')).send(body);
    expect(res.status).toBe(403);
    expect(insertEvent).not.toHaveBeenCalled();
  });
});
