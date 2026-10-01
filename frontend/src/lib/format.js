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
