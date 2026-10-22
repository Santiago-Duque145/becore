// Estilo propio del mapa vectorial (P6). Parte del estilo base "dark" de OpenFreeMap
// (https://tiles.openfreemap.org/styles/dark: mismas fuentes, glifos y filtros del esquema OpenMapTiles) y lo
// repinta con los colores del mockup (.map-teaser de desktop-panel-organizador.html) y de la skill becore-ui.
// Sin íconos (no hay sprite ni capas de POI) y con etiquetas solo de barrios y vías principales.

// Colores: tierra y calles del mockup; agua = fondo de pantalla; parques = verde de la marca al 14 %.
export const MAP_COLORS = {
  land: '#14202E',
  road: '#1E2C3B',
  roadMajor: '#24364A',
  water: '#0B1420',
  park: 'rgba(16,185,129,0.14)',
  building: '#1A2736',
  label: '#8291A6', // ink-faint
};

// OpenFreeMap solo sirve glifos Noto Sans (Inter da 404), la fuente que ya usa su estilo base
export const MAP_FONT = 'Noto Sans Regular';
export const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
export const VECTOR_SOURCE_URL = 'https://tiles.openfreemap.org/planet';

const lines = ['LineString', 'MultiLineString'];
const polygons = ['Polygon', 'MultiPolygon'];
const geometry = (types) => ['match', ['geometry-type'], types, true, false];
const roadClass = (classes) => ['match', ['get', 'class'], classes, true, false];

const roundLine = { 'line-cap': 'round', 'line-join': 'round' };
const width = (base, z13, z20) => ['interpolate', ['exponential', base], ['zoom'], 13, z13, 20, z20];

// Etiquetas: solo texto (sin íconos), con un halo del color de la tierra para que se lean sobre calles y parques
const labelPaint = { 'text-color': MAP_COLORS.label, 'text-halo-color': MAP_COLORS.land, 'text-halo-width': 1.4, 'text-halo-blur': 0.5 };
const placeName = ['coalesce', ['get', 'name:latin'], ['get', 'name']];

export function buildMapStyle() {
  return {
    version: 8,
    name: 'Be Core',
    glyphs: GLYPHS_URL,
    sources: { openmaptiles: { type: 'vector', url: VECTOR_SOURCE_URL } },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': MAP_COLORS.land } },

      // Zonas verdes: bosque y pasto (landcover) y parques, canchas y cementerios (landuse)
      {
        id: 'landcover_green',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['all', geometry(polygons), roadClass(['wood', 'grass'])],
        paint: { 'fill-color': MAP_COLORS.park },
      },
      {
        id: 'landuse_green',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        filter: ['all', geometry(polygons), roadClass(['park', 'pitch', 'playground', 'cemetery'])],
        paint: { 'fill-color': MAP_COLORS.park },
      },

      // Agua
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        filter: ['all', geometry(polygons), ['!=', ['get', 'brunnel'], 'tunnel']],
        paint: { 'fill-color': MAP_COLORS.water },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        filter: geometry(lines),
        paint: { 'line-color': MAP_COLORS.water, 'line-width': width(1.4, 1, 6) },
      },

      // Edificios: apenas visibles
      {
        id: 'building',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 13,
        filter: geometry(polygons),
        paint: { 'fill-color': MAP_COLORS.building, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 15, 0.55] },
      },

      // Calles: las menores en #1E2C3B y las principales un poco más claras y anchas en #24364A
      {
        id: 'road_path',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 14,
        filter: ['all', geometry(lines), ['==', ['get', 'class'], 'path']],
        layout: roundLine,
        paint: { 'line-color': MAP_COLORS.road, 'line-width': width(1.4, 0.6, 3), 'line-opacity': 0.8 },
      },
      {
        id: 'road_minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 11,
        filter: ['all', geometry(lines), roadClass(['minor', 'service', 'track'])],
        layout: roundLine,
        paint: { 'line-color': MAP_COLORS.road, 'line-width': width(1.55, 1.8, 20) },
      },
      {
        id: 'road_major',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 8,
        filter: ['all', geometry(lines), roadClass(['primary', 'secondary', 'tertiary', 'trunk'])],
        layout: roundLine,
        paint: { 'line-color': MAP_COLORS.roadMajor, 'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 8, 0.8, 13, 3, 20, 26] },
      },
      {
        id: 'road_motorway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 6,
        filter: ['all', geometry(lines), ['==', ['get', 'class'], 'motorway']],
        layout: roundLine,
        paint: { 'line-color': MAP_COLORS.roadMajor, 'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 6, 1, 13, 4, 20, 30] },
      },

      // Etiquetas: solo vías principales y barrios
      {
        id: 'label_road',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 12,
        filter: ['all', geometry(lines), roadClass(['motorway', 'trunk', 'primary', 'secondary'])],
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 350,
          'text-field': placeName,
          'text-font': [MAP_FONT],
          'text-size': 10.5,
          'text-max-angle': 30,
        },
        paint: labelPaint,
      },
      {
        id: 'label_neighbourhood',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        minzoom: 11,
        maxzoom: 17,
        filter: ['all', ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false], roadClass(['suburb', 'neighbourhood', 'quarter'])],
        layout: {
          'text-field': placeName,
          'text-font': [MAP_FONT],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 12],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.06,
          'text-max-width': 8,
        },
        paint: labelPaint,
      },
    ],
  };
}

// Capas que pintan texto: la prueba comprueba que todas usen la fuente de OpenFreeMap y que no haya íconos
export const LABEL_LAYER_IDS = ['label_road', 'label_neighbourhood'];
