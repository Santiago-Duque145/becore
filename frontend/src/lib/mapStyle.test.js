import { describe, it, expect } from 'vitest';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { GLYPHS_URL, LABEL_LAYER_IDS, MAP_COLORS, MAP_FONT, VECTOR_SOURCE_URL, buildMapStyle } from './mapStyle.js';

const style = buildMapStyle();
const layer = (id) => style.layers.find((l) => l.id === id);

describe('estilo del mapa vectorial', () => {
  it('es un estilo válido para MapLibre', () => {
    expect(validateStyleMin(style)).toEqual([]);
  });

  it('usa los colores del mockup y de la skill', () => {
    expect(layer('background').paint['background-color']).toBe('#14202E'); // tierra
    expect(layer('water').paint['fill-color']).toBe('#0B1420'); // agua
    expect(layer('road_minor').paint['line-color']).toBe('#1E2C3B'); // calles
    expect(layer('road_major').paint['line-color']).toBe('#24364A'); // principales, un poco más claras
    expect(layer('road_motorway').paint['line-color']).toBe('#24364A');
    expect(layer('landuse_green').paint['fill-color']).toBe('rgba(16,185,129,0.14)'); // parques
    expect(layer('landcover_green').paint['fill-color']).toBe('rgba(16,185,129,0.14)');
    expect(MAP_COLORS.label).toBe('#8291A6');
  });

  it('los edificios casi no se ven', () => {
    expect(JSON.stringify(layer('building').paint['fill-opacity'])).toContain('0.55'); // nunca opaco del todo
    expect(layer('building').minzoom).toBeGreaterThanOrEqual(13);
  });

  it('las calles principales son más claras y más anchas que las menores', () => {
    expect(MAP_COLORS.roadMajor).not.toBe(MAP_COLORS.road);
    expect(JSON.stringify(layer('road_major').paint['line-width'])).toContain('26');
    expect(JSON.stringify(layer('road_minor').paint['line-width'])).toContain('20');
  });

  it('solo hay etiquetas de vías principales y de barrios, en #8291A6 y con la fuente de OpenFreeMap', () => {
    const symbols = style.layers.filter((l) => l.type === 'symbol');
    expect(symbols.map((l) => l.id).sort()).toEqual([...LABEL_LAYER_IDS].sort());
    for (const l of symbols) {
      expect(l.layout['text-font']).toEqual([MAP_FONT]);
      expect(l.paint['text-color']).toBe('#8291A6');
    }
    const roads = JSON.stringify(layer('label_road').filter);
    expect(roads).toContain('motorway');
    expect(roads).toContain('primary');
    expect(roads).not.toContain('minor'); // nada de calles menores
    const barrios = JSON.stringify(layer('label_neighbourhood').filter);
    expect(barrios).toContain('suburb');
    expect(barrios).toContain('neighbourhood');
    expect(barrios).not.toContain('"city"');
  });

  it('la fuente es Noto Sans Regular (la que sirve OpenFreeMap; Inter no existe allí)', () => {
    expect(MAP_FONT).toBe('Noto Sans Regular');
    expect(GLYPHS_URL).toBe('https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf');
    expect(style.glyphs).toBe(GLYPHS_URL);
  });

  it('sin íconos: no hay sprite, ni capas de POI, ni icon-image', () => {
    expect(style).not.toHaveProperty('sprite');
    expect(style.layers.some((l) => l['source-layer'] === 'poi')).toBe(false);
    expect(JSON.stringify(style)).not.toMatch(/icon-image|"poi"/);
  });

  it('lee las teselas vectoriales de OpenFreeMap sin clave', () => {
    expect(style.sources.openmaptiles).toEqual({ type: 'vector', url: VECTOR_SOURCE_URL });
    expect(VECTOR_SOURCE_URL).toBe('https://tiles.openfreemap.org/planet');
    expect(JSON.stringify(style)).not.toMatch(/key=|apikey|access_token/i);
  });

  it('los ids de las capas no se repiten y cada capa usa una fuente que existe', () => {
    const ids = style.layers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of style.layers) if (l.source) expect(style.sources).toHaveProperty(l.source);
  });

  it('cada llamada devuelve un estilo nuevo (MapLibre puede mutarlo)', () => {
    expect(buildMapStyle()).not.toBe(buildMapStyle());
    expect(buildMapStyle()).toEqual(buildMapStyle());
  });
});
