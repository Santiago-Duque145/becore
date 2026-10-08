import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/attendance.repository.js', () => ({
  confirmAttendance: vi.fn(),
  cancelAttendance: vi.fn(),
  listAttendees: vi.fn(),
  findAttendee: vi.fn(),
  setCheckedIn: vi.fn(),
}));
vi.mock('../src/repositories/activity.repository.js', () => ({
  insertActivity: vi.fn(),
  listActivity: vi.fn(),
}));
vi.mock('../src/repositories/events.repository.js', () => ({
  findEventById: vi.fn(),
}));

import * as repo from '../src/repositories/attendance.repository.js';
import * as activityRepo from '../src/repositories/activity.repository.js';
import * as eventsRepo from '../src/repositories/events.repository.js';
import * as service from '../src/services/attendance.service.js';
import { AppError } from '../src/utils/app-error.js';

const user = { id: 'par-1', role: 'participant' };
const owner = { id: 'org-1', role: 'organizer' };
const otherOrganizer = { id: 'org-2', role: 'organizer' };
const fail = (status, code) => new AppError(status, code, 'msg');
const inHours = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
const event = (over = {}) => ({ id: 'ev-1', organizerId: 'org-1', status: 'published', startsAt: inHours(1), ...over });
const attendee = (over = {}) => ({
  userId: 'par-1',
  fullName: 'Ana Gómez',
  email: 'ana@becore.test',
  status: 'confirmed',
  checkedIn: false,
  confirmedAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe('confirm', () => {
  it('confirma y devuelve el nuevo confirmedCount', async () => {
    repo.confirmAttendance.mockResolvedValue(5);
    await expect(service.confirm(user, 'ev-1')).resolves.toEqual({
      confirmedCount: 5,
      myAttendance: { status: 'confirmed', checkedIn: false },
    });
    expect(repo.confirmAttendance).toHaveBeenCalledWith('ev-1', 'par-1');
  });

  it.each([
    ['EVENT_FULL', 409],
    ['ALREADY_CONFIRMED', 409],
    ['EVENT_STARTED', 409],
    ['EVENT_NOT_ACTIVE', 409],
    ['EVENT_NOT_FOUND', 404],
  ])('propaga %s', async (code, status) => {
    repo.confirmAttendance.mockRejectedValue(fail(status, code));
    await expect(service.confirm(user, 'ev-1')).rejects.toMatchObject({ code, status });
  });
});

describe('cancel', () => {
  it('cancela y devuelve el nuevo confirmedCount', async () => {
    repo.cancelAttendance.mockResolvedValue(3);
    await expect(service.cancel(user, 'ev-1')).resolves.toEqual({
      confirmedCount: 3,
      myAttendance: { status: 'cancelled', checkedIn: false },
    });
    expect(repo.cancelAttendance).toHaveBeenCalledWith('ev-1', 'par-1');
  });

  it.each([
    ['NOT_CONFIRMED', 409],
    ['EVENT_STARTED', 409],
    ['EVENT_NOT_ACTIVE', 409],
    ['EVENT_NOT_FOUND', 404],
  ])('propaga %s', async (code, status) => {
    repo.cancelAttendance.mockRejectedValue(fail(status, code));
    await expect(service.cancel(user, 'ev-1')).rejects.toMatchObject({ code, status });
  });
});

describe('listAttendees', () => {
  it('ordena confirmados primero y luego por nombre', async () => {
    eventsRepo.findEventById.mockResolvedValue(event());
    repo.listAttendees.mockResolvedValue([
      attendee({ userId: 'a', fullName: 'Zoe', status: 'cancelled' }),
      attendee({ userId: 'b', fullName: 'Pedro' }),
      attendee({ userId: 'c', fullName: 'Ana' }),
      attendee({ userId: 'd', fullName: 'Álvaro', status: 'cancelled' }),
    ]);
    const result = await service.listAttendees(owner, 'ev-1');
    expect(result.map((a) => a.userId)).toEqual(['c', 'b', 'd', 'a']);
  });

  it('evento inexistente → 404 y ajeno → 403', async () => {
    eventsRepo.findEventById.mockResolvedValueOnce(null);
    await expect(service.listAttendees(owner, 'ev-1')).rejects.toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' });
    eventsRepo.findEventById.mockResolvedValueOnce(event());
    await expect(service.listAttendees(otherOrganizer, 'ev-1')).rejects.toMatchObject({ status: 403 });
  });
});

describe('setCheckIn', () => {
  beforeEach(() => {
    eventsRepo.findEventById.mockResolvedValue(event());
    repo.findAttendee.mockResolvedValue(attendee());
  });

  it('marca llegada y escribe en activity_log con el nombre del asistente', async () => {
    await expect(service.setCheckIn(owner, 'ev-1', 'par-1', true)).resolves.toEqual({ userId: 'par-1', checkedIn: true });
    expect(repo.setCheckedIn).toHaveBeenCalledWith('ev-1', 'par-1', true);
    expect(activityRepo.insertActivity).toHaveBeenCalledWith('ev-1', 'Ana Gómez', 'checked_in');
  });

  it('desmarcar no escribe en activity_log', async () => {
    await service.setCheckIn(owner, 'ev-1', 'par-1', false);
    expect(repo.setCheckedIn).toHaveBeenCalledWith('ev-1', 'par-1', false);
    expect(activityRepo.insertActivity).not.toHaveBeenCalled();
  });

  it('evento inexistente → 404 EVENT_NOT_FOUND', async () => {
    eventsRepo.findEventById.mockResolvedValue(null);
    await expect(service.setCheckIn(owner, 'ev-1', 'par-1', true)).rejects.toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' });
  });

  it('no es el dueño → 403', async () => {
    await expect(service.setCheckIn(otherOrganizer, 'ev-1', 'par-1', true)).rejects.toMatchObject({ status: 403 });
  });

  it.each(['draft', 'cancelled', 'finished'])('evento %s → 409 EVENT_NOT_ACTIVE', async (status) => {
    eventsRepo.findEventById.mockResolvedValue(event({ status }));
    await expect(service.setCheckIn(owner, 'ev-1', 'par-1', true)).rejects.toMatchObject({ status: 409, code: 'EVENT_NOT_ACTIVE' });
  });

  it('acepta eventos en curso', async () => {
    eventsRepo.findEventById.mockResolvedValue(event({ status: 'in_progress', startsAt: inHours(-1) }));
    await expect(service.setCheckIn(owner, 'ev-1', 'par-1', true)).resolves.toMatchObject({ checkedIn: true });
  });

  it('faltan más de 2 h → 409 CHECKIN_NOT_OPEN', async () => {
    eventsRepo.findEventById.mockResolvedValue(event({ startsAt: inHours(3) }));
    await expect(service.setCheckIn(owner, 'ev-1', 'par-1', true)).rejects.toMatchObject({ status: 409, code: 'CHECKIN_NOT_OPEN' });
    expect(repo.setCheckedIn).not.toHaveBeenCalled();
  });

  it.each([null, { status: 'cancelled' }])('asistencia no confirmada (%o) → 409 NOT_CONFIRMED', async (found) => {
    repo.findAttendee.mockResolvedValue(found && attendee(found));
    await expect(service.setCheckIn(owner, 'ev-1', 'par-1', true)).rejects.toMatchObject({ status: 409, code: 'NOT_CONFIRMED' });
  });
});

describe('listActivity', () => {
  it('devuelve la actividad del evento', async () => {
    eventsRepo.findEventById.mockResolvedValue(event());
    activityRepo.listActivity.mockResolvedValue([{ id: 1, actorName: 'Ana', action: 'confirmed', createdAt: 'x' }]);
    await expect(service.listActivity(user, 'ev-1', 5)).resolves.toHaveLength(1);
    expect(activityRepo.listActivity).toHaveBeenCalledWith('ev-1', 5);
  });

  it('borrador ajeno o evento inexistente → 404; el dueño sí lo ve', async () => {
    eventsRepo.findEventById.mockResolvedValueOnce(event({ status: 'draft' }));
    await expect(service.listActivity(user, 'ev-1', 10)).rejects.toMatchObject({ status: 404 });
    eventsRepo.findEventById.mockResolvedValueOnce(null);
    await expect(service.listActivity(user, 'ev-1', 10)).rejects.toMatchObject({ status: 404 });
    eventsRepo.findEventById.mockResolvedValueOnce(event({ status: 'draft' }));
    activityRepo.listActivity.mockResolvedValue([]);
    await expect(service.listActivity(owner, 'ev-1', 10)).resolves.toEqual([]);
  });
});
