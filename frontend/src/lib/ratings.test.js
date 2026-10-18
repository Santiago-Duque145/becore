import { describe, it, expect } from 'vitest';
import { RATING_TAGS } from '../constants/ratings.js';
import { canRateEvent, formatAverage, overallAverage } from './ratings.js';

const DAY = 24 * 3600 * 1000;
const base = {
  status: 'finished',
  myAttendance: { status: 'confirmed', checkedIn: true },
  finishedAt: new Date(Date.now() - DAY).toISOString(),
};

describe('canRateEvent', () => {
  it('permite calificar con check-in dentro de 7 días', () => expect(canRateEvent(base)).toBe(true));
  it('no si no hizo check-in', () => expect(canRateEvent({ ...base, myAttendance: { checkedIn: false } })).toBe(false));
  it('no si el evento no terminó', () => expect(canRateEvent({ ...base, status: 'in_progress' })).toBe(false));
  it('no fuera del plazo', () =>
    expect(canRateEvent({ ...base, finishedAt: new Date(Date.now() - 8 * DAY).toISOString() })).toBe(false));
});

describe('promedios', () => {
  it('formatea con coma', () => expect(formatAverage(4.6)).toBe('4,6'));
  it('promedio general ponderado', () =>
    expect(overallAverage([{ average: 5, total: 1 }, { average: 4, total: 3 }, null])).toEqual({ average: 4.3, total: 4 }));
  it('sin calificaciones → null', () =>
    expect(overallAverage([{ average: null, total: 0 }])).toEqual({ average: null, total: 0 }));
});

describe('etiquetas', () => {
  it('coinciden con las del backend', async () => {
    const { readFile } = await import('node:fs/promises');
    const src = await readFile(new URL('../../../backend/src/constants/ratings.js', import.meta.url), 'utf8');
    const backend = [...src.match(/RATING_TAGS = \[([^\]]+)\]/)[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(RATING_TAGS.map((t) => t.slug)).toEqual(backend);
  });
});
