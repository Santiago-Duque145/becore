// Plantillas de correo (api.md §4). Cada una devuelve { subject, message, html, text }.
// `message` (≤ 500 caracteres) es el texto corto que también usará la campana del S3.

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

export const formatMailDate = (iso) => dateFormat.format(new Date(iso));

const MESSAGE_LIMIT = 500;
const truncate = (value) => (value.length > MESSAGE_LIMIT ? `${value.slice(0, MESSAGE_LIMIT - 1)}…` : value);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function layout(heading, lines) {
  const body = lines.map((l) => `<p style="margin:0 0 12px;color:#0D1B2A;font-size:16px;line-height:1.5">${escapeHtml(l)}</p>`).join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">
<div style="background:#0D1B2A;padding:16px 24px"><span style="color:#14B8A6;font-size:20px;font-weight:bold">Be Core</span><span style="color:#ffffff;font-size:13px"> · Tu comunidad en movimiento</span></div>
<div style="padding:24px"><h1 style="margin:0 0 16px;font-size:20px;color:#0D1B2A">${escapeHtml(heading)}</h1>${body}</div>
</div>`;
}

function build({ subject, heading, lines, message }) {
  return {
    subject,
    message: truncate(message),
    html: layout(heading, lines),
    text: [heading, '', ...lines, '', 'Be Core · Tu comunidad en movimiento'].join('\n'),
  };
}

const eventLines = (event) => [`Cuándo: ${formatMailDate(event.startsAt)}`, `Dónde: ${event.location}`];
const appointmentLines = (appointment) => {
  const lines = [`Cuándo: ${formatMailDate(appointment.startsAt)}`];
  if (appointment.location) lines.push(`Dónde: ${appointment.location}`);
  if (appointment.notes) lines.push(`Notas: ${appointment.notes}`);
  return lines;
};

export const TEMPLATES = {
  event_reminder: (event) =>
    build({
      subject: `Recordatorio: ${event.title} – ${formatMailDate(event.startsAt)}`,
      heading: `Te esperamos en ${event.title}`,
      lines: ['Este es un recordatorio de un evento al que confirmaste tu asistencia.', ...eventLines(event)],
      message: `Recordatorio: ${event.title} es ${formatMailDate(event.startsAt)} en ${event.location}.`,
    }),
  event_updated: (event) =>
    build({
      subject: `Cambios en ${event.title}`,
      heading: `Cambios en ${event.title}`,
      lines: ['El organizador actualizó los datos del evento. Estos son los datos vigentes:', ...eventLines(event)],
      message: `${event.title} cambió: ahora es ${formatMailDate(event.startsAt)} en ${event.location}.`,
    }),
  event_cancelled: (event) =>
    build({
      subject: `Se canceló ${event.title}`,
      heading: `Se canceló ${event.title}`,
      lines: ['El organizador canceló este evento. Tu cupo quedó liberado.', ...eventLines(event)],
      message: `Se canceló ${event.title}, que iba a ser ${formatMailDate(event.startsAt)}.`,
    }),
  appointment_created: (appointment) =>
    build({
      subject: `Nueva cita: ${appointment.title}`,
      heading: `Nueva cita: ${appointment.title}`,
      lines: ['Te invitaron a una cita.', ...appointmentLines(appointment)],
      message: `Te invitaron a "${appointment.title}" el ${formatMailDate(appointment.startsAt)}.`,
    }),
  appointment_reminder: (appointment) =>
    build({
      subject: `Recordatorio de cita: ${appointment.title}`,
      heading: `Recordatorio de cita: ${appointment.title}`,
      lines: ['Tienes una cita próxima.', ...appointmentLines(appointment)],
      message: `Recordatorio: "${appointment.title}" es ${formatMailDate(appointment.startsAt)}.`,
    }),
  appointment_cancelled: (appointment) =>
    build({
      subject: `Se canceló la cita: ${appointment.title}`,
      heading: `Se canceló la cita: ${appointment.title}`,
      lines: ['El organizador canceló esta cita.', ...appointmentLines(appointment)],
      message: `Se canceló la cita "${appointment.title}" del ${formatMailDate(appointment.startsAt)}.`,
    }),
};

export const buildContent = (type, subject) => TEMPLATES[type](subject);
