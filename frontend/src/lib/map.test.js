import { describe, it, expect } from 'vitest';
import {
  TILES_ATTRIBUTION,
  TILES_MAX_ZOOM,
  TILES_URL,
  boundsOf,
  directionsLinks,
  hasCoordinates,
  isActiveEvent,
  isValidPoint,
  pinColor,
  sortByDistance,
  withDistance,
} from './map.js';

const medellin = { lat: 6.2442, lng: -75.5812 };
const ev = (id, latitude, longitude, extra = {}) => ({ id, latitude, longitude, ...extra });

describe('teselas', () => {
  it('son las de OpenStreetMap estándar, sin clave, en una sola constante', () => {
    expect(TILES_URL).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(TILES_URL).not.toMatch(/carto|key|apikey/i);
    expect(TILES_MAX_ZOOM).toBe(19);
  });
  it('llevan la atribución obligatoria "© OpenStreetMap contributors"', () => {
    expect(TILES_ATTRIBUTION).toContain('&copy;');
    expect(TILES_ATTRIBUTION).toContain('OpenStreetMap</a> contributors');
    expect(TILES_ATTRIBUTION).toContain('openstreetmap.org/copyright');
  });
  it('ningún componente define otra URL de teselas ni usa variables de entorno para ello', async () => {
    const { readdir, readFile } = await import('node:fs/promises');
    const dir = new URL('../components/map/', import.meta.url);
    for (const file of await readdir(dir)) {
      if (!/\.(jsx?|css)$/.test(file)) continue;
      const code = await readFile(new URL(file, dir), 'utf8');
      expect(code, file).not.toMatch(/https?:\/\/[^'"\s]*\{z\}/);
      expect(code, file).not.toMatch(/VITE_MAP_TILES_URL/);
    }
  });
  it('el oscurecido es un filtro CSS solo en la capa de teselas', async () => {
    const { readFile } = await import('node:fs/promises');
    const css = await readFile(new URL('../components/map/map.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.leaflet-tile-pane\s*\{[^}]*filter:\s*invert\(1\)/);
    // ningún otro selector (pines, popups, controles) lleva invert()
    expect(css.match(/invert\(/g)).toHaveLength(1);
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

describe('Mapa en vivo: eventos activos', () => {
  // Estados reales de la base de pruebas: santiago@becore.test solo tiene cancelados y finalizados
  const states = ['draft', 'published', 'in_progress', 'finished', 'cancelled'];

  it('solo publicados y en curso son activos', () => {
    expect(states.filter((status) => isActiveEvent({ status }))).toEqual(['published', 'in_progress']);
  });

  it('un organizador con solo eventos cancelados y finalizados no tiene eventos activos', () => {
    const events = [{ status: 'cancelled' }, { status: 'cancelled' }, { status: 'finished' }, { status: 'finished' }];
    expect(events.filter(isActiveEvent)).toEqual([]);
  });

  it('un evento activo sin coordenadas aparece en la lista pero no como pin', () => {
    const avengers = { status: 'published', latitude: null, longitude: null };
    expect(isActiveEvent(avengers)).toBe(true);
    expect(hasCoordinates(avengers)).toBe(false);
  });

  it('no falla con datos vacíos', () => expect(isActiveEvent(undefined)).toBe(false));
});

describe('Cerca de mí con eventos sin ubicación', () => {
  const located = (id, latitude, longitude) => ({ id, latitude, longitude });
  const user = { lat: 6.1762, lng: -75.5917 }; // cerca de Viva Envigado

  it('el evento sin coordenadas no muestra distancia y va al final con "Más cerca primero"', () => {
    const events = [located('sin', null, null), located('lejos', 6.29, -75.5428), located('viva', 6.1762915, -75.5916923)];
    const sorted = sortByDistance(withDistance(events, user));
    expect(sorted.map((e) => e.id)).toEqual(['viva', 'lejos', 'sin']);
    expect(sorted[2]).not.toHaveProperty('distanceKm');
    expect(sorted[0].distanceKm).toBeLessThan(0.1);
  });
});
