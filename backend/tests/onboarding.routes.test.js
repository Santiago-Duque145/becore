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
  findPreferencesByUserId: vi.fn(),
  upsertPreferences: vi.fn(),
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { completeOnboarding, findProfileById, updateProfile } from '../src/repositories/profiles.repository.js';
import { findPreferencesByUserId, upsertPreferences } from '../src/repositories/preferences.repository.js';

const pendingUser = {
  id: 'user-uuid',
  email: 'nuevo@becore.test',
  fullName: 'Nuevo Usuario',
  role: 'participant',
  onboardingCompletedAt: null,
  createdAt: '2026-10-11T00:00:00.000Z',
};
const completedUser = { ...pendingUser, onboardingCompletedAt: '2026-10-11T01:00:00.000Z' };

const answers = {
  role: 'organizer',
  interests: ['football', 'cinema', 'running'],
  days: ['weekends'],
  timeSlots: ['evening'],
  motivations: ['fun', 'meet_people'],
  zone: 'Belén',
};

// upsertPreferences devuelve lo que recibe, como haría el repositorio real
const echoPreferences = (_userId, row) => Promise.resolve({ ...row, updatedAt: '2026-10-11T02:00:00.000Z' });

function loginAs(user) {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: user.id } }, error: null });
  findProfileById.mockResolvedValue(user);
}

const put = (path, body) => request(app).put(`/api/v1${path}`).set('Authorization', 'Bearer valid-token').send(body);

beforeEach(() => {
  vi.clearAllMocks();
  upsertPreferences.mockImplementation(echoPreferences);
});

describe('GET /api/v1/me', () => {
  it('incluye onboardingCompleted y las preferencias en camelCase, sin la fecha interna', async () => {
    loginAs(completedUser);
    findPreferencesByUserId.mockResolvedValue({ categories: ['sport'], interests: ['football'], timeSlots: [] });
    const res = await request(app).get('/api/v1/me').set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingCompleted).toBe(true);
    expect(res.body.data.preferences).toMatchObject({ categories: ['sport'], timeSlots: [] });
    expect(res.body.data).not.toHaveProperty('onboardingCompletedAt');
  });

  it('usuario nuevo sin respuestas → onboardingCompleted false y preferences null', async () => {
    loginAs(pendingUser);
    findPreferencesByUserId.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/me').set('Authorization', 'Bearer valid-token');
    expect(res.body.data).toMatchObject({ onboardingCompleted: false, preferences: null });
  });
});

