import { haversineKm } from './geo.js';

// Reglas puras del mapa de eventos (P6): Leaflet + teselas libres, sin Google Maps API.

// Centro por defecto: Medellín
export const MEDELLIN = { lat: 6.2442, lng: -75.5812 };
export const DEFAULT_ZOOM = 12;
export const PIN_ZOOM = 15;

// Teselas: estilo oscuro de CARTO (libre para uso no comercial). VITE_MAP_TILES_URL permite cambiarlas.
export const DEFAULT_TILES_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const TILES_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Respaldo si las teselas oscuras fallan: el mapa estándar de OpenStreetMap
export const FALLBACK_TILES_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const FALLBACK_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const tilesUrl = (envValue) => (envValue && envValue.trim() ? envValue.trim() : DEFAULT_TILES_URL);

// Color del pin por categoría: turquesa deporte, amarillo cultura, verde recreación, gris otros (tokens del tema)
export const PIN_COLORS = {
  sport: 'var(--color-accent)',
  culture: 'var(--color-culture)',
  recreation: 'var(--color-success)',
  other: 'var(--color-ink-muted)',
};
export const pinColor = (category) => PIN_COLORS[category] ?? PIN_COLORS.other;

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
