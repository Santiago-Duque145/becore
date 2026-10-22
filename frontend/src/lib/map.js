import { haversineKm } from './geo.js';

// Reglas puras del mapa de eventos (P6): Leaflet + teselas libres, sin Google Maps API.

// Centro por defecto: Medellín
export const MEDELLIN = { lat: 6.2442, lng: -75.5812 };
export const DEFAULT_ZOOM = 12;
export const PIN_ZOOM = 15;

// Mapa base de todos los mapas de la app (Descubre, detalle, selector de ubicación y Mapa en vivo): pasan por MapBase.
// 1) Principal: teselas VECTORIALES de OpenFreeMap (sin clave) dibujadas con MapLibre GL y el estilo propio de
//    lib/mapStyle.js. Se cargan con import() dentro del chunk del mapa.
// 2) Respaldo (MapLibre falla, no hay WebGL2 o el estilo no carga): teselas raster de OpenStreetMap oscurecidas con un
//    filtro CSS solo sobre la capa de teselas (map.css, [data-basemap='raster']), nunca sobre pines ni popups.
export const OPENFREEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">&copy; OpenFreeMap</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap contributors</a>';

// Si el mapa vectorial no termina de cargar en este tiempo, se pasa al respaldo raster
export const VECTOR_LOAD_TIMEOUT_MS = 10_000;

// MapLibre GL 5 necesita WebGL2. Se prueba con un canvas temporal (document inyectable para poder probarlo).
export function supportsWebGL2(doc = document) {
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

export const TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILES_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const TILES_MAX_ZOOM = 19;

// Aviso cuando el backend no logró ubicar el lugar con el texto (el evento se guardó igual)
export const LOCATION_MISSING_NOTICE = 'No pudimos ubicar el lugar en el mapa. Puedes marcarlo editando el evento.';

// Color del pin por categoría: turquesa deporte, amarillo cultura, verde recreación, gris otros (tokens del tema)
export const PIN_COLORS = {
  sport: 'var(--color-accent)',
  culture: 'var(--color-culture)',
  recreation: 'var(--color-success)',
  other: 'var(--color-ink-muted)',
};
export const pinColor = (category) => PIN_COLORS[category] ?? PIN_COLORS.other;

// "Activo" en el Mapa en vivo: publicado o en curso. Borradores, cancelados y finalizados no se muestran.
export const isActiveEvent = (event) => event?.status === 'published' || event?.status === 'in_progress';

// ¿El evento tiene ubicación marcada en el mapa?
export function hasCoordinates(event) {
  return Number.isFinite(event?.latitude) && Number.isFinite(event?.longitude);
}

export const eventPoint = (event) => ({ lat: event.latitude, lng: event.longitude });

// "Cómo llegar": rutas que se abren en la app de mapas del usuario (solo un enlace, sin costo)
export function directionsLinks({ lat, lng }) {
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
  };
}

// Rangos válidos de coordenadas (los mismos checks que la migración y el Zod del backend)
export const isValidPoint = (p) =>
  Number.isFinite(p?.lat) && Number.isFinite(p?.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;

// Agrega distanceKm a los eventos con ubicación, calculada en el navegador. Sin posición no toca nada.
export function withDistance(events, position) {
  if (!position) return events;
  return events.map((event) =>
    hasCoordinates(event) ? { ...event, distanceKm: haversineKm(position, eventPoint(event)) } : event,
  );
}

// Orden por cercanía: primero los que tienen distancia (de menor a mayor) y al final los que no tienen ubicación
export function sortByDistance(events) {
  const key = (e) => (Number.isFinite(e.distanceKm) ? e.distanceKm : Infinity);
  return [...events].sort((a, b) => key(a) - key(b));
}

// Encuadre del mapa: los puntos (eventos y, si hay, la persona). Devuelve null si no hay nada que encuadrar.
export function boundsOf(points) {
  const valid = points.filter(isValidPoint);
  if (!valid.length) return null;
  return [
    [Math.min(...valid.map((p) => p.lat)), Math.min(...valid.map((p) => p.lng))],
    [Math.max(...valid.map((p) => p.lat)), Math.max(...valid.map((p) => p.lng))],
  ];
}
