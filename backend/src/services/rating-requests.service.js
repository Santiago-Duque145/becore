import { listCheckedInUserIds } from '../repositories/attendance.repository.js';
import { notify } from './notifications.service.js';
import { buildContent } from '../mail/templates.js';

// Pide la calificación (campana + correo) a quienes hicieron check-in en un evento finalizado.
// Idempotente: el índice único de notifications evita repetir el aviso. Devuelve cuántos se enviaron.
export async function requestRatingsForEvent(event) {
  const userIds = await listCheckedInUserIds(event.id);
  const summary = await notify({
    userIds,
    type: 'event_rating_request',
    eventId: event.id,
    buildContent: () => buildContent('event_rating_request', event),
  });
  return summary.sent;
}
