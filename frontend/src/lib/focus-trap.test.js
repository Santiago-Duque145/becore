import { describe, expect, it } from 'vitest';
import { nextTabIndex } from './focus-trap.js';

describe('nextTabIndex', () => {
  it('Tab avanza y del último vuelve al primero', () => {
    expect(nextTabIndex(3, 0, false)).toBe(1);
    expect(nextTabIndex(3, 2, false)).toBe(0);
  });

  it('Shift+Tab retrocede y del primero va al último', () => {
    expect(nextTabIndex(3, 2, true)).toBe(1);
    expect(nextTabIndex(3, 0, true)).toBe(2);
  });

  it('con el foco en el propio panel (-1) entra por el primero o el último', () => {
    expect(nextTabIndex(3, -1, false)).toBe(0);
    expect(nextTabIndex(3, -1, true)).toBe(2);
  });

  it('sin elementos enfocables → -1 (se retiene el foco en el panel)', () => {
    expect(nextTabIndex(0, -1, false)).toBe(-1);
  });
});
