import { formatTime } from './format.js';

// Si el organizador no define la duración, el evento termina 2 horas después de empezar.
// Es la misma regla que aplica refresh_event_statuses en la base: coalesce(ends_at, starts_at + 2 h).
export const DEFAULT_DURATION_MS = 2 * 3600 * 1000;

// Hora de fin efectiva del evento y si es estimada (no la definió el organizador)
export function eventEnd(event) {
  if (event.endsAt) return { iso: event.endsAt, estimated: false };
  return { iso: new Date(new Date(event.startsAt).getTime() + DEFAULT_DURATION_MS).toISOString(), estimated: true };
}

// Texto de la hora de fin según el estado; null cuando ya no aplica (borrador, cancelado, finalizado)
export function endLabel(event) {
  if (event.status !== 'published' && event.status !== 'in_progress') return null;
  const { iso, estimated } = eventEnd(event);
  const time = formatTime(iso);
  if (event.status === 'in_progress') return estimated ? `En curso · termina aprox. ${time}` : `En curso · termina ${time}`;
  return estimated ? `Termina aprox. ${time} (2 h por defecto)` : `Termina ${time}`;
}
