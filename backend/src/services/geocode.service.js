import { AppError } from '../utils/app-error.js';

// Búsqueda de direcciones con Nominatim (OpenStreetMap), llamada desde el BACKEND (P6):
// - máximo 1 petición por segundo (política de uso de Nominatim),
// - User-Agent con el nombre del proyecto,
// - caché en memoria (las búsquedas repetidas no salen a internet),
// - limitada a Colombia y sesgada hacia Medellín.

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'BeCore-ProyectoGrado/1.0 (Universidad Católica Luis Amigó, Medellín)';
const MIN_INTERVAL_MS = 1100; // un poco más de 1 s entre peticiones
const CACHE_TTL_MS = 24 * 3600 * 1000;
const CACHE_MAX = 500;
const TIMEOUT_MS = 5000;
// Caja de Medellín y el Valle de Aburrá (oeste, norte, este, sur): solo orienta, no excluye
const VIEWBOX = '-75.75,6.45,-75.45,6.10';

const normalize = (q) => q.trim().replace(/\s+/g, ' ').toLowerCase();
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function toResult(row) {
  return { label: String(row.display_name), lat: Number(row.lat), lng: Number(row.lon) };
}

// Las dependencias se pueden inyectar para probar sin red ni esperas reales
export function createGeocoder({ fetchImpl = (...args) => globalThis.fetch(...args), now = Date.now, sleep = defaultSleep } = {}) {
  const cache = new Map();
  let lastRequestAt = 0;
  let queue = Promise.resolve();

  // Cola: las peticiones salen una tras otra, separadas por MIN_INTERVAL_MS
  function schedule(task) {
    const run = queue.then(async () => {
      const wait = lastRequestAt + MIN_INTERVAL_MS - now();
      if (wait > 0) await sleep(wait);
      lastRequestAt = now();
      return task();
    });
    queue = run.catch(() => {});
    return run;
  }

  async function request(q) {
    const url = new URL(ENDPOINT);
    url.search = new URLSearchParams({
      q,
      format: 'jsonv2',
      limit: '5',
      countrycodes: 'co',
      'accept-language': 'es',
      viewbox: VIEWBOX,
      bounded: '0',
    }).toString();
    const response = await fetchImpl(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Nominatim respondió ${response.status}`);
    return (await response.json()).map(toResult).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
  }

  async function search(q) {
    const key = normalize(q);
    const hit = cache.get(key);
    if (hit && now() - hit.at < CACHE_TTL_MS) return hit.results;

    let results;
    try {
      results = await schedule(() => request(q.trim()));
    } catch (error) {
      console.error('[geocode] Nominatim no respondió:', error.message);
      throw new AppError(502, 'GEOCODE_UNAVAILABLE', 'No pudimos buscar esa dirección ahora. Marca el lugar directamente en el mapa.');
    }
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value); // sale la más antigua
    cache.set(key, { at: now(), results });
    return results;
  }

  return { search };
}

const geocoder = createGeocoder();
export const searchPlaces = (q) => geocoder.search(q);
