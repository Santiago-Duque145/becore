import { eventEnd } from './event-time.js';

// Agregar un evento al calendario del usuario (P4), sin librerías.
// Colombia no tiene horario de verano: America/Bogota es siempre UTC-5.
const BOGOTA_OFFSET_MS = 5 * 3600 * 1000;

const pad = (n) => String(n).padStart(2, '0');

function stamp(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

// 20261031T200000Z (UTC), formato de Google Calendar y de DTSTAMP
export const utcStamp = (iso) => `${stamp(new Date(iso))}Z`;

// 20261031T150000 (hora de Bogotá, sin zona; va junto a TZID=America/Bogota)
export const bogotaStamp = (iso) => stamp(new Date(new Date(iso).getTime() - BOGOTA_OFFSET_MS));

// Inicio y fin del evento; sin ends_at el fin es 2 h después (misma regla que la base)
function eventRange(event) {
  return { start: event.startsAt, end: eventEnd(event).iso };
}

// Enlace "render" de Google Calendar con las fechas en UTC
export function googleCalendarUrl(event, pageUrl) {
  const { start, end } = eventRange(event);
  const details = [event.description?.trim(), pageUrl && `Más información: ${pageUrl}`].filter(Boolean).join('\n\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details,
    location: event.location,
    ctz: 'America/Bogota',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// RFC 5545: escapar \ ; , y saltos de línea en los textos
const escapeText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

// Las líneas de más de 75 caracteres se parten con CRLF + espacio
function fold(line) {
  const parts = [];
  for (let i = 0; i < line.length; i += i === 0 ? 75 : 74) parts.push(line.slice(i, i + (i === 0 ? 75 : 74)));
  return parts.join('\r\n ');
}

// Archivo .ics (un VEVENT en America/Bogota con su VTIMEZONE)
export function buildIcs(event, pageUrl, now = new Date()) {
  const { start, end } = eventRange(event);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Be Core//Eventos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:America/Bogota',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0500',
    'TZNAME:-05',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${event.id}@becore`,
    `DTSTAMP:${stamp(now)}Z`,
    `DTSTART;TZID=America/Bogota:${bogotaStamp(start)}`,
    `DTEND;TZID=America/Bogota:${bogotaStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location)}`,
  ];
  const description = [event.description?.trim(), pageUrl && `Más información: ${pageUrl}`].filter(Boolean).join('\n\n');
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (pageUrl) lines.push(`URL:${pageUrl}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

// Nombre de archivo seguro a partir del título
export function icsFileName(event) {
  const slug = event.title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${slug || 'evento'}.ics`;
}

// Descarga el .ics generado en el navegador
export function downloadIcs(event, pageUrl) {
  const blob = new Blob([buildIcs(event, pageUrl)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = icsFileName(event);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
