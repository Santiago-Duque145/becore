// Puntaje de afinidad por reglas (auth-onboarding §8). Función pura: sin base de datos ni reloj.
//
// | Señal                                              | Puntos |
// | events.category ∈ prefs.categories                 | +3     |
// | día del evento ∈ prefs.days (lun–vie / sáb–dom)    | +1     |
// | franja ∈ prefs.timeSlots (<12 / <18 / resto)       | +1     |
// | prefs.zone aparece en events.location (sin tildes) | +1     |
//
// Día y hora se leen en America/Bogota. reason es la señal más fuerte; si empatan en puntos,
// gana la que va primero en SIGNALS (zona, luego días, luego franja).

const TIME_ZONE = 'America/Bogota';

const CATEGORY_REASONS = {
  sport: 'Porque te gusta el deporte',
  culture: 'Porque te gusta la cultura',
  recreation: 'Porque te gusta la recreación',
};
const DAY_REASONS = { weekdays: 'Encaja con tus días entre semana', weekends: 'Encaja con tus fines de semana' };
const SLOT_REASONS = { morning: 'Encaja con tus mañanas', afternoon: 'Encaja con tus tardes', evening: 'Encaja con tus noches' };
const ZONE_REASON = 'Es en tu zona';

const bogotaParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  hour: 'numeric',
  hourCycle: 'h23',
});

// { day: 'weekdays' | 'weekends', slot: 'morning' | 'afternoon' | 'evening' } en hora de Bogotá
export function bogotaDayAndSlot(iso) {
  const parts = Object.fromEntries(bogotaParts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour);
  return {
    day: parts.weekday === 'Sat' || parts.weekday === 'Sun' ? 'weekends' : 'weekdays',
    slot: hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening',
  };
}

// minúsculas y sin tildes, para comparar zona y lugar
export const normalizeText = (text) =>
  (text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const SIGNALS = [
  {
    points: 3,
    match: (event, prefs) => prefs.categories?.includes(event.category) && CATEGORY_REASONS[event.category],
  },
  {
    points: 1,
    match: (event, prefs) => {
      const zone = normalizeText(prefs.zone);
      return zone && normalizeText(event.location).includes(zone) && ZONE_REASON;
    },
  },
  {
    points: 1,
    match: (event, prefs, when) => prefs.days?.includes(when.day) && DAY_REASONS[when.day],
  },
  {
    points: 1,
    match: (event, prefs, when) => prefs.timeSlots?.includes(when.slot) && SLOT_REASONS[when.slot],
  },
];

// → { score, reason } (reason null si score es 0)
export function scoreEvent(event, prefs) {
  if (!prefs) return { score: 0, reason: null };
  const when = bogotaDayAndSlot(event.startsAt);
  let score = 0;
  let best = null;
  for (const signal of SIGNALS) {
    const reason = signal.match(event, prefs, when);
    if (!reason) continue;
    score += signal.points;
    if (!best || signal.points > best.points) best = { points: signal.points, reason };
  }
  return { score, reason: best?.reason ?? null };
}

// Orden: puntaje desc, luego starts_at asc (y id para que el orden sea estable). Excluye puntaje 0.
export function rankScored(scored, limit) {
  return scored
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(a.event.startsAt) - new Date(b.event.startsAt) ||
        String(a.event.id).localeCompare(String(b.event.id)),
    )
    .slice(0, limit);
}
