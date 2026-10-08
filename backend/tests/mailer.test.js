import { describe, it, expect, vi } from 'vitest';

const createTransport = vi.hoisted(() => vi.fn());
vi.mock('nodemailer', () => ({ default: { createTransport } }));

import { sendMail } from '../src/mail/mailer.js';
import { TEMPLATES } from '../src/mail/templates.js';

const mail = { subject: 'Hola', html: '<p>Hola</p>', text: 'Hola' };

describe('sendMail', () => {
  it('direcciones @becore.test → DEMO_ADDRESS_SKIPPED sin tocar el transporte', async () => {
    await expect(sendMail({ to: 'jugador1@becore.test', ...mail })).rejects.toThrow('DEMO_ADDRESS_SKIPPED');
    await expect(sendMail({ to: 'Otro@BECORE.TEST', ...mail })).rejects.toThrow('DEMO_ADDRESS_SKIPPED');
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('sin credenciales SMTP → SMTP_NOT_CONFIGURED y no crea transporte', async () => {
    await expect(sendMail({ to: 'ana@correo.com', ...mail })).rejects.toThrow('SMTP_NOT_CONFIGURED');
    expect(createTransport).not.toHaveBeenCalled();
  });
});

describe('plantillas', () => {
  const event = { title: 'Partido <5v5>', startsAt: '2026-10-31T20:00:00.000Z', location: 'Cancha' };
  const appointment = { title: 'Reunión', startsAt: '2026-10-31T20:00:00.000Z', location: '', notes: '' };

  it('cubren los 6 tipos con asunto, mensaje corto, html y texto', () => {
    expect(Object.keys(TEMPLATES).sort()).toEqual(
      ['appointment_cancelled', 'appointment_created', 'appointment_reminder', 'event_cancelled', 'event_reminder', 'event_updated'],
    );
    for (const [type, build] of Object.entries(TEMPLATES)) {
      const out = build(type.startsWith('event') ? event : appointment);
      expect(out.subject).toBeTruthy();
      expect(out.message.length).toBeLessThanOrEqual(500);
      expect(out.html).toContain('Be Core');
      expect(out.text).toContain('Be Core');
    }
  });

  it('asuntos según api.md §4 y fecha en hora de Bogotá', () => {
    expect(TEMPLATES.event_reminder(event).subject).toMatch(/^Recordatorio: Partido <5v5> – .*3:00/);
    expect(TEMPLATES.event_updated(event).subject).toBe('Cambios en Partido <5v5>');
    expect(TEMPLATES.event_cancelled(event).subject).toBe('Se canceló Partido <5v5>');
    expect(TEMPLATES.appointment_created(appointment).subject).toBe('Nueva cita: Reunión');
    expect(TEMPLATES.appointment_reminder(appointment).subject).toBe('Recordatorio de cita: Reunión');
    expect(TEMPLATES.appointment_cancelled(appointment).subject).toBe('Se canceló la cita: Reunión');
  });

  it('escapa HTML del título y recorta el mensaje a 500 caracteres', () => {
    expect(TEMPLATES.event_updated(event).html).toContain('Partido &lt;5v5&gt;');
    const long = TEMPLATES.event_updated({ ...event, title: 'x'.repeat(600) });
    expect(long.message).toHaveLength(500);
  });
});
