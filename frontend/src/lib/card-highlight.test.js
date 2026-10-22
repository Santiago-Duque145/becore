import { describe, it, expect } from 'vitest';
import { cardHighlight } from './card-highlight.js';

// Bogotá = UTC-5. "Ahora": jueves 22 oct 2026, 10:00 a. m. en Bogotá
const now = new Date('2026-10-22T15:00:00Z');
const base = {
  status: 'published',
  isFull: false,
  startsAt: '2026-10-30T23:00:00Z',
  capacity: 20,
  confirmedCount: 2,
  createdAt: '2026-10-01T00:00:00Z',
  myAttendance: null,
};
const hl = (over, opts) => cardHighlight({ ...base, ...over }, { now, ...opts });

describe('cardHighlight', () => {
  it('sin nada que decir → null', () => {
    expect(hl({})).toBeNull();
  });

  it('hoy y mañana en hora de Bogotá, también cerca de la medianoche', () => {
    expect(hl({ startsAt: '2026-10-23T04:30:00Z' })?.label).toBe('Es hoy'); // 22 oct 11:30 p. m. en Bogotá
    expect(hl({ startsAt: '2026-10-23T05:30:00Z' })?.label).toBe('Es mañana'); // 23 oct 00:30 en Bogotá
    expect(hl({ startsAt: '2026-10-24T05:30:00Z' })).toBeNull(); // pasado mañana
  });

  it('"Es hoy" gana a los cupos; ya empezado, lleno, cancelado o borrador → nada', () => {
    expect(hl({ startsAt: '2026-10-22T23:00:00Z', confirmedCount: 19 })?.kind).toBe('today');
    expect(hl({ startsAt: '2026-10-22T14:00:00Z' })).toBeNull();
    expect(hl({ isFull: true, confirmedCount: 20 })).toBeNull();
    expect(hl({ status: 'cancelled', startsAt: '2026-10-22T23:00:00Z' })).toBeNull();
    expect(hl({ status: 'draft', createdAt: '2026-10-22T14:00:00Z' })).toBeNull();
  });

  it('cupos: solo si quedan ≤ 20 % y ≤ 5; "Queda 1 cupo" en singular', () => {
    expect(hl({ confirmedCount: 16 })?.label).toBe('¡Quedan 4 cupos!');
    expect(hl({ confirmedCount: 19 })?.label).toBe('¡Queda 1 cupo!');
    expect(hl({ capacity: 100, confirmedCount: 95 })?.label).toBe('¡Quedan 5 cupos!');
    expect(hl({ capacity: 100, confirmedCount: 90 })?.label).toBe('Se está llenando'); // quedan 10: no es "pocos"
    expect(hl({ capacity: 10, confirmedCount: 7 })?.label).toBe('Se está llenando'); // quedan 3 = 30 %
    expect(hl({ capacity: 4, confirmedCount: 3 })?.label).toBe('Se está llenando'); // queda 1 = 25 %
  });

  it('se está llenando desde el 70 %', () => {
    expect(hl({ confirmedCount: 14 })?.kind).toBe('filling');
    expect(hl({ confirmedCount: 13 })).toBeNull();
  });

  it('nuevo: creado hace menos de 48 h; pierde ante los cupos', () => {
    expect(hl({ createdAt: '2026-10-21T00:00:00Z' })).toEqual({ kind: 'new', label: 'Nuevo', tone: 'culture' });
    expect(hl({ createdAt: '2026-10-20T14:00:00Z' })).toBeNull();
    expect(hl({ createdAt: '2026-10-21T00:00:00Z', confirmedCount: 17 })?.kind).toBe('few_spots');
  });

  it('si ya voy, o en "Mis eventos", solo importa cuándo es', () => {
    const going = { myAttendance: { status: 'confirmed' }, confirmedCount: 18, createdAt: '2026-10-22T00:00:00Z' };
    expect(hl(going)).toBeNull();
    expect(hl({ confirmedCount: 18 }, { mine: true })).toBeNull();
    expect(hl({ ...going, startsAt: '2026-10-23T20:00:00Z' })?.label).toBe('Es mañana');
  });
});
