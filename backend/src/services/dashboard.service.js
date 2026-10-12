import { findEventsByIds, listOrganizerEventsSince } from '../repositories/events.repository.js';
import { listAttendanceStatuses, listUserAttendances } from '../repositories/attendance.repository.js';
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

const ORGANIZER_WINDOW_DAYS = 30;
const DAY_MS = 24 * 3600 * 1000;

// GET /dashboard/organizer (api.md, RF-18): eventos del organizador desde hace 30 días con sus conteos.
// totals suma esos eventos; upcomingEvents y occupancyRate solo cuentan los próximos no cancelados.
export async function getOrganizerDashboard(user) {
  const now = Date.now();
  const events = await listOrganizerEventsSince(user.id, new Date(now - ORGANIZER_WINDOW_DAYS * DAY_MS).toISOString());
  const attendances = await listAttendanceStatuses(events.map((e) => e.id));

  const counts = new Map(events.map((e) => [e.id, { cancelledCount: 0, checkedInCount: 0 }]));
  for (const a of attendances) {
    const c = counts.get(a.eventId);
    if (!c) continue;
    if (a.status === 'cancelled') c.cancelledCount += 1;
    if (a.status === 'confirmed' && a.checkedIn) c.checkedInCount += 1;
  }

  const rows = events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    location: e.location,
    startsAt: e.startsAt,
    status: e.status,
    isPast: new Date(e.startsAt).getTime() < now,
    capacity: e.capacity,
    confirmedCount: e.confirmedCount,
    ...counts.get(e.id),
  }));

  // Activos: próximos o en curso, sin cancelados ni borradores
  const upcoming = rows.filter((e) => e.status !== 'cancelled' && e.status !== 'draft' && isUpcoming(e, now));
  const sum = (list, key) => list.reduce((acc, e) => acc + e[key], 0);
  const upcomingCapacity = sum(upcoming, 'capacity');

  return {
    totals: {
      upcomingEvents: upcoming.length,
      confirmed: sum(rows.filter((e) => e.status !== 'cancelled'), 'confirmedCount'),
      cancelled: sum(rows, 'cancelledCount'),
      checkedIn: sum(rows, 'checkedInCount'),
      occupancyRate: upcomingCapacity > 0 ? sum(upcoming, 'confirmedCount') / upcomingCapacity : 0,
    },
    events: rows,
  };
}
