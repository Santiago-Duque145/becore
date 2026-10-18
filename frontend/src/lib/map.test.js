import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TILES_URL,
  boundsOf,
  directionsLinks,
  hasCoordinates,
  isValidPoint,
  pinColor,
  sortByDistance,
  tilesUrl,
  withDistance,
} from './map.js';

const medellin = { lat: 6.2442, lng: -75.5812 };
const ev = (id, latitude, longitude, extra = {}) => ({ id, latitude, longitude, ...extra });

describe('teselas', () => {
  it('usa las de CARTO por defecto y respeta VITE_MAP_TILES_URL', () => {
    expect(tilesUrl(undefined)).toBe(DEFAULT_TILES_URL);
    expect(tilesUrl('   ')).toBe(DEFAULT_TILES_URL);
    expect(tilesUrl(' https://x.test/{z}/{x}/{y}.png ')).toBe('https://x.test/{z}/{x}/{y}.png');
  });
});

describe('pines por categoría', () => {
  it('turquesa deporte, amarillo cultura, verde recreación y gris otros', () => {
    expect(pinColor('sport')).toBe('var(--color-accent)');
    expect(pinColor('culture')).toBe('var(--color-culture)');
    expect(pinColor('recreation')).toBe('var(--color-success)');
    expect(pinColor('other')).toBe('var(--color-ink-muted)');
    expect(pinColor('desconocida')).toBe('var(--color-ink-muted)');
  });
});

describe('hasCoordinates / isValidPoint', () => {
  it('detecta eventos con y sin ubicación', () => {
    expect(hasCoordinates(ev('a', 6.2, -75.5))).toBe(true);
    expect(hasCoordinates(ev('b', null, null))).toBe(false);
    expect(hasCoordinates({})).toBe(false);
  });
  it('0,0 es una ubicación válida (no se confunde con "sin ubicación")', () => expect(hasCoordinates(ev('c', 0, 0))).toBe(true));
  it('rangos de latitud y longitud', () => {
    expect(isValidPoint({ lat: 90, lng: 180 })).toBe(true);
    expect(isValidPoint({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidPoint({ lat: 0, lng: -181 })).toBe(false);
    expect(isValidPoint(null)).toBe(false);
  });
});

describe('Cómo llegar', () => {
  it('arma los enlaces de Google Maps y Waze con el destino', () => {
    const links = directionsLinks({ lat: 6.2093, lng: -75.5679 });
    expect(links.google).toBe('https://www.google.com/maps/dir/?api=1&destination=6.2093,-75.5679');
    expect(links.waze).toBe('https://waze.com/ul?ll=6.2093,-75.5679&navigate=yes');
  });
});

describe('distancia y orden por cercanía', () => {
  const events = [ev('lejos', 6.29, -75.5428), ev('sin'), ev('cerca', 6.2565, -75.5902), ev('medio', 6.2304, -75.6055)];

  it('sin posición no cambia nada (todo funciona igual sin distancias)', () => {
    expect(withDistance(events, null)).toBe(events);
    expect(events.some((e) => 'distanceKm' in e)).toBe(false);
  });

  it('calcula la distancia solo de los eventos con ubicación', () => {
    const withKm = withDistance(events, medellin);
    expect(withKm.find((e) => e.id === 'cerca').distanceKm).toBeGreaterThan(0);
    expect(withKm.find((e) => e.id === 'sin')).not.toHaveProperty('distanceKm');
    const cerca = withKm.find((e) => e.id === 'cerca').distanceKm;
    expect(cerca).toBeLessThan(3);
  });

  it('ordena de menor a mayor distancia y deja al final los que no tienen ubicación', () => {
    const sorted = sortByDistance(withDistance(events, medellin));
    expect(sorted.at(-1).id).toBe('sin');
    const kms = sorted.slice(0, -1).map((e) => e.distanceKm);
    expect(kms).toEqual([...kms].sort((a, b) => a - b));
  });

  it('no modifica la lista original', () => {
    const copy = [...events];
    sortByDistance(withDistance(events, medellin));
    expect(events).toEqual(copy);
  });
});

describe('boundsOf', () => {
  it('encuadra los puntos válidos', () =>
    expect(boundsOf([{ lat: 6.2, lng: -75.6 }, { lat: 6.3, lng: -75.5 }, null])).toEqual([[6.2, -75.6], [6.3, -75.5]]));
  it('sin puntos devuelve null', () => expect(boundsOf([])).toBeNull());
});
