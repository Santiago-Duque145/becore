import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/events.repository.js', () => ({ findEventsByIds: vi.fn(), listOrganizerEventsSince: vi.fn() }));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  listUserAttendances: vi.fn(),
  listAttendanceStatuses: vi.fn(),
  findUserAttendances: vi.fn(),
  listConfirmedUserIds: vi.fn(),
}));
vi.mock('../src/services/appointments.service.js', () => ({ listAppointments: vi.fn() }));
vi.mock('../src/services/notifications.service.js', () => ({ notify: vi.fn() }));

import { findEventsByIds } from '../src/repositories/events.repository.js';
import { listUserAttendances } from '../src/repositories/attendance.repository.js';
import { listAppointments } from '../src/services/appointments.service.js';
import { getParticipantDashboard } from '../src/services/dashboard.service.js';

const user = { id: 'u1', role: 'participant' };
const hours = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
const ev = (id, over = {}) => ({
  id,
  title: id,
  category: 'sport',
  location: 'Cancha',
  startsAt: hours(24),
  capacity: 10,
  confirmedCount: 3,
  status: 'published',
  organizerId: 'org',
  organizer: { id: 'org', fullName: 'Org' },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  listAppointments.mockResolvedValue([{ id: 'a1' }]);
});

describe('getParticipantDashboard', () => {
  it('separa próximos y pasados con su asistencia, incluye canceladas y excluye borradores', async () => {
    listUserAttendances.mockResolvedValue([
      { eventId: 'pronto', status: 'confirmed', checkedIn: false },
      { eventId: 'despues', status: 'cancelled', checkedIn: false },
      { eventId: 'en-curso', status: 'confirmed', checkedIn: true },
      { eventId: 'ayer', status: 'confirmed', checkedIn: true },
      { eventId: 'cancelado', status: 'confirmed', checkedIn: false },
      { eventId: 'borrador', status: 'confirmed', checkedIn: false },
    ]);
    findEventsByIds.mockResolvedValue([
      ev('despues', { startsAt: hours(72) }),
      ev('pronto'),
      ev('en-curso', { startsAt: hours(-1), status: 'in_progress' }),
      ev('ayer', { startsAt: hours(-24), status: 'finished' }),
      ev('cancelado', { startsAt: hours(48), status: 'cancelled' }),
      ev('borrador', { status: 'draft' }),
    ]);

    const result = await getParticipantDashboard(user);
    expect(result.upcomingEvents.map((e) => e.id)).toEqual(['en-curso', 'pronto', 'cancelado', 'despues']);
    expect(result.pastEvents.map((e) => e.id)).toEqual(['ayer']);
    expect(result.upcomingEvents.find((e) => e.id === 'despues').myAttendance).toEqual({ status: 'cancelled', checkedIn: false });
    expect(result.pastEvents[0]).not.toHaveProperty('organizerId');
    expect(result.upcomingAppointments).toEqual([{ id: 'a1' }]);
    expect(listAppointments).toHaveBeenCalledWith(user, 'upcoming');
  });

  it('pasados: los 10 más recientes primero', async () => {
    const ids = Array.from({ length: 12 }, (_, i) => `p${i}`);
    listUserAttendances.mockResolvedValue(ids.map((eventId) => ({ eventId, status: 'confirmed', checkedIn: false })));
    findEventsByIds.mockResolvedValue(ids.map((id, i) => ev(id, { startsAt: hours(-(i + 1) * 24), status: 'finished' })));
    const { pastEvents } = await getParticipantDashboard(user);
    expect(pastEvents).toHaveLength(10);
    expect(pastEvents[0].id).toBe('p0');
  });

  it('sin asistencias no consulta eventos de más', async () => {
    listUserAttendances.mockResolvedValue([]);
    findEventsByIds.mockResolvedValue([]);
    const result = await getParticipantDashboard(user);
    expect(findEventsByIds).toHaveBeenCalledWith([]);
    expect(result.upcomingEvents).toEqual([]);
  });
});

describe('getOrganizerDashboard', () => {
  it('cuenta canceladas y llegadas por evento y calcula los totales', async () => {
    const { listOrganizerEventsSince } = await import('../src/repositories/events.repository.js');
    const { listAttendanceStatuses } = await import('../src/repositories/attendance.repository.js');
    const { getOrganizerDashboard } = await import('../src/services/dashboard.service.js');
    listOrganizerEventsSince.mockResolvedValue([
      ev('pasado', { startsAt: hours(-48), status: 'finished', capacity: 10, confirmedCount: 8 }),
      ev('activo', { capacity: 10, confirmedCount: 6 }),
      ev('borrador', { status: 'draft', capacity: 20, confirmedCount: 0 }),
      ev('cancelado', { status: 'cancelled', capacity: 30, confirmedCount: 5 }),
      ev('curso', { startsAt: hours(-1), status: 'in_progress', capacity: 10, confirmedCount: 2 }),
    ]);
    listAttendanceStatuses.mockResolvedValue([
      { eventId: 'pasado', status: 'confirmed', checkedIn: true },
      { eventId: 'pasado', status: 'cancelled', checkedIn: false },
      { eventId: 'activo', status: 'cancelled', checkedIn: false },
      { eventId: 'activo', status: 'confirmed', checkedIn: false },
    ]);

    const { totals, events } = await getOrganizerDashboard({ id: 'org', role: 'organizer' });
    expect(totals).toEqual({
      upcomingEvents: 2, // activo y en curso
      confirmed: 16, // 8 + 6 + 0 + 2 (sin el cancelado)
      cancelled: 2,
      checkedIn: 1,
      occupancyRate: 8 / 20,
    });
    expect(events.find((e) => e.id === 'pasado')).toMatchObject({ isPast: true, cancelledCount: 1, checkedInCount: 1 });
    expect(events[0]).toHaveProperty('location');
    expect(events[0]).not.toHaveProperty('organizerId');
  });

  it('sin eventos próximos la ocupación es 0', async () => {
    const { listOrganizerEventsSince } = await import('../src/repositories/events.repository.js');
    const { listAttendanceStatuses } = await import('../src/repositories/attendance.repository.js');
    const { getOrganizerDashboard } = await import('../src/services/dashboard.service.js');
    listOrganizerEventsSince.mockResolvedValue([]);
    listAttendanceStatuses.mockResolvedValue([]);
    const { totals } = await getOrganizerDashboard({ id: 'org' });
    expect(totals.occupancyRate).toBe(0);
    expect(totals.upcomingEvents).toBe(0);
  });
});
