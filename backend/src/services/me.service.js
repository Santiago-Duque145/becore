import { INTERESTS } from '../constants/preferences.js';
import {
  completeOnboarding as markOnboardingCompleted,
  findProfileById,
  updateProfile,
} from '../repositories/profiles.repository.js';
import { findPreferencesByUserId, upsertPreferences } from '../repositories/preferences.repository.js';
import { AppError } from '../utils/app-error.js';

const onboardingAlreadyCompleted = () =>
  new AppError(409, 'ONBOARDING_ALREADY_COMPLETED', 'Ya completaste tu bienvenida; tu rol ya no se puede cambiar');

// Categorías de evento a partir de los gustos, sin repetir y en el orden de INTERESTS
export function deriveCategories(interests) {
  const chosen = new Set(interests);
  return [...new Set(INTERESTS.filter((i) => chosen.has(i.slug)).map((i) => i.category))];
}

function toPreferencesRow({ interests, days, timeSlots, motivations, zone }) {
  return { categories: deriveCategories(interests), interests, days, timeSlots, motivations, zone };
}

// Respuesta de GET /me: el perfil sin la fecha interna, con el estado del onboarding y los gustos
function toMe(profile, preferences) {
  const { onboardingCompletedAt, ...rest } = profile;
  return { ...rest, onboardingCompleted: Boolean(onboardingCompletedAt), preferences };
}

export async function getMe(user) {
  return toMe(user, await findPreferencesByUserId(user.id));
}

// PATCH /me: cambia el nombre y responde con la misma forma que GET /me
export async function updateName(user, { fullName }) {
  const updated = await updateProfile(user.id, { fullName });
  if (!updated) throw new AppError(404, 'NOT_FOUND', 'No encontramos lo que buscas');
  return getMe(updated);
}

// PUT /me/onboarding (auth-onboarding.md §7). El rol solo cambia mientras el onboarding esté pendiente.
export async function completeOnboarding(user, { role, ...answers }) {
  if (user.onboardingCompletedAt) {
    if (role !== user.role) throw onboardingAlreadyCompleted();
    // Reenvío con el mismo rol: solo se actualizan los gustos
    return toMe(user, await upsertPreferences(user.id, toPreferencesRow(answers)));
  }

  const preferences = await upsertPreferences(user.id, toPreferencesRow(answers));
  const profile = await markOnboardingCompleted(user.id, role);
  if (profile) return toMe(profile, preferences);

  // Otro request lo completó entre la lectura y la escritura: se aplica la misma regla de rol
  const current = await findProfileById(user.id);
  if (!current || current.role !== role) throw onboardingAlreadyCompleted();
  return toMe(current, preferences);
}

// PUT /me/preferences: edita los gustos desde Perfil. Nunca toca el rol ni el estado del onboarding.
export async function updatePreferences(user, answers) {
  return toMe(user, await upsertPreferences(user.id, toPreferencesRow(answers)));
}
