// Puntaje de afinidad por reglas (auth-onboarding §8). Función pura: sin base de datos ni reloj.
//
// | Señal                                              | Puntos |
// | events.category ∈ prefs.categories                 | +3     |
// | día del evento ∈ prefs.days (lun–vie / sáb–dom)    | +1     |
// | franja ∈ prefs.timeSlots (<12 / <18 / resto)       | +1     |
// | prefs.zone aparece en events.location (sin tildes) | +1     |
//
// Día y hora se leen en America/Bogota. reason (P8) se arma con todas las señales que coincidieron (phrases.js):
// "Deporte el sábado en la tarde, como te gusta". El puntaje no cambia.

import { CATEGORY_NOUNS, phrase, weekdayOf } from './phrases.js';

const TIME_ZONE = 'America/Bogota';

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

const SIGNALS = {
  category: { points: 3, match: (event, prefs) => Boolean(prefs.categories?.includes(event.category) && CATEGORY_NOUNS[event.category]) },
  zone: {
    points: 1,
    match: (event, prefs) => {
      const zone = normalizeText(prefs.zone);
      return Boolean(zone) && normalizeText(event.location).includes(zone);
    },
  },
  day: { points: 1, match: (event, prefs, when) => Boolean(prefs.days?.includes(when.day)) },
  slot: { points: 1, match: (event, prefs, when) => Boolean(prefs.timeSlots?.includes(when.slot)) },
};

// → { score, reason } (reason null si score es 0)
export function scoreEvent(event, prefs) {
  if (!prefs) return { score: 0, reason: null };
  const when = bogotaDayAndSlot(event.startsAt);
  const hit = Object.fromEntries(Object.entries(SIGNALS).map(([key, signal]) => [key, signal.match(event, prefs, when)]));
  const score = Object.entries(SIGNALS).reduce((sum, [key, signal]) => sum + (hit[key] ? signal.points : 0), 0);
  if (!score) return { score: 0, reason: null };
  const reason = phrase({
    like: hit.category ? CATEGORY_NOUNS[event.category] : null,
    weekday: hit.day ? weekdayOf(event.startsAt) : null,
    slot: hit.slot ? when.slot : null,
    inZone: hit.zone,
  });
  return { score, reason };
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
