import { describe, it, expect } from 'vitest';
import { LOADING_PHRASES, LOADER_DELAY_MS, LOADER_MIN_VISIBLE_MS, LOADER_SLOW_MS, PHRASE_INTERVAL_MS, SLOW_MESSAGE } from '../constants/loading.js';
import { nextPhrase, planLoader } from './loader-timing.js';

describe('planLoader: 300 ms antes de aparecer y mínimo 500 ms visible', () => {
  it('una carga activa programa el loader a los 300 ms', () => {
    expect(planLoader({ active: true, visible: false })).toEqual({ action: 'show', in: LOADER_DELAY_MS });
    expect(LOADER_DELAY_MS).toBe(300);
  });
  it('si ya se ve y la carga sigue, no hace nada', () => {
    expect(planLoader({ active: true, visible: true })).toEqual({ action: 'none', in: 0 });
  });
  it('una carga que termina antes de los 300 ms nunca lo muestra', () => {
    expect(planLoader({ active: false, visible: false })).toEqual({ action: 'none', in: 0 });
  });
  it('al terminar, se queda lo que le falte para cumplir 500 ms', () => {
    expect(LOADER_MIN_VISIBLE_MS).toBe(500);
    expect(planLoader({ active: false, visible: true, shownAt: 1000, now: 1100 })).toEqual({ action: 'hide', in: 400 });
    expect(planLoader({ active: false, visible: true, shownAt: 1000, now: 1500 })).toEqual({ action: 'hide', in: 0 });
    expect(planLoader({ active: false, visible: true, shownAt: 1000, now: 4000 })).toEqual({ action: 'hide', in: 0 });
  });
});

describe('frases de carga', () => {
  it('incluye las del plan, todas con puntos suspensivos', () => {
    for (const phrase of ['Calentando motores…', 'Inflando el balón…', 'Afinando la guitarra…', 'Reuniendo a la comunidad…', 'Marcando la cancha…', 'Preparando el escenario…', 'Contando los cupos…']) {
      expect(LOADING_PHRASES).toContain(phrase);
    }
    for (const phrase of LOADING_PHRASES) expect(phrase.endsWith('…')).toBe(true);
  });
  it('alterna deporte y cultura al empezar', () => {
    expect(LOADING_PHRASES.slice(0, 4)).toEqual(['Calentando motores…', 'Afinando la guitarra…', 'Inflando el balón…', 'Preparando el escenario…']);
  });
  it('rotan cada 1,8 s y vuelven al principio', () => {
    expect(PHRASE_INTERVAL_MS).toBe(1800);
    expect(nextPhrase(0, 7)).toBe(1);
    expect(nextPhrase(6, 7)).toBe(0);
    expect(nextPhrase(0, 0)).toBe(0);
  });
  it('a los 8 s pasa a "Esto está tardando más de lo normal…"', () => {
    expect(LOADER_SLOW_MS).toBe(8000);
    expect(SLOW_MESSAGE).toBe('Esto está tardando más de lo normal…');
  });
});
