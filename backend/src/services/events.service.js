import * as eventsRepo from '../repositories/events.repository.js';
import { findUserAttendances, listConfirmedUserIds } from '../repositories/attendance.repository.js';
import { notify } from './notifications.service.js';
import { buildContent } from '../mail/templates.js';
import { AppError } from '../utils/app-error.js';

const PUBLIC_STATUSES = ['published', 'in_progress'];
const PUBLIC_PAST_STATUSES = ['published', 'in_progress', 'finished'];
const DAY_MS = 24 * 3600 * 1000;

const notFound = () => new AppError(404, 'EVENT_NOT_FOUND', 'El evento no existe');

function toEvent(event, myAttendance) {
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

async function toEventsWithAttendance(user, events) {
  const attendances = await findUserAttendances(
    user.id,
    events.map((e) => e.id),
  );
  const byEvent = new Map(attendances.map((a) => [a.eventId, a]));
  return events.map((e) => toEvent(e, byEvent.get(e.id)));
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

export async function createEvent(user, input) {
  const event = await eventsRepo.insertEvent(user.id, { ...input, status: input.status ?? 'draft' });
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
  const [result] = await toEventsWithAttendance(user, [event]);
  return result;
}

export async function updateEvent(user, id, patch) {
  const event = await findOwnedActiveEvent(user, id);

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
  return toEvent(published, null);
}