describe('PUT /api/v1/me/onboarding', () => {
  it('sin token → 401', async () => {
    const res = await request(app).put('/api/v1/me/onboarding').send(answers);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('pendiente → 200: guarda gustos con categories derivadas, fija el rol y completa', async () => {
    loginAs(pendingUser);
    completeOnboarding.mockResolvedValue({ ...pendingUser, role: 'organizer', onboardingCompletedAt: 'ahora' });
    const res = await put('/me/onboarding', answers);

    expect(res.status).toBe(200);
    expect(upsertPreferences).toHaveBeenCalledWith('user-uuid', {
      categories: ['sport', 'culture'],
      interests: ['football', 'cinema', 'running'],
      days: ['weekends'],
      timeSlots: ['evening'],
      motivations: ['fun', 'meet_people'],
      zone: 'Belén',
    });
    expect(completeOnboarding).toHaveBeenCalledWith('user-uuid', 'organizer', {});
    expect(res.body.data).toMatchObject({ role: 'organizer', onboardingCompleted: true });
    expect(res.body.data.preferences.categories).toEqual(['sport', 'culture']);
  });

  it('"Omitir" en el paso 1: solo el rol, el resto queda vacío y zone null', async () => {
    loginAs(pendingUser);
    completeOnboarding.mockResolvedValue({ ...pendingUser, onboardingCompletedAt: 'ahora' });
    const res = await put('/me/onboarding', { role: 'participant', zone: '   ' });
    expect(res.status).toBe(200);
    expect(upsertPreferences).toHaveBeenCalledWith('user-uuid', {
      categories: [],
      interests: [],
      days: [],
      timeSlots: [],
      motivations: [],
      zone: null,
    });
  });

  it.each([
    ['gusto fuera de lista', { interests: ['golf'] }, 'interests.0'],
    ['día fuera de lista', { days: ['monday'] }, 'days.0'],
    ['franja fuera de lista', { timeSlots: ['night'] }, 'timeSlots.0'],
    ['más de 2 motivaciones', { motivations: ['fun', 'learn', 'health'] }, 'motivations'],
    ['zona de más de 80 caracteres', { zone: 'x'.repeat(81) }, 'zone'],
    ['rol inválido', { role: 'admin' }, 'role'],
  ])('%s → 400 VALIDATION_ERROR', async (_name, override, field) => {
    loginAs(pendingUser);
    const res = await put('/me/onboarding', { ...answers, ...override });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.field)).toContain(field);
    expect(upsertPreferences).not.toHaveBeenCalled();
  });

  it('sin rol → 400', async () => {
    loginAs(pendingUser);
    const res = await put('/me/onboarding', { ...answers, role: undefined });
    expect(res.status).toBe(400);
  });

  it('ya completado y cambia el rol → 409 ONBOARDING_ALREADY_COMPLETED sin escribir nada', async () => {
    loginAs(completedUser);
    const res = await put('/me/onboarding', { ...answers, role: 'organizer' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ONBOARDING_ALREADY_COMPLETED');
    expect(upsertPreferences).not.toHaveBeenCalled();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it('ya completado con el mismo rol → 200: actualiza gustos sin tocar el perfil', async () => {
    loginAs(completedUser);
    const res = await put('/me/onboarding', { ...answers, role: 'participant' });
    expect(res.status).toBe(200);
    expect(upsertPreferences).toHaveBeenCalled();
    expect(completeOnboarding).not.toHaveBeenCalled();
    expect(res.body.data.onboardingCompleted).toBe(true);
  });
});

describe('PUT /api/v1/me/preferences', () => {
  it('sin token → 401', async () => {
    const res = await request(app).put('/api/v1/me/preferences').send(answers);
    expect(res.status).toBe(401);
  });

  it('200: guarda gustos e ignora el rol; nunca completa el onboarding', async () => {
    loginAs(completedUser);
    const res = await put('/me/preferences', { ...answers, role: 'organizer' });
    expect(res.status).toBe(200);
    expect(completeOnboarding).not.toHaveBeenCalled();
    expect(res.body.data.role).toBe('participant');
    expect(res.body.data.preferences.categories).toEqual(['sport', 'culture']);
  });

  it('valor fuera de lista → 400', async () => {
    loginAs(completedUser);
    const res = await put('/me/preferences', { motivations: ['dinero'] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('sexo y rango de edad (opcionales, solo estadísticas)', () => {
  it('onboarding pendiente: los guarda junto con el rol', async () => {
    loginAs(pendingUser);
    completeOnboarding.mockResolvedValue({ ...pendingUser, onboardingCompletedAt: 'ahora', gender: 'female', ageRange: '25-34' });
    const res = await put('/me/onboarding', { ...answers, role: 'participant', gender: 'female', ageRange: '25-34' });
    expect(res.status).toBe(200);
    expect(completeOnboarding).toHaveBeenCalledWith('user-uuid', 'participant', { gender: 'female', ageRange: '25-34' });
    expect(res.body.data).toMatchObject({ gender: 'female', ageRange: '25-34' });
  });

  it('nunca llegan a user_preferences (no se usan para recomendar)', async () => {
    loginAs(pendingUser);
    completeOnboarding.mockResolvedValue({ ...pendingUser, onboardingCompletedAt: 'ahora' });
    await put('/me/onboarding', { ...answers, role: 'participant', gender: 'male', ageRange: '18-24' });
    const [, row] = upsertPreferences.mock.calls[0];
    expect(row).not.toHaveProperty('gender');
    expect(row).not.toHaveProperty('ageRange');
  });

  it.each([
    ['sexo fuera de lista', { gender: 'robot' }, 'gender'],
    ['rango de edad fuera de lista', { ageRange: '12-17' }, 'ageRange'],
  ])('%s → 400 VALIDATION_ERROR', async (_name, override, field) => {
    loginAs(pendingUser);
    const res = await put('/me/onboarding', { ...answers, ...override });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toContain(field);
    expect(upsertPreferences).not.toHaveBeenCalled();
  });

  it('GET /me: expone dataConsentAccepted y oculta la fecha', async () => {
    loginAs({ ...completedUser, dataConsentAt: '2026-10-21T00:00:00.000Z' });
    findPreferencesByUserId.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/me').set('Authorization', 'Bearer valid-token');
    expect(res.body.data.dataConsentAccepted).toBe(true);
    expect(res.body.data).not.toHaveProperty('dataConsentAt');

    loginAs({ ...completedUser, dataConsentAt: null });
    const old = await request(app).get('/api/v1/me').set('Authorization', 'Bearer valid-token');
    expect(old.body.data.dataConsentAccepted).toBe(false);
  });
});

describe('PUT /api/v1/me/consent', () => {
  it('sin token → 401', async () => {
    const res = await request(app).put('/api/v1/me/consent').send({});
    expect(res.status).toBe(401);
  });

  it('primera vez: guarda data_consent_at y los datos opcionales', async () => {
    loginAs({ ...completedUser, dataConsentAt: null });
    updateProfile.mockImplementation((_id, fields) => Promise.resolve({ ...completedUser, ...fields }));
    const res = await put('/me/consent', { gender: 'other', ageRange: '55+' });
    expect(res.status).toBe(200);
    const [, fields] = updateProfile.mock.calls[0];
    expect(fields).toMatchObject({ gender: 'other', ageRange: '55+' });
    expect(typeof fields.dataConsentAt).toBe('string');
    expect(res.body.data.dataConsentAccepted).toBe(true);
  });

  it('sin datos opcionales basta con aceptar; no toca sexo ni edad', async () => {
    loginAs({ ...completedUser, dataConsentAt: null });
    updateProfile.mockImplementation((_id, fields) => Promise.resolve({ ...completedUser, ...fields }));
    const res = await put('/me/consent', {});
    expect(res.status).toBe(200);
    const [, fields] = updateProfile.mock.calls[0];
    expect(fields.gender).toBeUndefined();
    expect(fields.ageRange).toBeUndefined();
  });

  it('reenviar no mueve la fecha de la primera aceptación', async () => {
    loginAs({ ...completedUser, dataConsentAt: '2026-10-21T00:00:00.000Z' });
    updateProfile.mockImplementation((_id, fields) => Promise.resolve({ ...completedUser, ...fields }));
    await put('/me/consent', {});
    expect(updateProfile.mock.calls[0][1].dataConsentAt).toBe('2026-10-21T00:00:00.000Z');
  });

  it('valor fuera de lista → 400 y no escribe', async () => {
    loginAs(completedUser);
    const res = await put('/me/consent', { gender: 'x' });
    expect(res.status).toBe(400);
    expect(updateProfile).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/v1/me con sexo y edad', () => {
  const patch = (body) => request(app).patch('/api/v1/me').set('Authorization', 'Bearer valid-token').send(body);

  it('solo sexo y edad (sin nombre) → 200; null borra el dato', async () => {
    loginAs(completedUser);
    updateProfile.mockResolvedValue({ ...completedUser, gender: null, ageRange: '35-44' });
    const res = await patch({ gender: null, ageRange: '35-44' });
    expect(res.status).toBe(200);
    expect(updateProfile).toHaveBeenCalledWith('user-uuid', { gender: null, ageRange: '35-44' });
  });

  it('cuerpo vacío → 400', async () => {
    loginAs(completedUser);
    const res = await patch({});
    expect(res.status).toBe(400);
  });
});
