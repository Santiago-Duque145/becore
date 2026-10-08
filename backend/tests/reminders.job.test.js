import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/events.repository.js', () => ({
  listPublishedStartingBetween: vi.fn(),
  refreshEventStatuses: vi.fn(),
}));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  listConfirmedUserIds: vi.fn(),
}));
vi.mock('../src/repositories/appointments.repository.js', () => ({
  listScheduledStartingBetween: vi.fn(),
}));
vi.mock('../src/repositories/notifications.repository.js', () => ({
  insertNotification: vi.fn(),
  markNotificationSent: vi.fn(),
  markNotificationError: vi.fn(),
}));
vi.mock('../src/repositories/profiles.repository.js', () => ({
  findProfilesByIds: vi.fn(),
}));
vi.mock('../src/mail/mailer.js', () => ({
  sendMail: vi.fn(),
}));

import * as eventsRepo from '../src/repositories/events.repository.js';
import { listConfirmedUserIds } from '../src/repositories/attendance.repository.js';
import { listScheduledStartingBetween } from '../src/repositories/appointments.repository.js';
import * as notificationsRepo from '../src/repositories/notifications.repository.js';
import { findProfilesByIds } from '../src/repositories/profiles.repository.js';
import { sendMail } from '../src/mail/mailer.js';
import { runRemindersOnce } from '../src/jobs/reminders.job.js';
import { runStatusRefreshOnce } from '../src/jobs/event-status.job.js';
import { AppError } from '../src/utils/app-error.js';

const event = { id: 'ev-1', title: 'Partido', location: 'Cancha', startsAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString() };
const users = [
  { id: 'u1', email: 'u1@correo.com' },
  { id: 'u2', email: 'u2@correo.com' },
  { id: 'u3', email: 'u3@correo.com' },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  eventsRepo.listPublishedStartingBetween.mockResolvedValue([event]);
  listConfirmedUserIds.mockResolvedValue(['u1', 'u2', 'u3']);
  listScheduledStartingBetween.mockResolvedValue([]);
  findProfilesByIds.mockImplementation(async (ids) => users.filter((u) => ids.includes(u.id)));
  let n = 0;
  notificationsRepo.insertNotification.mockImplementation(async () => ({ id: `n${++n}` }));
  sendMail.mockResolvedValue(undefined);
});

describe('runRemindersOnce', () => {
  it('envía el recordatorio a cada confirmado y resume', async () => {
    const totals = await runRemindersOnce();
    expect(totals).toEqual({ sent: 3, skipped: 0, failed: 0 });
    expect(notificationsRepo.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'event_reminder', eventId: 'ev-1' }),
    );
    expect(sendMail).toHaveBeenCalledTimes(3);
    expect(console.info).toHaveBeenCalledWith('[recordatorios] enviados=3 omitidos=0 fallidos=0');
  });

  it('busca solo en la ventana now … now + REMINDER_HOURS_BEFORE', async () => {
    await runRemindersOnce();
    const [from, until] = eventsRepo.listPublishedStartingBetween.mock.calls[0];
    expect(new Date(until) - new Date(from)).toBe(24 * 3600 * 1000);
  });

  it('23505 (ya enviado) → omitido, sin correo', async () => {
    notificationsRepo.insertNotification
      .mockResolvedValueOnce({ id: 'n1' })
      .mockRejectedValue(new AppError(409, 'DUPLICATE', 'Ese registro ya existe'));
    const totals = await runRemindersOnce();
    expect(totals).toEqual({ sent: 1, skipped: 2, failed: 0 });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('error de envío → fallido y guarda el error', async () => {
    sendMail.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('boom'));
    const totals = await runRemindersOnce();
    expect(totals).toEqual({ sent: 2, skipped: 0, failed: 1 });
    expect(notificationsRepo.markNotificationError).toHaveBeenCalledWith('n3', 'boom');
    expect(console.info).toHaveBeenCalledWith('[recordatorios] enviados=2 omitidos=0 fallidos=1');
  });

  it('también recuerda las citas programadas a sus invitados', async () => {
    eventsRepo.listPublishedStartingBetween.mockResolvedValue([]);
    listScheduledStartingBetween.mockResolvedValue([
      { id: 'ap-1', title: 'Reunión', location: '', notes: '', startsAt: event.startsAt, participants: [{ id: 'u1' }, { id: 'u2' }] },
    ]);
    const totals = await runRemindersOnce();
    expect(totals.sent).toBe(2);
    expect(notificationsRepo.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'appointment_reminder', appointmentId: 'ap-1' }),
    );
  });
});

describe('runStatusRefreshOnce', () => {
  it('llama la RPC y registra solo si hubo cambios', async () => {
    eventsRepo.refreshEventStatuses.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    await expect(runStatusRefreshOnce()).resolves.toBe(2);
    expect(console.info).toHaveBeenCalledWith('[estados] actualizados=2');
    console.info.mockClear();
    await expect(runStatusRefreshOnce()).resolves.toBe(0);
    expect(console.info).not.toHaveBeenCalled();
    expect(eventsRepo.refreshEventStatuses).toHaveBeenCalledTimes(2);
  });
});
