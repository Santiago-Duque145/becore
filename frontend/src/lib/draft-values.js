import { isoToBogotaInput } from './format.js';

// IA8 · Borrador de la IA → valores del formulario de evento. Solo se incluyen los campos que el borrador trae:
// lo que viene vacío o null se deja como estaba para que el organizador lo llene a mano.
// → { values: { campo: valor }, place: { lat, lng } | undefined }

export const DRAFT_NOTICES = {
  DAILY_LIMIT: 'Llegaste al límite de borradores de hoy; puedes llenar el formulario normal.',
  DEFAULT: 'El asistente no está disponible ahora; puedes llenar el formulario normal.',
};

export const draftUnavailableMessage = (reason) => DRAFT_NOTICES[reason] ?? DRAFT_NOTICES.DEFAULT;

export function draftToFormValues(draft) {
  const values = {};
  if (draft.title) values.title = draft.title;
  if (draft.description) values.description = draft.description;
  if (draft.category) values.category = draft.category;
  if (draft.location) values.location = draft.location;
  if (draft.startsAt) values.startsAt = isoToBogotaInput(draft.startsAt);
  if (draft.durationMinutes) values.durationMinutes = String(draft.durationMinutes);
  if (draft.capacity) values.capacity = String(draft.capacity);
  const hasPin = Number.isFinite(draft.latitude) && Number.isFinite(draft.longitude);
  return { values, place: hasPin ? { lat: draft.latitude, lng: draft.longitude } : undefined };
}
