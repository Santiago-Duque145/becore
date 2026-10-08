const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Bogota',
});

const relativeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function formatDate(iso) {
  return dateFormatter.format(new Date(iso));
}

export function formatRelative(iso) {
  const diff = (new Date(iso) - Date.now()) / 1000;
  if (Math.abs(diff) < 60) return relativeFormatter.format(Math.round(diff), 'seconds');
  if (Math.abs(diff) < 3600) return relativeFormatter.format(Math.round(diff / 60), 'minutes');
  if (Math.abs(diff) < 86400) return relativeFormatter.format(Math.round(diff / 3600), 'hours');
  return relativeFormatter.format(Math.round(diff / 86400), 'days');
}

export const CATEGORY_LABELS = {
  sport: 'Deportivo',
  culture: 'Cultural',
  recreation: 'Recreativo',
  other: 'Otro',
};

// Colombia no tiene horario de verano: America/Bogota es siempre UTC-5.
// Convierte el valor de un <input type="datetime-local"> ("2026-10-31T15:00") a ISO 8601 UTC.
export function bogotaInputToIso(value) {
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return new Date(`${withSeconds}-05:00`).toISOString();
}

// Operación inversa: ISO → valor para <input type="datetime-local"> en hora de Bogotá.
export function isoToBogotaInput(iso) {
  return new Date(new Date(iso).getTime() - 5 * 3600 * 1000).toISOString().slice(0, 16);
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
