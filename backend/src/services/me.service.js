import { AVATAR_BUCKET } from '../constants/avatars.js';
import * as storage from './storage.service.js';
import { INTERESTS } from '../constants/preferences.js';
import {
  completeOnboarding as markOnboardingCompleted,
  findProfileById,
  updateProfile,
} from '../repositories/profiles.repository.js';
import { findPreferencesByUserId, upsertPreferences } from '../repositories/preferences.repository.js';
import { scheduleProfileIndex } from './ai/indexing.service.js';
import { deleteCachedRecommendations } from '../repositories/ai.repository.js';
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
  const { onboardingCompletedAt, dataConsentAt, ...rest } = profile;
  return {
    ...rest,
    onboardingCompleted: Boolean(onboardingCompletedAt),
    dataConsentAccepted: Boolean(dataConsentAt),
    preferences,
  };
}

// Sexo y rango de edad: solo los que llegan (undefined = no tocar). Solo para estadísticas agregadas.
const pickDemographics = ({ gender, ageRange }) => ({ gender, ageRange });
const hasChanges = (fields) => Object.values(fields).some((value) => value !== undefined);

export async function getMe(user) {
  return toMe(user, await findPreferencesByUserId(user.id));
}

// PATCH /me: cambia el nombre y/o los datos demográficos; responde con la misma forma que GET /me
export async function updateName(user, fields) {
  const updated = await updateProfile(user.id, fields);
  if (!updated) throw new AppError(404, 'NOT_FOUND', 'No encontramos lo que buscas');
  return getMe(updated);
}

// PUT /me/consent: guarda cuándo aceptó la política (la primera vez; reenviar no la mueve)
// y, si vienen, sexo y rango de edad.
export async function acceptDataConsent(user, answers) {
  const updated = await updateProfile(user.id, {
    ...pickDemographics(answers),
    dataConsentAt: user.dataConsentAt ?? new Date().toISOString(),
  });
  if (!updated) throw new AppError(404, 'NOT_FOUND', 'No encontramos lo que buscas');
  return getMe(updated);
}

// Guarda los gustos, borra su "Para ti" guardado (IA3: ya no corresponde) y programa su embedding (IA2, en segundo
// plano). Solo gustos: nunca nombre, sexo ni edad.
async function savePreferences(userId, answers) {
  const preferences = await upsertPreferences(userId, toPreferencesRow(answers));
  await deleteCachedRecommendations(userId);
  scheduleProfileIndex(userId, preferences);
  return preferences;
}

// PUT /me/onboarding (auth-onboarding.md §7). El rol solo cambia mientras el onboarding esté pendiente.
export async function completeOnboarding(user, { role, gender, ageRange, consent, ...answers }) {
  // consent: la política se acepta en el primer paso de /bienvenida; la fecha de la primera aceptación no se mueve
  const demographics = {
    ...pickDemographics({ gender, ageRange }),
    ...(consent ? { dataConsentAt: user.dataConsentAt ?? new Date().toISOString() } : {}),
  };
  if (user.onboardingCompletedAt) {
    if (role !== user.role) throw onboardingAlreadyCompleted();
    // Reenvío con el mismo rol: solo se actualizan los gustos (y sexo/edad si llegan)
    const preferences = await savePreferences(user.id, answers);
    const profile = hasChanges(demographics) ? await updateProfile(user.id, demographics) : null;
    return toMe(profile ?? user, preferences);
  }

  const preferences = await savePreferences(user.id, answers);
  const profile = await markOnboardingCompleted(user.id, role, demographics);
  if (profile) return toMe(profile, preferences);

  // Otro request lo completó entre la lectura y la escritura: se aplica la misma regla de rol
  const current = await findProfileById(user.id);
  if (!current || current.role !== role) throw onboardingAlreadyCompleted();
  return toMe(current, preferences);
}

// PUT /me/preferences: edita los gustos desde Perfil. Nunca toca el rol ni el estado del onboarding.
export async function updatePreferences(user, answers) {
  return toMe(user, await savePreferences(user.id, answers));
}

// ---- Avatar (P3): foto subida con URL firmada o uno de los 12 avatares de la marca ----

export const createAvatarUpload = (user, contentType) =>
  storage.createUploadTarget(AVATAR_BUCKET, user.id, contentType);

async function saveAvatar(user, fields) {
  const updated = await updateProfile(user.id, fields);
  if (!updated) throw new AppError(404, 'NOT_FOUND', 'No encontramos lo que buscas');
  return getMe(updated);
}

// La foto subida manda sobre el avatar predefinido: ambos pueden coexistir, se muestra primero la foto
export async function setAvatarPhoto(user, path) {
  storage.assertOwnPath(user.id, path);
  return saveAvatar(user, { avatarUrl: storage.publicUrl(AVATAR_BUCKET, path) });
}

// Elegir un avatar predefinido reemplaza la foto subida (es la elección explícita más reciente)
export const setAvatarPreset = (user, preset) => saveAvatar(user, { avatarPreset: preset, avatarUrl: null });

export const clearAvatar = (user) => saveAvatar(user, { avatarPreset: null, avatarUrl: null });
