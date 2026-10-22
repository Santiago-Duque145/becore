import * as eventsRepo from '../repositories/events.repository.js';
import { findUserAttendances, listConfirmedPreviewIds, listConfirmedUserIds } from '../repositories/attendance.repository.js';
import { findAvatarsByIds } from '../repositories/profiles.repository.js';
import { COVER_BUCKET } from '../constants/avatars.js';
import * as storage from './storage.service.js';
import { requestRatingsForEvent } from './rating-requests.service.js';
import { locatePlace } from './geocode.service.js';
import { scheduleEventIndex, touchesAiFields } from './ai/indexing.service.js';
import { findEventTags } from '../repositories/ai.repository.js';
import { notify } from './notifications.service.js';
import { buildContent } from '../mail/templates.js';
import { AppError } from '../utils/app-error.js';

const PUBLIC_STATUSES = ['published', 'in_progress'];
const PUBLIC_PAST_STATUSES = ['published', 'in_progress', 'finished'];
const DAY_MS = 24 * 3600 * 1000;

const notFound = () => new AppError(404, 'EVENT_NOT_FOUND', 'El evento no existe');

export function toEvent(event, myAttendance) {
  const rest = { ...event };
  delete rest.organizerId;
  const availableSpots = Math.max(event.capacity - event.confirmedCount, 0);
  return {
    ...rest,
    availableSpots,
    isFull: availableSpots === 0,
    isPast: new Date(event.startsAt).getTime() < Date.now(),
    myAttendance: myAttendance ? { status: myAttendance.status, checkedIn: myAttendance.checkedIn } : null,
  };
}

// También lo usa services/recommendations para devolver el mismo formato de Event
export async function toEventsWithAttendance(user, events) {
  const attendances = await findUserAttendances(
    user.id,
    events.map((e) => e.id),
  );
  const byEvent = new Map(attendances.map((a) => [a.eventId, a]));
  const previews = await confirmedPreviews(events);
  return events.map((e) => ({ ...toEvent(e, byEvent.get(e.id)), confirmedPreview: previews[e.id] ?? [] }));
}

const PREVIEW_SIZE = 3;

// "Quiénes van": hasta 3 confirmados con nombre de pila y avatar, nada más
async function confirmedPreviews(events) {
  const withPeople = events.filter((e) => e.confirmedCount > 0);
  const idsByEvent = (await listConfirmedPreviewIds(withPeople.map((e) => e.id), PREVIEW_SIZE)) ?? {};
  const userIds = [...new Set(Object.values(idsByEvent).flat())];
  if (!userIds.length) return {};
  const profiles = await findAvatarsByIds(userIds);
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return Object.fromEntries(
    Object.entries(idsByEvent).map(([eventId, ids]) => [
      eventId,
      ids.filter((id) => byId.has(id)).map((id) => ({
        name: byId.get(id).firstName,
        avatarUrl: byId.get(id).avatarUrl,
        avatarPreset: byId.get(id).avatarPreset,
      })),
    ]),
  );
}

// El organizador sube la imagen a Storage con una URL firmada y envía aquí solo la ruta confirmada
export const createCoverUpload = (user, contentType) =>
  storage.createUploadTarget(COVER_BUCKET, user.id, contentType);

// coverPath: undefined = no tocar, null = quitar la portada, string = ruta subida por este organizador
function coverPatch(user, coverPath) {
  if (coverPath === undefined) return {};
  if (coverPath === null) return { coverUrl: null };
  storage.assertOwnPath(user.id, coverPath);
  return { coverUrl: storage.publicUrl(COVER_BUCKET, coverPath) };
}

// Fechas YYYY-MM-DD interpretadas en America/Bogota (UTC-5, sin horario de verano)
const bogotaStart = (date) => new Date(`${date}T00:00:00-05:00`);

// Los borradores solo los ve su organizador; para el resto "no existen"
async function findVisibleEvent(user, id) {
  const event = await eventsRepo.findEventById(id);
  if (!event) throw notFound();
  if (event.status === 'draft' && event.organizerId !== user.id) throw notFound();
  return event;
}

// Reglas 1-4 de api.md §3 para editar, cancelar y publicar
async function findOwnedActiveEvent(user, id) {
  const event = await findVisibleEvent(user, id);
  if (event.organizerId !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
  }
  if (event.status === 'cancelled' || event.status === 'finished') {
    throw new AppError(409, 'EVENT_NOT_ACTIVE', 'El evento fue cancelado');
  }
  if (new Date(event.startsAt).getTime() <= Date.now()) {
    throw new AppError(409, 'EVENT_STARTED', 'El evento ya empezó, no se puede modificar');
  }
  return event;
}

// RF-17: avisar a los confirmados solo si cambió fecha, hora o lugar
const sameTime = (a, b) => (a ? new Date(a).getTime() : null) === (b ? new Date(b).getTime() : null);

function changedSchedule(event, patch) {
  return (
    (patch.startsAt !== undefined && !sameTime(patch.startsAt, event.startsAt)) ||
    (patch.endsAt !== undefined && !sameTime(patch.endsAt, event.endsAt)) ||
    (patch.location !== undefined && patch.location !== event.location)
  );
}

async function notifyConfirmed(event, type) {
  const userIds = await listConfirmedUserIds(event.id);
  await notify({ userIds, type, eventId: event.id, buildContent: () => buildContent(type, event) });
}

// Todo evento debe quedar en el mapa: si no llegan coordenadas (ni el pin del selector ni un null explícito), se
// geocodifica el texto del lugar. Si no se puede ubicar, el evento se guarda igual y se puede marcar al editarlo.
async function placeFromText(location) {
  const hit = await locatePlace(location);
  return hit ? { latitude: hit.lat, longitude: hit.lng } : {};
}

