import { env } from '../config/env.js';
import { listPublishedStartingBetween } from '../repositories/events.repository.js';
import { listConfirmedUserIds } from '../repositories/attendance.repository.js';
import { listScheduledStartingBetween } from '../repositories/appointments.repository.js';
import { findProfilesByIds } from '../repositories/profiles.repository.js';
import { notifyOne } from '../services/notifications.service.js';
import { buildContent } from '../mail/templates.js';

const HOUR_MS = 3600 * 1000;

// Envía el aviso a cada destinatario sumando al resumen; un fallo individual no detiene al resto
async function remindAll(users, send, totals) {
  const results = await Promise.allSettled(users.map(send));
  for (const result of results) {
    if (result.status === 'fulfilled') {
      totals[result.value] += 1;
    } else {
      totals.failed += 1;
      console.error('[recordatorios] Error:', result.reason?.message ?? result.reason);
    }
  }
}

async function remindEvents(from, until, totals) {
  const events = await listPublishedStartingBetween(from, until);
  for (const event of events) {
    const users = await findProfilesByIds(await listConfirmedUserIds(event.id));
    const content = buildContent('event_reminder', event);
    await remindAll(
      users,
      (user) => notifyOne({ user, type: 'event_reminder', eventId: event.id, content }),
      totals,
    );
  }
}

async function remindAppointments(from, until, totals) {
  const appointments = await listScheduledStartingBetween(from, until);
  for (const appointment of appointments) {
    const users = await findProfilesByIds(appointment.participants.map((p) => p.id));
    const content = buildContent('appointment_reminder', appointment);
    await remindAll(
      users,
      (user) => notifyOne({ user, type: 'appointment_reminder', appointmentId: appointment.id, content }),
      totals,
    );
  }
}

// api.md §5. Idempotente: el índice único de notifications evita repetir el recordatorio
export async function runRemindersOnce() {
  const now = Date.now();
  const from = new Date(now).toISOString();
  const until = new Date(now + env.REMINDER_HOURS_BEFORE * HOUR_MS).toISOString();
  const totals = { sent: 0, skipped: 0, failed: 0 };

  await remindEvents(from, until, totals);
  await remindAppointments(from, until, totals);

  console.info(`[recordatorios] enviados=${totals.sent} omitidos=${totals.skipped} fallidos=${totals.failed}`);
  return totals;
}
