import { describe, it, expect } from 'vitest';
import { DEFAULT_DURATION_MS, endLabel, eventEnd } from './event-time.js';

const starts = '2026-10-31T20:00:00.000Z'; // 3:00 p. m. en Bogotá
const norm = (s) => s.replace(/\s/g, ' ');

describe('eventEnd', () => {
  it('sin ends_at suma 2 horas al inicio y es estimada', () =>
    expect(eventEnd({ startsAt: starts })).toEqual({ iso: '2026-10-31T22:00:00.000Z', estimated: true }));
  it('con ends_at usa ese valor', () =>
    expect(eventEnd({ startsAt: starts, endsAt: '2026-10-31T21:30:00.000Z' })).toEqual({
      iso: '2026-10-31T21:30:00.000Z',
      estimated: false,
    }));
  it('la duración por defecto es de 2 h', () => expect(DEFAULT_DURATION_MS).toBe(7_200_000));
});

describe('endLabel', () => {
  const withEnd = '2026-10-31T21:30:00.000Z';
  it('publicado sin fin', () =>
    expect(norm(endLabel({ status: 'published', startsAt: starts }))).toBe('Termina aprox. 5:00 p. m. (2 h por defecto)'));
  it('publicado con fin', () =>
    expect(norm(endLabel({ status: 'published', startsAt: starts, endsAt: withEnd }))).toBe('Termina 4:30 p. m.'));
  it('en curso sin fin', () =>
    expect(norm(endLabel({ status: 'in_progress', startsAt: starts }))).toBe('En curso · termina aprox. 5:00 p. m.'));
  it('en curso con fin', () =>
    expect(norm(endLabel({ status: 'in_progress', startsAt: starts, endsAt: withEnd }))).toBe('En curso · termina 4:30 p. m.'));
  it('no aplica a finalizados, cancelados ni borradores', () => {
    for (const status of ['finished', 'cancelled', 'draft']) expect(endLabel({ status, startsAt: starts })).toBeNull();
  });
});
