import { describe, it, expect, vi, beforeEach } from 'vitest';

// Query builder de supabase-js simulado: cada método encadena y registra la llamada;
// al final (single/maybeSingle) responde lo que se programe en `result`.
const calls = [];
let result = { data: null, error: null };
const builder = new Proxy(
  {},
  {
    get(_target, method) {
      return (...args) => {
        calls.push([method, ...args]);
        return method === 'single' || method === 'maybeSingle' ? Promise.resolve(result) : builder;
      };
    },
  },
);

vi.mock('../src/config/supabase.js', () => ({
  supabaseAdmin: { from: (table) => (calls.push(['from', table]), builder) },
}));

import { findPreferencesByUserId, upsertPreferences } from '../src/repositories/preferences.repository.js';
import { completeOnboarding, findProfileById } from '../src/repositories/profiles.repository.js';

const prefsRow = {
  categories: ['sport'],
  interests: ['football'],
  days: ['weekends'],
  time_slots: ['evening'],
  motivations: ['fun'],
  zone: 'Belén',
  updated_at: '2026-10-11T00:00:00Z',
};
const prefsCamel = {
  categories: ['sport'],
  interests: ['football'],
  days: ['weekends'],
  timeSlots: ['evening'],
  motivations: ['fun'],
  zone: 'Belén',
  updatedAt: '2026-10-11T00:00:00Z',
};
const profileRow = {
  id: 'u1',
  email: 'a@becore.test',
  full_name: 'Ana',
  role: 'organizer',
  onboarding_completed_at: '2026-10-11T00:00:00Z',
  created_at: '2026-10-01T00:00:00Z',
};

const called = (method) => calls.find(([m]) => m === method);

beforeEach(() => {
  calls.length = 0;
  result = { data: null, error: null };
});

describe('preferences.repository', () => {
  it('findPreferencesByUserId convierte a camelCase', async () => {
    result = { data: prefsRow, error: null };
    expect(await findPreferencesByUserId('u1')).toEqual(prefsCamel);
    expect(called('from')).toEqual(['from', 'user_preferences']);
    expect(called('eq')).toEqual(['eq', 'user_id', 'u1']);
  });

  it('findPreferencesByUserId sin fila → null', async () => {
    expect(await findPreferencesByUserId('u1')).toBeNull();
  });

  it('findPreferencesByUserId relanza errores de la base', async () => {
    result = { data: null, error: { message: 'boom' } };
    await expect(findPreferencesByUserId('u1')).rejects.toEqual({ message: 'boom' });
  });

  it('upsertPreferences escribe en snake_case con conflicto por user_id', async () => {
    result = { data: prefsRow, error: null };
    expect(await upsertPreferences('u1', prefsCamel)).toEqual(prefsCamel);
    expect(called('upsert')).toEqual([
      'upsert',
      { user_id: 'u1', categories: ['sport'], interests: ['football'], days: ['weekends'], time_slots: ['evening'], motivations: ['fun'], zone: 'Belén' },
      { onConflict: 'user_id' },
    ]);
  });

  it('upsertPreferences relanza errores (p. ej. check de lista cerrada)', async () => {
    result = { data: null, error: { code: '23514' } };
    await expect(upsertPreferences('u1', { ...prefsCamel })).rejects.toEqual({ code: '23514' });
  });
});

describe('profiles.repository · onboarding', () => {
  it('findProfileById incluye onboardingCompletedAt', async () => {
    result = { data: profileRow, error: null };
    expect(await findProfileById('u1')).toMatchObject({ fullName: 'Ana', onboardingCompletedAt: '2026-10-11T00:00:00Z' });
  });

  it('completeOnboarding fija rol y fecha solo si seguía pendiente', async () => {
    result = { data: profileRow, error: null };
    expect(await completeOnboarding('u1', 'organizer')).toMatchObject({ role: 'organizer' });
    const [, update] = called('update');
    expect(update.role).toBe('organizer');
    expect(Number.isNaN(Date.parse(update.onboarding_completed_at))).toBe(false);
    expect(called('is')).toEqual(['is', 'onboarding_completed_at', null]);
  });

  it('completeOnboarding sin fila actualizada (ya estaba completo) → null', async () => {
    expect(await completeOnboarding('u1', 'organizer')).toBeNull();
  });

  it('completeOnboarding relanza errores de la base', async () => {
    result = { data: null, error: { message: 'boom' } };
    await expect(completeOnboarding('u1', 'organizer')).rejects.toEqual({ message: 'boom' });
  });
});
