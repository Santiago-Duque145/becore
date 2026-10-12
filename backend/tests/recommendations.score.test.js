import { describe, it, expect } from 'vitest';
import { bogotaDayAndSlot, normalizeText, rankScored, scoreEvent } from '../src/services/recommendations/score.js';

// Fechas fijas en UTC; Bogotá es UTC-5 todo el año
const SAT_8AM = '2026-10-31T13:00:00.000Z'; // sábado 31 oct, 8:00 a.m. Bogotá
const TUE_7PM = '2026-11-04T00:00:00.000Z'; // martes 3 nov, 7:00 p.m. Bogotá (miércoles en UTC)
const FRI_2PM = '2026-10-30T19:00:00.000Z'; // viernes 30 oct, 2:00 p.m. Bogotá

const event = (over = {}) => ({ id: 'e1', category: 'other', location: 'Cancha', startsAt: SAT_8AM, ...over });
const noPrefs = { categories: [], days: [], timeSlots: [], zone: null };

describe('bogotaDayAndSlot', () => {
  it('usa la hora de Bogotá, no la de UTC', () => {
    expect(bogotaDayAndSlot(TUE_7PM)).toEqual({ day: 'weekdays', slot: 'evening' });
    expect(bogotaDayAndSlot(SAT_8AM)).toEqual({ day: 'weekends', slot: 'morning' });
    expect(bogotaDayAndSlot(FRI_2PM)).toEqual({ day: 'weekdays', slot: 'afternoon' });
  });

  it('límites de franja: 12:00 ya es tarde y 18:00 ya es noche', () => {
    expect(bogotaDayAndSlot('2026-10-30T16:59:00.000Z').slot).toBe('morning'); // 11:59
    expect(bogotaDayAndSlot('2026-10-30T17:00:00.000Z').slot).toBe('afternoon'); // 12:00
    expect(bogotaDayAndSlot('2026-10-30T23:00:00.000Z').slot).toBe('evening'); // 18:00
  });
});

describe('scoreEvent', () => {
  it('sin preferencias o sin coincidencias → 0 y sin reason', () => {
    expect(scoreEvent(event(), null)).toEqual({ score: 0, reason: null });
    expect(scoreEvent(event(), noPrefs)).toEqual({ score: 0, reason: null });
  });

  it('categoría: +3 con su reason', () => {
    expect(scoreEvent(event({ category: 'sport' }), { ...noPrefs, categories: ['sport'] })).toEqual({
      score: 3,
      reason: 'Porque te gusta el deporte',
    });
    expect(scoreEvent(event({ category: 'culture' }), { ...noPrefs, categories: ['culture'] }).reason).toBe(
      'Porque te gusta la cultura',
    );
  });

  it('día: +1 (sábado = fines de semana)', () => {
    expect(scoreEvent(event(), { ...noPrefs, days: ['weekends'] })).toEqual({
      score: 1,
      reason: 'Encaja con tus fines de semana',
    });
    expect(scoreEvent(event(), { ...noPrefs, days: ['weekdays'] }).score).toBe(0);
  });

  it('franja: +1', () => {
    expect(scoreEvent(event({ startsAt: TUE_7PM }), { ...noPrefs, timeSlots: ['evening'] })).toEqual({
      score: 1,
      reason: 'Encaja con tus noches',
    });
  });

  it('zona: +1 sin importar tildes ni mayúsculas; vacía no cuenta', () => {
    const e = event({ location: 'Parque de BELÉN, Medellín' });
    expect(scoreEvent(e, { ...noPrefs, zone: 'belen' })).toEqual({ score: 1, reason: 'Es en tu zona' });
    expect(scoreEvent(e, { ...noPrefs, zone: '   ' }).score).toBe(0);
    expect(scoreEvent(e, { ...noPrefs, zone: 'Laureles' }).score).toBe(0);
  });

  it('suma todas las señales y la reason es la más fuerte', () => {
    const prefs = { categories: ['sport'], days: ['weekends'], timeSlots: ['morning'], zone: 'Belén' };
    expect(scoreEvent(event({ category: 'sport', location: 'Cancha de Belén' }), prefs)).toEqual({
      score: 6,
      reason: 'Porque te gusta el deporte',
    });
  });

  it('empate de señales de 1 punto: zona, luego días, luego franja', () => {
    const prefs = { categories: [], days: ['weekends'], timeSlots: ['morning'], zone: 'belen' };
    expect(scoreEvent(event({ location: 'Belén' }), prefs).reason).toBe('Es en tu zona');
    expect(scoreEvent(event(), prefs).reason).toBe('Encaja con tus fines de semana');
  });

  it('"other" nunca suma por categoría', () => {
    expect(scoreEvent(event({ category: 'other' }), { ...noPrefs, categories: ['sport', 'culture', 'recreation'] }).score).toBe(0);
  });
});

describe('rankScored', () => {
  const item = (id, score, startsAt) => ({ event: { id, startsAt }, score, reason: 'x' });

  it('puntaje desc, luego fecha asc; excluye 0 y respeta el límite', () => {
    const ranked = rankScored(
      [
        item('a', 1, '2026-11-01T00:00:00Z'),
        item('b', 3, '2026-11-05T00:00:00Z'),
        item('c', 3, '2026-11-02T00:00:00Z'),
        item('d', 0, '2026-10-30T00:00:00Z'),
        item('e', 1, '2026-10-31T00:00:00Z'),
      ],
      3,
    );
    expect(ranked.map((r) => r.event.id)).toEqual(['c', 'b', 'e']);
  });

  it('desempate final por id para que el orden sea estable', () => {
    const at = '2026-11-01T00:00:00Z';
    expect(rankScored([item('z', 2, at), item('a', 2, at)], 6).map((r) => r.event.id)).toEqual(['a', 'z']);
  });
});

describe('normalizeText', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizeText('  Belén ÑUÑOA ')).toBe('belen nunoa');
    expect(normalizeText(null)).toBe('');
  });
});
