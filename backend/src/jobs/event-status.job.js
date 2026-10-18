import { refreshEventStatuses, listFinishedSince } from '../repositories/events.repository.js';
import { requestRatingsForEvent } from '../services/rating-requests.service.js';

const LOOKBACK_MS = 60 * 60 * 1000;

// Pide la calificación en los eventos que acaban de finalizar (por el cron o a mano).
export async function requestRatings(now = Date.now()) {
  const events = await listFinishedSince(new Date(now - LOOKBACK_MS).toISOString());
  let sent = 0;
  for (const event of events) sent += await requestRatingsForEvent(event);
  return sent;
}

export async function runStatusRefreshOnce() {
  const updated = await refreshEventStatuses();
  if (updated > 0) console.info(`[estados] actualizados=${updated}`);
  const requested = await requestRatings();
  if (requested > 0) console.info(`[calificaciones] solicitudes enviadas=${requested}`);
  return updated;
}
