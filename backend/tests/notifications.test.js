import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/events.repository.js', () => ({
  insertEvent: vi.fn(),
  findEventById: vi.fn(),
  updateEvent: vi.fn(),
  listEvents: vi.fn(),
}));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  findUserAttendances: vi.fn(),
  listConfirmedUserIds: vi.fn(),
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
import { findUserAttendances, listConfirmedUserIds } from '../src/repositories/attendance.repository.js';
import * as notificationsRepo from '../src/repositories/notifications.repository.js';
import { findProfilesByIds } from '../src/repositories/profiles.repository.js';
import { sendMail } from '../src/mail/mailer.js';
import * as eventsService from '../src/services/events.service.js';
import { notifyOne } from '../src/services/notifications.service.js';
import { AppError } from '../src/utils/app-error.js';

const owner = { id: 'owner-1', role: 'organizer' };
const future = (h = 48) => new Date(Date.now() + h * 3600 * 1000).toISOString();
const baseEvent = (over = {}) => ({
  id: 'ev-1',
  title: 'Partido',
  description: '',
  category: 'sport',
  location: 'Cancha',
  startsAt: future(),
  endsAt: null,
  capacity: 10,
  confirmedCount: 2,
  status: 'published',
  organizerId: 'owner-1',
  organizer: { id: 'owner-1', fullName: 'Santiago' },
  ...over,
});
const profiles = [
  { id: 'u1', email: 'u1@correo.com', fullName: 'Uno' },
  { id: 'u2', email: 'u2@correo.com', fullName: 'Dos' },
];

beforeEach(() => {
  vi.resetAllMocks();
  findUserAttendances.mockResolvedValue([]);
  listConfirmedUserIds.mockResolvedValue(['u1', 'u2']);
  findProfilesByIds.mockResolvedValue(profiles);
  let n = 0;
  notificationsRepo.insertNotification.mockImplementation(async () => ({ id: `n${++n}` }));
  sendMail.mockResolvedValue(undefined);
});

describe('aviso de cambios al editar (RF-17)', () => {
  it('cambiar el lugar con 2 confirmados → 2 filas y 2 correos event_updated', async () => {
    eventsRepo.findEventById.mockResolvedValue(baseEvent());
    eventsRepo.updateEvent.mockResolvedValue(baseEvent({ location: 'Otra cancha' }));
    await eventsService.updateEvent(owner, 'ev-1', { location: 'Otra cancha' });

    expect(notificationsRepo.insertNotification).toHaveBeenCalledTimes(2);
    expect(notificationsRepo.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'event_updated', eventId: 'ev-1', subject: 'Cambios en Partido' }),
    );
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'u1@correo.com', subject: 'Cambios en Partido' }));
    expect(notificationsRepo.markNotificationSent).toHaveBeenCalledTimes(2);
  });

  it('cambiar la fecha de inicio también avisa', async () => {
    eventsRepo.findEventById.mockResolvedValue(baseEvent());
    eventsRepo.updateEvent.mockResolvedValue(baseEvent());
    await eventsService.updateEvent(owner, 'ev-1', { startsAt: future(72) });
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it('editar solo la descripción no avisa a nadie', async () => {
    eventsRepo.findEventById.mockResolvedValue(baseEvent());
    eventsRepo.updateEvent.mockResolvedValue(baseEvent({ description: 'Nueva' }));
    await eventsService.updateEvent(owner, 'ev-1', { description: 'Nueva' });
    expect(notificationsRepo.insertNotification).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('mandar el mismo lugar no cuenta como cambio', async () => {
    eventsRepo.findEventById.mockResolvedValue(baseEvent());
    eventsRepo.updateEvent.mockResolvedValue(baseEvent());
    await eventsService.updateEvent(owner, 'ev-1', { location: 'Cancha' });
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe('aviso al cancelar', () => {
  it('cancelar → event_cancelled a los confirmados', async () => {
    eventsRepo.findEventById.mockResolvedValue(baseEvent());
    eventsRepo.updateEvent.mockResolvedValue(baseEvent({ status: 'cancelled' }));
    await eventsService.cancelEvent(owner, 'ev-1');
    expect(notificationsRepo.insertNotification).toHaveBeenCalledTimes(2);
    expect(notificationsRepo.insertNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'event_cancelled' }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Se canceló Partido' }));
  });

  it('un correo que falla no rompe la petición y guarda el error', async () => {
    eventsRepo.findEventById.mockResolvedValue(baseEvent());
    eventsRepo.updateEvent.mockResolvedValue(baseEvent({ status: 'cancelled' }));
    sendMail.mockRejectedValue(new Error('SMTP_NOT_CONFIGURED'));

    await expect(eventsService.cancelEvent(owner, 'ev-1')).resolves.toMatchObject({ status: 'cancelled' });
    expect(notificationsRepo.markNotificationError).toHaveBeenCalledTimes(2);
    expect(notificationsRepo.markNotificationError).toHaveBeenCalledWith('n1', 'SMTP_NOT_CONFIGURED');
    expect(notificationsRepo.markNotificationSent).not.toHaveBeenCalled();
  });

  it('si ni siquiera se puede registrar el aviso, la petición responde igual', async () => {
    eventsRepo.findEventById.mockResolvedValue(baseEvent());
    eventsRepo.updateEvent.mockResolvedValue(baseEvent({ status: 'cancelled' }));
    notificationsRepo.insertNotification.mockRejectedValue(new Error('db caída'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(eventsService.cancelEvent(owner, 'ev-1')).resolves.toMatchObject({ status: 'cancelled' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('notifyOne', () => {
  const content = { subject: 'S', message: 'M', html: '<p>M</p>', text: 'M' };

  it('un duplicado (índice único) se omite sin enviar', async () => {
    notificationsRepo.insertNotification.mockRejectedValue(new AppError(409, 'DUPLICATE', 'Ese registro ya existe'));
    await expect(notifyOne({ user: profiles[0], type: 'event_reminder', eventId: 'ev-1', content })).resolves.toBe('skipped');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('dirección de demo: queda DEMO_ADDRESS_SKIPPED en error y sin sent_at', async () => {
    sendMail.mockRejectedValue(new Error('DEMO_ADDRESS_SKIPPED'));
    const user = { id: 'u9', email: 'jugador1@becore.test' };
    await expect(notifyOne({ user, type: 'event_updated', eventId: 'ev-1', content })).resolves.toBe('failed');
    expect(notificationsRepo.markNotificationError).toHaveBeenCalledWith('n1', 'DEMO_ADDRESS_SKIPPED');
    expect(notificationsRepo.markNotificationSent).not.toHaveBeenCalled();
  });
});
