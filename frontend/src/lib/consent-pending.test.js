import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearConsentPending, markConsentPending, takeConsentPending } from './consent-pending.js';

function fakeSessionStorage() {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

describe('consent-pending', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', fakeSessionStorage());
    vi.useRealTimers();
  });

  it('sin marca → false', () => {
    expect(takeConsentPending()).toBe(false);
  });

  it('con marca → true una sola vez', () => {
    markConsentPending();
    expect(takeConsentPending()).toBe(true);
    expect(takeConsentPending()).toBe(false);
  });

  it('si el registro falló y se limpió, no cuenta como aceptado', () => {
    markConsentPending();
    clearConsentPending();
    expect(takeConsentPending()).toBe(false);
  });

  it('vencida a los 10 minutos → false', () => {
    vi.useFakeTimers();
    markConsentPending();
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(takeConsentPending()).toBe(false);
  });

  it('sin acceso al almacenamiento no lanza', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => markConsentPending()).not.toThrow();
    expect(takeConsentPending()).toBe(false);
  });
});
