import { describe, it, expect } from 'vitest';
import { bogotaStamp, buildIcs, googleCalendarUrl, icsFileName, utcStamp } from './calendar.js';

// 31 oct 2026, 3:00 p. m. en Bogotá = 20:00 UTC
const event = {
  id: 'abc-123',
  title: 'Partido; amistoso, 5 vs 5',
  description: 'Trae agua\ny guayos',
  location: 'Cancha La Floresta, Medellín',
  startsAt: '2026-10-31T20:00:00.000Z',
  endsAt: null,
};
const now = new Date('2026-10-18T12:00:00Z');

describe('fechas', () => {
  it('UTC para Google', () => expect(utcStamp(event.startsAt)).toBe('20261031T200000Z'));
  it('hora de Bogotá para el .ics (UTC-5)', () => expect(bogotaStamp(event.startsAt)).toBe('20261031T150000'));
  it('cruza la medianoche correctamente', () => expect(bogotaStamp('2026-11-01T03:30:00.000Z')).toBe('20261031T223000'));
});

describe('googleCalendarUrl', () => {
  it('lleva título, fechas en UTC (fin = inicio + 2 h), lugar y enlace', () => {
    const url = new URL(googleCalendarUrl(event, 'https://x.test/eventos/abc-123'));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe(event.title);
    expect(url.searchParams.get('dates')).toBe('20261031T200000Z/20261031T220000Z');
    expect(url.searchParams.get('location')).toBe(event.location);
    expect(url.searchParams.get('details')).toContain('https://x.test/eventos/abc-123');
  });

  it('usa ends_at cuando existe', () => {
    const url = new URL(googleCalendarUrl({ ...event, endsAt: '2026-10-31T21:30:00.000Z' }));
    expect(url.searchParams.get('dates')).toBe('20261031T200000Z/20261031T213000Z');
  });
});

describe('buildIcs', () => {
  const ics = buildIcs(event, 'https://x.test/eventos/abc-123', now);

  it('es un calendario válido con zona America/Bogota y fin de línea CRLF', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('TZID:America/Bogota');
    expect(ics).toContain('DTSTART;TZID=America/Bogota:20261031T150000');
    expect(ics).toContain('DTEND;TZID=America/Bogota:20261031T170000');
    expect(ics).toContain('UID:abc-123@becore');
    expect(ics).toContain('DTSTAMP:20261018T120000Z');
  });

  it('escapa ; , y saltos de línea', () => {
    expect(ics).toContain('SUMMARY:Partido\\; amistoso\\, 5 vs 5');
    expect(ics).toContain('LOCATION:Cancha La Floresta\\, Medellín');
    expect(ics.replace(/\r\n /g, '')).toContain('DESCRIPTION:Trae agua\\ny guayos');
  });

  it('parte las líneas de más de 75 caracteres', () => {
    const long = buildIcs({ ...event, description: 'x'.repeat(200) }, null, now);
    for (const line of long.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
  });
});

describe('icsFileName', () => {
  it('quita tildes y símbolos', () => expect(icsFileName({ title: 'Cine al aire libre: ¡Nueva función!' })).toBe('cine-al-aire-libre-nueva-funcion.ics'));
  it('siempre tiene nombre', () => expect(icsFileName({ title: '¡¡¡' })).toBe('evento.ics'));
});
