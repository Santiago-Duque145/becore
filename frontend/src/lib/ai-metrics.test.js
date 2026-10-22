import { describe, it, expect } from 'vitest';
import { comparisonRows, formatRate, formatStars, hasData, isSmallSample, sourceLine } from './ai-metrics.js';

const m = (rules, ai, bySource = { gemini: { shown: 2, confirmed: 1 }, template: { shown: 1, confirmed: 0 } }) => ({
  rules: { users: 2, shown: 3, clicked: 1, confirmed: 1, ctr: 0.333, confirmRate: 0.333, avgRating: 4, ...rules },
  ai: { users: 1, shown: 2, clicked: 1, confirmed: 1, ctr: 0.5, confirmRate: 0.5, avgRating: null, bySource, ...ai },
});

describe('métricas de la prueba A/B', () => {
  it('tasas en porcentaje y "—" sin datos', () => {
    expect(formatRate(0.333)).toBe('33 %');
    expect(formatRate(null)).toBe('—');
    expect(formatStars(4.25)).toBe('4,3 ★');
    expect(formatStars(null)).toBe('—');
  });

  it('filas reglas vs IA', () => {
    expect(comparisonRows(m())).toEqual([
      ['Personas', 2, 1],
      ['Mostrados', 3, 2],
      ['Abiertos (CTR)', '1 · 33 %', '1 · 50 %'],
      ['Confirmados', '1 · 33 %', '1 · 50 %'],
      ['Calificación', '4,0 ★', '—'],
    ]);
  });

  it('separa Gemini de la plantilla dentro de la variante IA', () => {
    expect(sourceLine(m().ai.bySource)).toBe('Frases de Gemini: 2 mostrados, 1 confirmados · Plantilla: 1 mostrados, 0 confirmados');
  });

  it('muestra pequeña con menos de 30 personas en alguna variante; sin mostrados no hay datos', () => {
    expect(isSmallSample(m())).toBe(true);
    expect(isSmallSample(m({ users: 40 }, { users: 31 }))).toBe(false);
    expect(hasData(m({ shown: 0 }, { shown: 0 }))).toBe(false);
  });
});
