import { listPublicEventIdsBetween } from '../repositories/events.repository.js';
import { countConfirmedPeople } from '../repositories/attendance.repository.js';

// GET /public/stats (api.md, P1): dos conteos agregados para el hero del login, sin datos personales.
// Se guardan 5 minutos en memoria para que una ruta pública no golpee la base en cada visita.
export const CACHE_TTL_MS = 5 * 60 * 1000;

const DAY_MS = 24 * 3600 * 1000;
const BOGOTA_OFFSET_MS = 5 * 3600 * 1000; // America/Bogota es UTC-5 todo el año (sin horario de verano)

let cache = null; // { value, expiresAt }
let pending = null; // consulta en curso, compartida por las peticiones simultáneas

// Semana de lunes 00:00 a lunes 00:00 en hora de Bogotá, como instantes UTC
export function weekBounds(now = Date.now()) {
  const local = new Date(now - BOGOTA_OFFSET_MS);
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  const mondayLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysSinceMonday);
  const start = mondayLocal + BOGOTA_OFFSET_MS;
  return { fromIso: new Date(start).toISOString(), toIso: new Date(start + 7 * DAY_MS).toISOString() };
}

async function computeStats(now) {
  const { fromIso, toIso } = weekBounds(now);
  const eventIds = await listPublicEventIdsBetween(fromIso, toIso);
  const confirmedPeople = await countConfirmedPeople(eventIds);
  return { eventsThisWeek: eventIds.length, confirmedPeople };
}

export async function getPublicStats(now = Date.now()) {
  if (cache && cache.expiresAt > now) return cache.value;
  if (!pending) {
    pending = computeStats(now)
      .then((value) => {
        cache = { value, expiresAt: now + CACHE_TTL_MS };
        return value;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

// Solo para las pruebas
export function resetPublicStatsCache() {
  cache = null;
  pending = null;
}
