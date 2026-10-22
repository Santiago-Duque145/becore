import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { GEO_MESSAGES, canUseGeolocation, formatDistance, geoErrorStatus, haversineKm, locate } from './geo.js';

const MEDELLIN = { lat: 6.2442, lng: -75.5812 };
const BOGOTA = { lat: 4.711, lng: -74.0721 };

describe('haversineKm', () => {
  it('da 0 para el mismo punto', () => {
    expect(haversineKm(MEDELLIN, MEDELLIN)).toBe(0);
  });

  it('un grado de longitud en el ecuador mide ~111,19 km', () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111.19, 1);
  });

  it('Medellín–Bogotá en línea recta está entre 235 y 245 km, y es simétrica', () => {
    const km = haversineKm(MEDELLIN, BOGOTA);
    expect(km).toBeGreaterThan(235);
    expect(km).toBeLessThan(245);
    expect(haversineKm(BOGOTA, MEDELLIN)).toBeCloseTo(km, 9);
  });
});

describe('formatDistance', () => {
  it('usa metros por debajo de 1 km y coma decimal de Colombia', () => {
    expect(formatDistance(0.347)).toBe('a 350 m');
    expect(formatDistance(0.001)).toBe('a 10 m');
    expect(formatDistance(1.84)).toBe('a 1,8 km');
    expect(formatDistance(12.4)).toBe('a 12 km');
  });
});

describe('canUseGeolocation', () => {
  it('exige contexto seguro y la API del navegador', () => {
    expect(canUseGeolocation({ isSecureContext: true, geolocation: {} })).toBe(true);
    expect(canUseGeolocation({ isSecureContext: false, geolocation: {} })).toBe(false);
    expect(canUseGeolocation({ isSecureContext: true, geolocation: undefined })).toBe(false);
  });
});

describe('locate', () => {
  it('devuelve solo latitud, longitud y precisión', async () => {
    const geolocation = {
      getCurrentPosition: vi.fn((ok) => ok({ coords: { latitude: 6.25, longitude: -75.56, accuracy: 30, altitude: 1500 }, timestamp: 1 })),
    };
    await expect(locate(geolocation)).resolves.toEqual({
      status: 'granted',
      position: { lat: 6.25, lng: -75.56, accuracy: 30 },
      error: null,
    });
    expect(geolocation.getCurrentPosition.mock.calls[0][2]).toMatchObject({ timeout: 10_000 });
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ])('el error %i del navegador queda como "%s" con un mensaje en español', async (code, status) => {
    const geolocation = { getCurrentPosition: (_ok, fail) => fail({ code }) };
    await expect(locate(geolocation)).resolves.toEqual({ status, position: null, error: GEO_MESSAGES[status] });
    expect(geoErrorStatus({ code })).toBe(status);
  });
});

describe('privacidad de la ubicación', () => {
  it('ni la lógica ni el hook envían o guardan la posición', () => {
    const files = ['./geo.js', '../hooks/useGeolocation.js', '../components/events/NearMeButton.jsx'];
    for (const file of files) {
      const code = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(code).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|fetch\(|axios|services\/|lib\/api|supabase/);
    }
  });

  it('el hook no pide permiso al montar: solo dentro de request()', () => {
    const hook = readFileSync(new URL('../hooks/useGeolocation.js', import.meta.url), 'utf8');
    const calls = hook.match(/locate\(/g) ?? [];
    expect(calls).toHaveLength(1);
    expect(hook).toMatch(/const request = useCallback\(async \(\) => \{[\s\S]*locate\(navigator\.geolocation\)/);
  });
});
