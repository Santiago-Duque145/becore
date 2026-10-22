import { describe, it, expect } from 'vitest';
import { parseDateHint } from '../src/services/drafts/date-hint.js';

// Miércoles 21 de octubre de 2026, 10:00 en Bogotá (15:00 UTC)
const NOW = Date.parse('2026-10-21T15:00:00Z');
const bogota = (iso) => new Date(Date.parse(iso) - 5 * 3600 * 1000).toISOString().slice(0, 16);

describe('parseDateHint', () => {
  it('vacío o sin fecha → null', () => {
    expect(parseDateHint('', NOW)).toBeNull();
    expect(parseDateHint(undefined, NOW)).toBeNull();
    expect(parseDateHint('en la tarde', NOW)).toBeNull();
    expect(parseDateHint('cuando se pueda', NOW)).toBeNull();
  });

  it('el sábado en la tarde → próximo sábado a las 16:00 de Bogotá', () => {
    expect(bogota(parseDateHint('el sábado en la tarde', NOW))).toBe('2026-10-24T16:00');
  });

  it('un día de la semana siendo ese día es el de la semana siguiente', () => {
    expect(bogota(parseDateHint('el miércoles en la noche', NOW))).toBe('2026-10-28T19:00');
  });

  it('hoy con una franja que ya pasó → null; con una que no, hoy', () => {
    expect(parseDateHint('hoy en la mañana', NOW)).toBeNull();
    expect(bogota(parseDateHint('hoy en la noche', NOW))).toBe('2026-10-21T19:00');
  });

  it('mañana, pasado mañana, y "en la mañana" no se confunde con "mañana"', () => {
    expect(bogota(parseDateHint('mañana', NOW))).toBe('2026-10-22T18:00');
    expect(bogota(parseDateHint('pasado mañana en la tarde', NOW))).toBe('2026-10-23T16:00');
    expect(bogota(parseDateHint('mañana en la mañana', NOW))).toBe('2026-10-22T09:00');
    expect(parseDateHint('el sábado en la mañana', NOW)).toBe('2026-10-24T14:00:00.000Z');
  });

  it('hora explícita', () => {
    expect(bogota(parseDateHint('mañana a las 5 pm', NOW))).toBe('2026-10-22T17:00');
    expect(bogota(parseDateHint('el viernes a las 7 y media de la noche', NOW))).toBe('2026-10-23T19:30');
    expect(bogota(parseDateHint('el domingo a las 8 am', NOW))).toBe('2026-10-25T08:00');
  });

  it('fecha explícita; si ya pasó este año, el siguiente; fechas imposibles → null', () => {
    expect(bogota(parseDateHint('el 5 de noviembre', NOW))).toBe('2026-11-05T18:00');
    expect(bogota(parseDateHint('el 3 de octubre en la tarde', NOW))).toBe('2027-10-03T16:00');
    expect(parseDateHint('el 31 de febrero', NOW)).toBeNull();
  });

  it('fin de semana → sábado', () => {
    expect(bogota(parseDateHint('este fin de semana', NOW))).toBe('2026-10-24T18:00');
  });
});
