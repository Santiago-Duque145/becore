const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Texto del dato en vivo del hero (P1): null si no hay datos o si algún conteo es 0 (entonces no se muestra nada)
export function publicStatsText(stats) {
  const events = stats?.eventsThisWeek;
  const people = stats?.confirmedPeople;
  if (!Number.isInteger(events) || !Number.isInteger(people) || events <= 0 || people <= 0) return null;
  return `${plural(events, 'evento', 'eventos')} esta semana · ${plural(people, 'persona confirmada', 'personas confirmadas')}`;
}
