import { refreshEventStatuses, listFinishedSince } from '../repositories/events.repository.js';
import { listCheckedInUserIds } from '../repositories/attendance.repository.js';
import { notify } from '../services/notifications.service.js';
import { buildContent } from '../mail/templates.js';

const LOOKBACK_MS = 60 * 60 * 1000;

// Pide la calificación a quienes hicieron check-in en eventos que acaban de finalizar.
// Idempotente: el índice único de notifications evita repetir el aviso en cada pasada.
export async function requestRatings(now = Date.now()) {
  const events = await listFinishedSince(new Date(now - LOOKBACK_MS).toISOString());
  let sent = 0;
  for (const event of events) {
    const userIds = await listCheckedInUserIds(event.id);
    const summary = await notify({
      userIds,
      type: 'event_rating_request',
      eventId: event.id,
      buildContent: () => buildContent('event_rating_request', event),
    });
    sent += summary.sent;
  }
  return sent;
}

export async function runStatusRefreshOnce() {
  const updated = await refreshEventStatuses();
  if (updated > 0) console.info(`[estados] actualizados=${updated}`);
  const requested = await requestRatings();
  if (requested > 0) console.info(`[calificaciones] solicitudes enviadas=${requested}`);
  return updated;
}
