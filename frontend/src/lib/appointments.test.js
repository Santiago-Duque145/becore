import { describe, it, expect } from 'vitest';
import {
  appointmentStatus,
  bogotaPartsToIso,
  bogotaToday,
  bookableSlots,
  findOverlap,
  groupSlotsByDay,
  inviteesSummary,
  isWithinSlot,
  suggestedRange,
} from './appointments.js';
import { availabilityFormSchema, toAvailabilityPayload } from './appointment-schemas.js';

const NOW = new Date('2026-10-20T15:00:00.000Z'); // 10:00 a. m. en Bogotá
// 3:00 p. m. – 5:00 p. m. del 23 de octubre en Bogotá
const SLOT = { id: 's1', startsAt: '2026-10-23T20:00:00.000Z', endsAt: '2026-10-23T22:00:00.000Z' };

describe('appointmentStatus', () => {
  const base = { status: 'scheduled', startsAt: '2026-10-20T16:00:00.000Z', endsAt: '2026-10-20T17:00:00.000Z' };

  it('cancelada gana sobre cualquier fecha', () => {
    expect(appointmentStatus({ ...base, status: 'cancelled' }, NOW)).toEqual({ label: 'Cancelada', tone: 'action' });
  });

  it('programada, en curso y realizada según la hora', () => {
    expect(appointmentStatus(base, NOW).label).toBe('Programada');
    expect(appointmentStatus(base, new Date('2026-10-20T16:30:00.000Z')).label).toBe('En curso');
    expect(appointmentStatus(base, new Date('2026-10-20T17:00:00.000Z')).label).toBe('Realizada');
  });
});

describe('findOverlap', () => {
  const slots = [SLOT];

  it('detecta un bloque que se cruza', () => {
    const candidate = { startsAt: '2026-10-23T21:00:00.000Z', endsAt: '2026-10-23T23:00:00.000Z' };
    expect(findOverlap(candidate, slots)).toBe(SLOT);
  });

  it('bloques que solo se tocan no se cruzan', () => {
    expect(findOverlap({ startsAt: SLOT.endsAt, endsAt: '2026-10-23T23:00:00.000Z' }, slots)).toBeNull();
    expect(findOverlap({ startsAt: '2026-10-23T19:00:00.000Z', endsAt: SLOT.startsAt }, slots)).toBeNull();
  });

  it('un bloque que contiene a otro se cruza', () => {
    const candidate = { startsAt: '2026-10-23T19:00:00.000Z', endsAt: '2026-10-23T23:00:00.000Z' };
    expect(findOverlap(candidate, slots)).toBe(SLOT);
  });
});

describe('isWithinSlot', () => {
  it('acepta los bordes y rechaza lo que se sale', () => {
    expect(isWithinSlot(SLOT, SLOT)).toBe(true);
    expect(isWithinSlot({ startsAt: '2026-10-23T19:59:00.000Z', endsAt: SLOT.endsAt }, SLOT)).toBe(false);
    expect(isWithinSlot({ startsAt: SLOT.startsAt, endsAt: '2026-10-23T22:01:00.000Z' }, SLOT)).toBe(false);
  });
});

describe('suggestedRange', () => {
  it('propone una hora desde el inicio del bloque', () => {
    expect(suggestedRange(SLOT, NOW)).toEqual({ startsAt: '2026-10-23T15:00', endsAt: '2026-10-23T16:00' });
  });

  it('si el bloque ya empezó, arranca en el próximo cuarto de hora sin salirse', () => {
    const now = new Date('2026-10-23T21:20:00.000Z'); // 4:20 p. m.
    expect(suggestedRange(SLOT, now)).toEqual({ startsAt: '2026-10-23T16:30', endsAt: '2026-10-23T17:00' });
  });
});

describe('bookableSlots', () => {
  it('descarta bloques donde ya no cabe una cita', () => {
    const late = new Date('2026-10-23T21:50:00.000Z'); // próximo cuarto: 22:00 = fin del bloque
    expect(bookableSlots([SLOT], NOW)).toHaveLength(1);
    expect(bookableSlots([SLOT], late)).toHaveLength(0);
  });
});

describe('groupSlotsByDay', () => {
  it('agrupa por día de Bogotá, no de UTC', () => {
    const night = { id: 's2', startsAt: '2026-10-24T02:00:00.000Z', endsAt: '2026-10-24T03:00:00.000Z' }; // 9 p. m. del 23
    const groups = groupSlotsByDay([SLOT, night]);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('2026-10-23');
    expect(groups[0].slots).toHaveLength(2);
  });
});

describe('fechas de Bogotá', () => {
  it('fecha + hora → ISO UTC', () => {
    expect(bogotaPartsToIso('2026-10-23', '15:00')).toBe(SLOT.startsAt);
  });

  it('hoy en Bogotá aunque en UTC ya sea mañana', () => {
    expect(bogotaToday(new Date('2026-10-21T03:00:00.000Z'))).toBe('2026-10-20');
  });
});

describe('inviteesSummary', () => {
  const people = (n) => Array.from({ length: n }, (_, i) => ({ fullName: `Jugador ${i + 1}` }));

  it('nombra hasta dos y resume el resto', () => {
    expect(inviteesSummary(people(1))).toBe('Jugador 1');
    expect(inviteesSummary(people(2))).toBe('Jugador 1 y Jugador 2');
    expect(inviteesSummary(people(5))).toBe('Jugador 1, Jugador 2 y 3 más');
  });
});

describe('availabilityFormSchema', () => {
  const future = { date: '2099-01-10', startTime: '15:00', endTime: '17:00' };

  it('acepta un bloque válido y arma el payload en UTC', () => {
    expect(availabilityFormSchema.safeParse(future).success).toBe(true);
    expect(toAvailabilityPayload(future)).toEqual({
      startsAt: '2099-01-10T20:00:00.000Z',
      endsAt: '2099-01-10T22:00:00.000Z',
    });
  });

  it('no revienta con campos vacíos', () => {
    const result = availabilityFormSchema.safeParse({ date: '', startTime: '', endTime: '' });
    expect(result.success).toBe(false);
    expect(result.error.issues.map((i) => i.path[0])).toEqual(['date', 'startTime', 'endTime']);
  });

  it('fin antes del inicio, más de 8 horas y pasado', () => {
    const messages = (values) => availabilityFormSchema.safeParse(values).error.issues.map((i) => i.message);
    expect(messages({ ...future, endTime: '14:00' })).toContain('La hora de fin debe ser posterior al inicio');
    expect(messages({ ...future, startTime: '08:00', endTime: '16:30' })).toContain('Un bloque no puede durar más de 8 horas');
    expect(messages({ ...future, date: '2020-01-10' })).toContain('El bloque debe empezar en el futuro');
  });
});
