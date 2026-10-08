import * as attendanceRepo from '../repositories/attendance.repository.js';
import * as activityRepo from '../repositories/activity.repository.js';
import * as eventsRepo from '../repositories/events.repository.js';
import { AppError } from '../utils/app-error.js';

const CHECKIN_OPENS_MS = 2 * 3600 * 1000;

const notFound = () => new AppError(404, 'EVENT_NOT_FOUND', 'El evento no existe');
const forbidden = () => new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');

export async function confirm(user, eventId) {
  const confirmedCount = await attendanceRepo.confirmAttendance(eventId, user.id);
  return { confirmedCount, myAttendance: { status: 'confirmed', checkedIn: false } };
}

export async function cancel(user, eventId) {
  const confirmedCount = await attendanceRepo.cancelAttendance(eventId, user.id);
  return { confirmedCount, myAttendance: { status: 'cancelled', checkedIn: false } };
}

async function findOwnedEvent(user, eventId) {
  const event = await eventsRepo.findEventById(eventId);
  if (!event) throw notFound();
  if (event.organizerId !== user.id) throw forbidden();
  return event;
}

// Confirmados primero y luego por nombre
export async function listAttendees(user, eventId) {
  await findOwnedEvent(user, eventId);
  const attendees = await attendanceRepo.listAttendees(eventId);
  const rank = (a) => (a.status === 'confirmed' ? 0 : 1);
  return attendees.sort((a, b) => rank(a) - rank(b) || a.fullName.localeCompare(b.fullName, 'es'));
}

export async function setCheckIn(user, eventId, attendeeId, checkedIn) {
  const event = await findOwnedEvent(user, eventId);
  if (event.status !== 'published' && event.status !== 'in_progress') {
    throw new AppError(409, 'EVENT_NOT_ACTIVE', 'El evento fue cancelado');
  }
  if (Date.now() < new Date(event.startsAt).getTime() - CHECKIN_OPENS_MS) {
    throw new AppError(409, 'CHECKIN_NOT_OPEN', 'El check-in se habilita 2 horas antes del evento');
  }
  const attendee = await attendanceRepo.findAttendee(eventId, attendeeId);
  if (attendee?.status !== 'confirmed') {
    throw new AppError(409, 'NOT_CONFIRMED', 'No tienes una asistencia confirmada en este evento');
  }

  await attendanceRepo.setCheckedIn(eventId, attendeeId, checkedIn);
  if (checkedIn) await activityRepo.insertActivity(eventId, attendee.fullName, 'checked_in');
  return { userId: attendeeId, checkedIn };
}

export async function listActivity(user, eventId, limit) {
  const event = await eventsRepo.findEventById(eventId);
  if (!event || (event.status === 'draft' && event.organizerId !== user.id)) throw notFound();
  return activityRepo.listActivity(eventId, limit);
}
