import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/events.repository.js', () => ({
  insertEvent: vi.fn(),
  findEventById: vi.fn(),
  updateEvent: vi.fn(),
  listEvents: vi.fn(),
}));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  findUserAttendances: vi.fn(),
  listConfirmedUserIds: vi.fn().mockResolvedValue([]),
}));
vi.mock('../src/services/notifications.service.js', () => ({
  notify: vi.fn(),
}));

import * as repo from '../src/repositories/events.repository.js';
import { findUserAttendances } from '../src/repositories/attendance.repository.js';
import * as service from '../src/services/events.service.js';

const owner = { id: 'owner-1', role: 'organizer' };
const other = { id: 'owner-2', role: 'organizer' };
const future = (h = 48) => new Date(Date.now() + h * 3600 * 1000).toISOString();

const baseEvent = (over = {}) => ({
  id: 'ev-1',
  title: 'Partido',
  description: '',
  category: 'sport',
  location: 'Cancha',
  startsAt: future(),
  endsAt: null,
  capacity: 10,
  confirmedCount: 4,
  status: 'published',
  cancelledAt: null,
  organizerId: 'owner-1',
  organizer: { id: 'owner-1', fullName: 'Santiago' },
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  findUserAttendances.mockResolvedValue([]);
});

describe('createEvent', () => {
  it('crea en borrador por defecto y calcula campos derivados', async () => {
    repo.insertEvent.mockResolvedValue(baseEvent({ status: 'draft', confirmedCount: 0 }));
    const result = await service.createEvent(owner, { title: 'Partido', capacity: 10 });
    expect(repo.insertEvent).toHaveBeenCalledWith('owner-1', expect.objectContaining({ status: 'draft' }));
    expect(result).toMatchObject({ availableSpots: 10, isFull: false, isPast: false, myAttendance: null });
    expect(result).not.toHaveProperty('organizerId');
  });

  it('respeta status published', async () => {
    repo.insertEvent.mockResolvedValue(baseEvent());
    await service.createEvent(owner, { title: 'Partido', capacity: 10, status: 'published' });
    expect(repo.insertEvent).toHaveBeenCalledWith('owner-1', expect.objectContaining({ status: 'published' }));
  });
});

describe('getEvent', () => {
  it('no existe → 404', async () => {
    repo.findEventById.mockResolvedValue(null);
    await expect(service.getEvent(owner, 'x')).rejects.toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' });
  });

  it('borrador ajeno → 404, propio → ok', async () => {
    repo.findEventById.mockResolvedValue(baseEvent({ status: 'draft' }));
    await expect(service.getEvent(other, 'ev-1')).rejects.toMatchObject({ status: 404 });
    await expect(service.getEvent(owner, 'ev-1')).resolves.toMatchObject({ id: 'ev-1' });
  });

  it('incluye myAttendance del usuario', async () => {
    repo.findEventById.mockResolvedValue(baseEvent());
    findUserAttendances.mockResolvedValue([{ eventId: 'ev-1', status: 'confirmed', checkedIn: false }]);
    const result = await service.getEvent(other, 'ev-1');
    expect(result.myAttendance).toEqual({ status: 'confirmed', checkedIn: false });
  });
});

describe('updateEvent', () => {
  it('evento ajeno → 403', async () => {
    repo.findEventById.mockResolvedValue(baseEvent());
    await expect(service.updateEvent(other, 'ev-1', { title: 'Nuevo' })).rejects.toMatchObject({ status: 403 });
    expect(repo.updateEvent).not.toHaveBeenCalled();
  });

  it('cancelado → 409 EVENT_NOT_ACTIVE', async () => {
    repo.findEventById.mockResolvedValue(baseEvent({ status: 'cancelled' }));
    await expect(service.updateEvent(owner, 'ev-1', { title: 'Nuevo' })).rejects.toMatchObject({
      status: 409,
      code: 'EVENT_NOT_ACTIVE',
    });
  });

  it('ya empezó → 409 EVENT_STARTED', async () => {
    repo.findEventById.mockResolvedValue(baseEvent({ startsAt: future(-2) }));
    await expect(service.updateEvent(owner, 'ev-1', { title: 'Nuevo' })).rejects.toMatchObject({ code: 'EVENT_STARTED' });
  });

  it('bajar cupo por debajo de confirmados → 409 CAPACITY_BELOW_CONFIRMED', async () => {
    repo.findEventById.mockResolvedValue(baseEvent({ confirmedCount: 4 }));
    await expect(service.updateEvent(owner, 'ev-1', { capacity: 3 })).rejects.toMatchObject({
      status: 409,
      code: 'CAPACITY_BELOW_CONFIRMED',
    });
  });

  it('cupo igual a confirmados es válido', async () => {
    repo.findEventById.mockResolvedValue(baseEvent({ confirmedCount: 4 }));
    repo.updateEvent.mockResolvedValue(baseEvent({ capacity: 4 }));
    const result = await service.updateEvent(owner, 'ev-1', { capacity: 4 });
    expect(result).toMatchObject({ capacity: 4, isFull: true, availableSpots: 0 });
  });

  it('fin anterior al inicio existente → 400 con detalle por campo', async () => {
    repo.findEventById.mockResolvedValue(baseEvent());
    await expect(service.updateEvent(owner, 'ev-1', { endsAt: future(1) })).rejects.toMatchObject({
      status: 400,
      details: [{ field: 'endsAt', message: expect.any(String) }],
    });
  });
});

