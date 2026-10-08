import * as notificationsRepo from '../repositories/notifications.repository.js';
import { findProfilesByIds } from '../repositories/profiles.repository.js';
import { sendMail } from '../mail/mailer.js';

// Inserta la fila primero y envía después (idempotente gracias a los índices únicos de los recordatorios).
// Devuelve 'sent' | 'failed' | 'skipped' (ya existía la notificación).
export async function notifyOne({ user, type, eventId, appointmentId, content }) {
  let row;
  try {
    row = await notificationsRepo.insertNotification({
      userId: user.id,
      type,
      eventId,
      appointmentId,
      subject: content.subject,
      message: content.message,
    });
  } catch (err) {
    if (err.code === 'DUPLICATE') return 'skipped';
    throw err;
  }

  try {
    await sendMail({ to: user.email, subject: content.subject, html: content.html, text: content.text });
    await notificationsRepo.markNotificationSent(row.id);
    return 'sent';
  } catch (err) {
    await notificationsRepo.markNotificationError(row.id, err.message);
    return 'failed';
  }
}

// Avisa a varios usuarios. Nunca lanza: un correo fallido no debe romper la petición original.
// buildContent(profile) → { subject, message, html, text }
export async function notify({ userIds, type, eventId, appointmentId, buildContent }) {
  const summary = { sent: 0, failed: 0, skipped: 0 };
  if (!userIds.length) return summary;

  try {
    const users = await findProfilesByIds(userIds);
    const results = await Promise.allSettled(
      users.map((user) => notifyOne({ user, type, eventId, appointmentId, content: buildContent(user) })),
    );
    for (const result of results) {
      if (result.status === 'fulfilled') summary[result.value] += 1;
      else {
        summary.failed += 1;
        console.error('[notificaciones] No se pudo registrar el aviso:', result.reason?.message ?? result.reason);
      }
    }
  } catch (err) {
    console.error('[notificaciones] Error al preparar los avisos:', err.message);
  }
  return summary;
}