export async function createEvent(user, input) {
  const { coverPath, ...fields } = input;
  const cover = coverPatch(user, coverPath); // primero los permisos: una portada ajena falla antes de salir a la red
  const place = fields.latitude === undefined ? await placeFromText(fields.location) : {};
  const event = await eventsRepo.insertEvent(user.id, {
    ...fields,
    ...place,
    ...cover,
    status: fields.status ?? 'draft',
  });
  scheduleEventIndex(event); // IA2: etiquetas y embedding en segundo plano (solo si se publica)
  return toEvent(event, null);
}

export async function listEvents(user, query) {
  const mine = query.organizer === 'me';
  const publicStatuses = query.scope === 'past' ? PUBLIC_PAST_STATUSES : PUBLIC_STATUSES;
  const filters = {
    scope: query.scope,
    category: query.category,
    page: query.page,
    pageSize: query.pageSize,
    organizerId: mine ? user.id : undefined,
    statuses: mine ? undefined : publicStatuses,
    fromIso: query.from ? bogotaStart(query.from).toISOString() : undefined,
    toIso: query.to ? new Date(bogotaStart(query.to).getTime() + DAY_MS).toISOString() : undefined,
  };
  const { rows, total } = await eventsRepo.listEvents(filters);
  const data = await toEventsWithAttendance(user, rows);
  return { data, meta: { total, page: query.page, pageSize: query.pageSize } };
}

export async function getEvent(user, id) {
  const event = await findVisibleEvent(user, id);
  const [[result], tags] = await Promise.all([toEventsWithAttendance(user, [event]), findEventTags(id)]);
  return { ...result, tags }; // gustos que Gemini asignó (IA2); nunca el embedding
}

export async function updateEvent(user, id, input) {
  const { coverPath, ...fields } = input;
  const patch = { ...fields, ...coverPatch(user, coverPath) };
  const event = await findOwnedActiveEvent(user, id);
  // Editar un evento que aún no tiene ubicación (y sin pin nuevo) intenta ubicarlo con el texto del lugar
  if (patch.latitude === undefined && event.latitude == null) Object.assign(patch, await placeFromText(patch.location ?? event.location));

  if (patch.capacity !== undefined && patch.capacity < event.confirmedCount) {
    throw new AppError(409, 'CAPACITY_BELOW_CONFIRMED', 'El cupo no puede ser menor que los confirmados actuales');
  }
  const startsAt = patch.startsAt ?? event.startsAt;
  const endsAt = patch.endsAt ?? event.endsAt;
  if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Revisa los datos enviados', [
      { field: 'endsAt', message: 'La hora de fin debe ser posterior al inicio' },
    ]);
  }

  const updated = await eventsRepo.updateEvent(id, patch);
  if (touchesAiFields(patch)) scheduleEventIndex(updated);
  if (changedSchedule(event, patch)) await notifyConfirmed(updated, 'event_updated');
  return toEvent(updated, null);
}

export async function cancelEvent(user, id) {
  await findOwnedActiveEvent(user, id);
  const cancelled = await eventsRepo.updateEvent(id, { status: 'cancelled' });
  await notifyConfirmed(cancelled, 'event_cancelled');
  return toEvent(cancelled, null);
}

export async function publishEvent(user, id) {
  const event = await findOwnedActiveEvent(user, id);
  if (event.status !== 'draft') {
    throw new AppError(409, 'INVALID_EVENT_TRANSITION', 'Solo un borrador se puede publicar');
  }
  const published = await eventsRepo.updateEvent(id, { status: 'published' });
  scheduleEventIndex(published);
  return toEvent(published, null);
}

// Finalizar a mano (solo el organizador y solo si está en curso). Usa la misma transición in_progress → finished
// de la máquina de estados (el trigger fija finished_at = now()); luego pide la calificación a quienes hicieron check-in.
export async function finishEvent(user, id) {
  const event = await findVisibleEvent(user, id);
  if (event.organizerId !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
  }
  if (event.status !== 'in_progress') {
    throw new AppError(409, 'EVENT_NOT_IN_PROGRESS', 'Solo puedes finalizar un evento que está en curso');
  }
  const finished = await eventsRepo.updateEvent(id, { status: 'finished' });
  try {
    await requestRatingsForEvent(finished);
  } catch (err) {
    // El evento ya quedó finalizado: si falla el aviso, el cron de estados lo reintenta durante la siguiente hora
    console.error('[calificaciones] No se pudo pedir la calificación:', err.message);
  }
  return toEvent(finished, null);
}

const CONFIRMED_LIST_LIMIT = 200;

// Lista completa de "quiénes van": solo nombre de pila y foto, y solo de eventos que el usuario puede ver
// (los borradores ajenos "no existen"). Nada de correo, apellidos ni ids de usuario.
export async function listConfirmedPeople(user, id) {
  const event = await findVisibleEvent(user, id);
  const idsByEvent = (await listConfirmedPreviewIds([event.id], CONFIRMED_LIST_LIMIT)) ?? {};
  const ids = idsByEvent[event.id] ?? [];
  if (!ids.length) return [];
  const byId = new Map((await findAvatarsByIds(ids)).map((p) => [p.id, p]));
  return ids
    .filter((userId) => byId.has(userId))
    .map((userId) => ({
      name: byId.get(userId).firstName,
      avatarUrl: byId.get(userId).avatarUrl,
      avatarPreset: byId.get(userId).avatarPreset,
    }));
}
