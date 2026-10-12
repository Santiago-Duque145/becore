import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/events.repository.js', () => ({ findEventsByIds: vi.fn() }));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  listUserAttendances: vi.fn(),
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
