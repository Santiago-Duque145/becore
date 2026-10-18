import { describe, it, expect } from 'vitest';
import { CONFETTI_COLORS, CONFETTI_MAX_DELAY_MS, confettiPieces } from './confetti.js';

describe('confettiPieces', () => {
  const pieces = confettiPieces();

  it('genera entre 20 y 30 piezas, siempre iguales', () => {
    expect(pieces.length).toBeGreaterThanOrEqual(20);
    expect(pieces.length).toBeLessThanOrEqual(30);
    expect(confettiPieces()).toEqual(pieces);
  });

  it('usa solo colores de la marca y los usa todos', () => {
    const used = new Set(pieces.map((p) => p.color));
    expect([...used].every((c) => CONFETTI_COLORS.includes(c))).toBe(true);
    expect(used.size).toBe(CONFETTI_COLORS.length);
  });

  it('ninguna pieza arranca tan tarde que pase de 1.5 s con la animación de 1.4 s', () => {
    expect(Math.max(...pieces.map((p) => p.delayMs))).toBeLessThanOrEqual(CONFETTI_MAX_DELAY_MS);
  });
});
