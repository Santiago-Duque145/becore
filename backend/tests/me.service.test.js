import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/profiles.repository.js', () => ({
  findProfileById: vi.fn(),
  updateProfile: vi.fn(),
  completeOnboarding: vi.fn(),
}));

vi.mock('../src/repositories/preferences.repository.js', () => ({
  findPreferencesByUserId: vi.fn(),
  upsertPreferences: vi.fn(),
}));

import { completeOnboarding, deriveCategories, updateName } from '../src/services/me.service.js';
import {
  completeOnboarding as markOnboardingCompleted,
  findProfileById,
  updateProfile,
} from '../src/repositories/profiles.repository.js';
import { findPreferencesByUserId, upsertPreferences } from '../src/repositories/preferences.repository.js';
import { INTERESTS } from '../src/constants/preferences.js';

const pendingUser = { id: 'u1', fullName: 'Ana', role: 'participant', onboardingCompletedAt: null };
const noAnswers = { interests: [], days: [], timeSlots: [], motivations: [], zone: null };

beforeEach(() => {
  vi.clearAllMocks();
  upsertPreferences.mockImplementation((_id, row) => Promise.resolve(row));
});

describe('deriveCategories', () => {
  it('sin gustos → sin categorías', () => {
    expect(deriveCategories([])).toEqual([]);
  });

  it('un gusto por categoría', () => {
    expect(deriveCategories(['hiking'])).toEqual(['recreation']);
    expect(deriveCategories(['theater'])).toEqual(['culture']);
  });

  it('varios gustos de la misma categoría no repiten', () => {
    expect(deriveCategories(['football', 'running', 'fitness'])).toEqual(['sport']);
  });

  it('respeta el orden de la spec (sport, culture, recreation) sin importar el orden de entrada', () => {
    expect(deriveCategories(['video_games', 'dance', 'swimming'])).toEqual(['sport', 'culture', 'recreation']);
  });

  it('todos los gustos → las tres categorías; nunca "other"', () => {
    expect(deriveCategories(INTERESTS.map((i) => i.slug))).toEqual(['sport', 'culture', 'recreation']);
  });

  it('ignora slugs desconocidos', () => {
    expect(deriveCategories(['golf', 'music'])).toEqual(['culture']);
  });
});

describe('completeOnboarding', () => {
  it('carrera: otro request completó con el mismo rol → responde el perfil actual', async () => {
    markOnboardingCompleted.mockResolvedValue(null);
    findProfileById.mockResolvedValue({ ...pendingUser, onboardingCompletedAt: 'antes' });
    const me = await completeOnboarding(pendingUser, { role: 'participant', ...noAnswers });
    expect(me.onboardingCompleted).toBe(true);
  });

  it('carrera: otro request completó con otro rol → 409', async () => {
    markOnboardingCompleted.mockResolvedValue(null);
    findProfileById.mockResolvedValue({ ...pendingUser, role: 'participant', onboardingCompletedAt: 'antes' });
    await expect(completeOnboarding(pendingUser, { role: 'organizer', ...noAnswers })).rejects.toMatchObject({
      status: 409,
      code: 'ONBOARDING_ALREADY_COMPLETED',
    });
  });
});

describe('updateName', () => {
  it('perfil inexistente → 404', async () => {
    updateProfile.mockResolvedValue(null);
    await expect(updateName(pendingUser, { fullName: 'Ana María' })).rejects.toMatchObject({ status: 404 });
  });

  it('responde con la forma de GET /me', async () => {
    updateProfile.mockResolvedValue({ ...pendingUser, fullName: 'Ana María' });
    findPreferencesByUserId.mockResolvedValue(null);
    expect(await updateName(pendingUser, { fullName: 'Ana María' })).toEqual({
      id: 'u1',
      fullName: 'Ana María',
      role: 'participant',
      onboardingCompleted: false,
      preferences: null,
    });
  });
});
