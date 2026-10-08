import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/appointments.repository.js', () => ({
  insertAppointment: vi.fn(),
  insertParticipants: vi.fn(),
  deleteAppointment: vi.fn(),
  findAppointmentById: vi.fn(),
  markCancelled: vi.fn(),
  listForUser: vi.fn(),
}));
vi.mock('../src/repositories/availability.repository.js', () => ({
  listFutureSlots: vi.fn(),
  insertSlot: vi.fn(),
  findSlotById: vi.fn(),
  deleteSlot: vi.fn(),
}));
vi.mock('../src/repositories/profiles.repository.js', () => ({
  findParticipantIds: vi.fn(),
}));
vi.mock('../src/services/notifications.service.js', () => ({
  notify: vi.fn(),
}));

import * as repo from '../src/repositories/appointments.repository.js';
import * as slotsRepo from '../src/repositories/availability.repository.js';
import { findParticipantIds } from '../src/repositories/profiles.repository.js';
import { notify } from '../src/services/notifications.service.js';
import * as service from '../src/services/appointments.service.js';
import * as availability from '../src/services/availability.service.js';
import { createAvailabilitySchema, createAppointmentSchema } from '../src/schemas/appointments.schemas.js';

const owner = { id: 'org-1', role: 'organizer' };
const other = { id: 'org-2', role: 'organizer' };
const inHours = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
const P1 = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e51';
const P2 = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e52';

const stored = (over = {}) => ({
  id: 'ap-1',
  title: 'Reunión',
  notes: '',
  location: 'Cafetería',
  startsAt: inHours(24),
  endsAt: inHours(25),
  status: 'scheduled',
  organizerId: 'org-1',
  organizer: { id: 'org-1', fullName: 'Santiago' },
  participants: [
    { id: P1, fullName: 'Uno', email: 'u1@becore.test' },
    { id: P2, fullName: 'Dos', email: 'u2@becore.test' },
  ],
  ...over,
});
const input = (over = {}) => ({
  title: 'Reunión',
  notes: '',
  location: 'Cafetería',
  startsAt: inHours(24),
  endsAt: inHours(25),
  participantIds: [P1, P2],
  ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  repo.insertAppointment.mockResolvedValue('ap-1');
  repo.findAppointmentById.mockResolvedValue(stored());
  findParticipantIds.mockResolvedValue([P1, P2]);
});

describe('createAppointment', () => {
  it('crea la cita, inserta invitados y avisa a cada uno', async () => {
    const result = await service.createAppointment(owner, input());
    expect(repo.insertParticipants).toHaveBeenCalledWith('ap-1', [P1, P2]);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ userIds: [P1, P2], type: 'appointment_created', appointmentId: 'ap-1' }));
    expect(result).not.toHaveProperty('organizerId');
    expect(result.participants).toHaveLength(2);
  });

  it('un invitado que no es participante → 400 VALIDATION_ERROR con details', async () => {
    findParticipantIds.mockResolvedValue([P1]);
    await expect(service.createAppointment(owner, input())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [{ field: 'participantIds', message: expect.any(String) }],
    });
    expect(repo.insertAppointment).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('ids repetidos se insertan una sola vez', async () => {
    await service.createAppointment(owner, input({ participantIds: [P1, P1, P2] }));
    expect(findParticipantIds).toHaveBeenCalledWith([P1, P2]);
    expect(repo.insertParticipants).toHaveBeenCalledWith('ap-1', [P1, P2]);
  });

  it('si fallan los invitados borra la cita (compensación) y relanza el error', async () => {
    repo.insertParticipants.mockRejectedValue(new Error('fallo db'));
    await expect(service.createAppointment(owner, input())).rejects.toThrow('fallo db');
    expect(repo.deleteAppointment).toHaveBeenCalledWith('ap-1');
    expect(notify).not.toHaveBeenCalled();
  });
});

describe('cancelAppointment', () => {
  it('el dueño cancela y se avisa a los invitados', async () => {
    const result = await service.cancelAppointment(owner, 'ap-1');
    expect(repo.markCancelled).toHaveBeenCalledWith('ap-1');
    expect(result.status).toBe('cancelled');
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ userIds: [P1, P2], type: 'appointment_cancelled' }));
  });

  it('cancelar dos veces → 409 APPOINTMENT_NOT_ACTIVE', async () => {
    repo.findAppointmentById.mockResolvedValue(stored({ status: 'cancelled' }));
    await expect(service.cancelAppointment(owner, 'ap-1')).rejects.toMatchObject({ status: 409, code: 'APPOINTMENT_NOT_ACTIVE' });
    expect(notify).not.toHaveBeenCalled();
  });

  it('organizador ajeno → 403 e inexistente → 404', async () => {
    await expect(service.cancelAppointment(other, 'ap-1')).rejects.toMatchObject({ status: 403 });
    repo.findAppointmentById.mockResolvedValue(null);
    await expect(service.cancelAppointment(owner, 'ap-1')).rejects.toMatchObject({ status: 404 });
  });
});

describe('listAppointments', () => {
  it('pasa el scope y quita organizerId', async () => {
    repo.listForUser.mockResolvedValue([stored()]);
    const result = await service.listAppointments(owner, 'past');
    expect(repo.listForUser).toHaveBeenCalledWith('org-1', 'past');
    expect(result[0]).not.toHaveProperty('organizerId');
  });
});

describe('disponibilidad', () => {
  it('borrar: dueño → ok, ajeno → 403, inexistente → 404', async () => {
    slotsRepo.findSlotById.mockResolvedValueOnce({ id: 's1', organizerId: 'org-1' });
    await availability.deleteSlot(owner, 's1');
    expect(slotsRepo.deleteSlot).toHaveBeenCalledWith('s1');

    slotsRepo.findSlotById.mockResolvedValueOnce({ id: 's1', organizerId: 'org-1' });
    await expect(availability.deleteSlot(other, 's1')).rejects.toMatchObject({ status: 403 });

    slotsRepo.findSlotById.mockResolvedValueOnce(null);
    await expect(availability.deleteSlot(owner, 's1')).rejects.toMatchObject({ status: 404 });
  });
});

describe('validaciones (Zod)', () => {
  const slot = (startH, endH) => ({ startsAt: inHours(startH), endsAt: inHours(endH) });

  it('bloque: futuro, fin posterior y máximo 8 h', () => {
    expect(createAvailabilitySchema.safeParse(slot(1, 3)).success).toBe(true);
    expect(createAvailabilitySchema.safeParse(slot(-1, 3)).success).toBe(false);
    expect(createAvailabilitySchema.safeParse(slot(3, 2)).success).toBe(false);
    expect(createAvailabilitySchema.safeParse(slot(1, 8.99)).success).toBe(true);
    expect(createAvailabilitySchema.safeParse(slot(1, 9.5)).success).toBe(false);
  });

  it('cita: título, 1 a 30 invitados y fin posterior', () => {
    expect(createAppointmentSchema.safeParse(input()).success).toBe(true);
    expect(createAppointmentSchema.safeParse(input({ title: 'ab' })).success).toBe(false);
    expect(createAppointmentSchema.safeParse(input({ participantIds: [] })).success).toBe(false);
    expect(createAppointmentSchema.safeParse(input({ participantIds: ['no-uuid'] })).success).toBe(false);
    expect(createAppointmentSchema.safeParse(input({ endsAt: inHours(23) })).success).toBe(false);
    const many = Array.from({ length: 31 }, (_, i) => `3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d${String(i).padStart(4, '0')}`);
    expect(createAppointmentSchema.safeParse(input({ participantIds: many })).success).toBe(false);
  });
});
