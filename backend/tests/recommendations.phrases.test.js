import { describe, it, expect } from 'vitest';
import { CATEGORY_NOUNS, FALLBACK_REASON, INTEREST_NOUNS, MAX_PHRASE_LENGTH, phrase, weekdayOf } from '../src/services/recommendations/phrases.js';
import { INTEREST_SLUGS } from '../src/constants/preferences.js';

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const SLOTS = [null, 'morning', 'afternoon', 'evening'];

describe('frases de "Para ti" (P8)', () => {
  it('hay sustantivo para cada gusto del onboarding', () => {
    expect(Object.keys(INTEREST_NOUNS).sort()).toEqual([...INTEREST_SLUGS].sort());
  });

  it('todas las combinaciones caben en 60 caracteres y no mencionan IA ni Gemini', () => {
    const likes = [null, ...Object.values(INTEREST_NOUNS), ...Object.values(CATEGORY_NOUNS)];
    const all = [];
    for (const like of likes)
      for (const weekday of [null, ...WEEKDAYS])
        for (const slot of SLOTS) for (const inZone of [false, true]) all.push(phrase({ like, weekday, slot, inZone }));
    const longest = all.reduce((a, b) => (b.length > a.length ? b : a));
    expect(longest.length).toBeLessThanOrEqual(MAX_PHRASE_LENGTH);
    expect(all.filter((p) => /\bIA\b|gemini|inteligencia/i.test(p))).toEqual([]);
  });

  it('dice qué y cuándo con lo que coincide, sin prometer', () => {
    expect(phrase({ like: 'Fútbol', weekday: 'sábado', slot: 'afternoon' })).toBe('Fútbol el sábado en la tarde, como te gusta');
    expect(phrase({ like: 'Cine', weekday: 'jueves' })).toBe('Cine el jueves, como te gusta');
    expect(phrase({ like: 'Juegos de mesa' })).toBe('Juegos de mesa, de lo que más te gusta');
    expect(phrase({ weekday: 'domingo', slot: 'morning' })).toBe('El domingo en la mañana, justo en tu horario');
    expect(phrase({ slot: 'evening' })).toBe('En la noche, justo en tu horario');
    expect(phrase({ inZone: true })).toBe('Queda en tu zona');
    expect(phrase({})).toBe(FALLBACK_REASON);
  });

  it('el día sale en hora de Bogotá', () => {
    expect(weekdayOf('2026-11-01T03:00:00Z')).toBe('sábado'); // sábado 31 oct, 10 p. m. en Bogotá
  });
});