describe('cancelEvent', () => {
  it('el dueño cancela un evento publicado', async () => {
    repo.findEventById.mockResolvedValue(baseEvent());
    repo.updateEvent.mockResolvedValue(baseEvent({ status: 'cancelled', cancelledAt: future(0) }));
    const result = await service.cancelEvent(owner, 'ev-1');
    expect(repo.updateEvent).toHaveBeenCalledWith('ev-1', { status: 'cancelled' });
    expect(result.status).toBe('cancelled');
  });

  it('ya cancelado → 409 EVENT_NOT_ACTIVE', async () => {
    repo.findEventById.mockResolvedValue(baseEvent({ status: 'cancelled' }));
    await expect(service.cancelEvent(owner, 'ev-1')).rejects.toMatchObject({ code: 'EVENT_NOT_ACTIVE' });
  });

  it('no dueño → 403', async () => {
    repo.findEventById.mockResolvedValue(baseEvent());
    await expect(service.cancelEvent(other, 'ev-1')).rejects.toMatchObject({ status: 403 });
  });
});

describe('publishEvent', () => {
  it('publica un borrador', async () => {
    repo.findEventById.mockResolvedValue(baseEvent({ status: 'draft' }));
    repo.updateEvent.mockResolvedValue(baseEvent());
    await service.publishEvent(owner, 'ev-1');
    expect(repo.updateEvent).toHaveBeenCalledWith('ev-1', { status: 'published' });
  });

  it('publicar un evento ya publicado → 409 INVALID_EVENT_TRANSITION', async () => {
    repo.findEventById.mockResolvedValue(baseEvent());
    await expect(service.publishEvent(owner, 'ev-1')).rejects.toMatchObject({
      status: 409,
      code: 'INVALID_EVENT_TRANSITION',
    });
  });

  it('publicar un cancelado → 409', async () => {
    repo.findEventById.mockResolvedValue(baseEvent({ status: 'cancelled' }));
    await expect(service.publishEvent(owner, 'ev-1')).rejects.toMatchObject({ status: 409 });
  });
});

describe('listEvents', () => {
  const query = { scope: 'upcoming', page: 1, pageSize: 12 };

  it('Descubre solo pide published e in_progress', async () => {
    repo.listEvents.mockResolvedValue({ rows: [], total: 0 });
    await service.listEvents(owner, query);
    expect(repo.listEvents).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ['published', 'in_progress'], organizerId: undefined }),
    );
  });

  it('organizer=me trae todos los estados del usuario', async () => {
    repo.listEvents.mockResolvedValue({ rows: [], total: 0 });
    await service.listEvents(owner, { ...query, organizer: 'me' });
    expect(repo.listEvents).toHaveBeenCalledWith(expect.objectContaining({ statuses: undefined, organizerId: 'owner-1' }));
  });

  it('pasa category y convierte from/to a límites en hora de Bogotá', async () => {
    repo.listEvents.mockResolvedValue({ rows: [baseEvent()], total: 1 });
    const result = await service.listEvents(owner, { ...query, category: 'culture', from: '2026-10-31', to: '2026-10-31' });
    const filters = repo.listEvents.mock.calls[0][0];
    expect(filters.category).toBe('culture');
    expect(filters.fromIso).toBe('2026-10-31T05:00:00.000Z');
    expect(filters.toIso).toBe('2026-11-01T05:00:00.000Z');
    expect(result.meta).toEqual({ total: 1, page: 1, pageSize: 12 });
  });

  it('scope past incluye finished', async () => {
    repo.listEvents.mockResolvedValue({ rows: [], total: 0 });
    await service.listEvents(owner, { ...query, scope: 'past' });
    expect(repo.listEvents.mock.calls[0][0].statuses).toContain('finished');
  });
});
