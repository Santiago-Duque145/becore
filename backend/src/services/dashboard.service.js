import { findEventsByIds } from '../repositories/events.repository.js';
import { listUserAttendances } from '../repositories/attendance.repository.js';
import { listAppointments } from './appointments.service.js';
import { toEvent } from './events.service.js';

const PAST_LIMIT = 10;

// Próximo: aún no empieza o está en curso. Lo demás (terminado, o cancelado con fecha pasada) es pasado.
const isUpcoming = (event, now) => event.status === 'in_progress' || new Date(event.startsAt).getTime() >= now;

// GET /dashboard/participant (api.md, RF-19). "Mis eventos" necesita además las asistencias que el
// usuario canceló (estado "Cancelado"), así que trae confirmadas y canceladas con su myAttendance.
export async function getParticipantDashboard(user) {
  const attendances = await listUserAttendances(user.id);
  const byEvent = new Map(attendances.map((a) => [a.eventId, a]));
  const [events, upcomingAppointments] = await Promise.all([
    findEventsByIds([...byEvent.keys()]),
    listAppointments(user, 'upcoming'),
  ]);
  const now = Date.now();
  const visible = events.filter((e) => e.status !== 'draft').map((e) => toEvent(e, byEvent.get(e.id)));
  const byStart = (a, b) => new Date(a.startsAt) - new Date(b.startsAt);

  return {
    upcomingEvents: visible.filter((e) => isUpcoming(e, now)).sort(byStart),
    pastEvents: visible
      .filter((e) => !isUpcoming(e, now))
      .sort((a, b) => byStart(b, a))
      .slice(0, PAST_LIMIT),
    upcomingAppointments,
  };
}
