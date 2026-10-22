// Plantillas de correo (api.md §4). Cada una devuelve { subject, message, html, text }.
// `message` (≤ 500 caracteres) es el texto corto que también usará la campana del S3.

import { env } from '../config/env.js';
import { paragraph, renderEmail } from './layout.js';

// Base de los enlaces: APP_URL (túnel del modo demo) o, si no está, FRONTEND_URL
export const appBaseUrl = () => (env.APP_URL ?? env.FRONTEND_URL).replace(/\/+$/, '');

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

export const formatMailDate = (iso) => dateFormat.format(new Date(iso));

const MESSAGE_LIMIT = 500;
const truncate = (value) => (value.length > MESSAGE_LIMIT ? `${value.slice(0, MESSAGE_LIMIT - 1)}…` : value);

// El diseño (cabecera con logo, pie, botón) vive en layout.js y es el mismo de las plantillas de Supabase
function layout(heading, lines, link) {
  return renderEmail({
    title: heading,
    preheader: lines[0] ?? heading,
    bodyHtml: lines.map(paragraph).join(''),
    cta: link ? { label: link.label, url: link.url } : undefined,
  });
}

function build({ subject, heading, lines, message, link }) {
  const linkText = link ? ['', `${link.label}: ${link.url}`] : [];
  return {
    subject,
    message: truncate(message),
    html: layout(heading, lines, link),
    text: [
      heading,
      '',
      ...lines,
      ...linkText,
      '',
      'Si no fuiste tú, ignora este correo.',
      'Be Core · Tu comunidad en movimiento',
      'Proyecto de grado · Universidad Católica Luis Amigó',
    ].join('\n'),
  };
}

// Enlace al detalle del evento (/eventos/:id) o, para las citas, a /citas
const eventLink = (event) => (event.id ? { label: 'Ver el evento', url: `${appBaseUrl()}/eventos/${event.id}` } : undefined);
const appointmentsLink = () => ({ label: 'Ver mis citas', url: `${appBaseUrl()}/citas` });

const eventLines = (event) => [`Cuándo: ${formatMailDate(event.startsAt)}`, `Dónde: ${event.location}`];
const appointmentLines = (appointment) => {
  const lines = [`Cuándo: ${formatMailDate(appointment.startsAt)}`];
  if (appointment.location) lines.push(`Dónde: ${appointment.location}`);
  if (appointment.notes) lines.push(`Notas: ${appointment.notes}`);
  return lines;
};

const ratingLink = (event) => ({ label: 'Calificar el evento', url: `${appBaseUrl()}/eventos/${event.id}/calificar` });

export const TEMPLATES = {
  event_rating_request: (event) =>
    build({
      subject: `¿Cómo estuvo ${event.title}?`,
      heading: `¿Cómo estuvo ${event.title}?`,
      lines: ['Gracias por venir. Cuéntanos qué tal te fue: tu calificación ayuda a mejorar los próximos eventos.'],
      message: `¿Cómo estuvo ${event.title}? Califica el evento.`,
      link: ratingLink(event),
    }),
  event_reminder: (event) =>
    build({
      subject: `Recordatorio: ${event.title} – ${formatMailDate(event.startsAt)}`,
      heading: `Te esperamos en ${event.title}`,
      lines: ['Este es un recordatorio de un evento al que confirmaste tu asistencia.', ...eventLines(event)],
      message: `Recordatorio: ${event.title} es ${formatMailDate(event.startsAt)} en ${event.location}.`,
      link: eventLink(event),
    }),
  event_updated: (event) =>
    build({
      subject: `Cambios en ${event.title}`,
      heading: `Cambios en ${event.title}`,
      lines: ['El organizador actualizó los datos del evento. Estos son los datos vigentes:', ...eventLines(event)],
      message: `${event.title} cambió: ahora es ${formatMailDate(event.startsAt)} en ${event.location}.`,
      link: eventLink(event),
    }),
  event_cancelled: (event) =>
    build({
      subject: `Se canceló ${event.title}`,
      heading: `Se canceló ${event.title}`,
      lines: ['El organizador canceló este evento. Tu cupo quedó liberado.', ...eventLines(event)],
      message: `Se canceló ${event.title}, que iba a ser ${formatMailDate(event.startsAt)}.`,
      link: eventLink(event),
    }),
  appointment_created: (appointment) =>
    build({
      subject: `Nueva cita: ${appointment.title}`,
      heading: `Nueva cita: ${appointment.title}`,
      lines: ['Te invitaron a una cita.', ...appointmentLines(appointment)],
      message: `Te invitaron a "${appointment.title}" el ${formatMailDate(appointment.startsAt)}`,
      link: appointmentsLink(),
    }),
  appointment_reminder: (appointment) =>
    build({
      subject: `Recordatorio de cita: ${appointment.title}`,
      heading: `Recordatorio de cita: ${appointment.title}`,
      lines: ['Tienes una cita próxima.', ...appointmentLines(appointment)],
      message: `Recordatorio: "${appointment.title}" es ${formatMailDate(appointment.startsAt)}`,
      link: appointmentsLink(),
    }),
  appointment_cancelled: (appointment) =>
    build({
      subject: `Se canceló la cita: ${appointment.title}`,
      heading: `Se canceló la cita: ${appointment.title}`,
      lines: ['El organizador canceló esta cita.', ...appointmentLines(appointment)],
      message: `Se canceló la cita "${appointment.title}" del ${formatMailDate(appointment.startsAt)}`,
      link: appointmentsLink(),
    }),
};

export const buildContent = (type, subject) => TEMPLATES[type](subject);
