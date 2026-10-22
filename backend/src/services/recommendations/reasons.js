import { bogotaDayAndSlot, normalizeText } from './score.js';
import { CATEGORY_NOUNS, FALLBACK_REASON, INTEREST_NOUNS, phrase, weekdayOf } from './phrases.js';

// Frase por plantilla para la variante "ai" cuando no hay respuesta de Gemini (o mientras se calcula en segundo plano).
// Se arma con lo que coincide entre el evento y los gustos de la persona: gusto, día de la semana, franja y zona.
// Ej.: "Fútbol el sábado en la tarde, como te gusta" (phrases.js, ≤ 60 caracteres). Nunca queda vacía.

export { FALLBACK_REASON };

// Gusto que coincide: primero una etiqueta del evento que esté entre sus gustos; si no, la categoría
function likedNoun(event, prefs, tags) {
  const liked = tags.find((tag) => prefs.interests?.includes(tag));
  if (liked) return INTEREST_NOUNS[liked];
  return prefs.categories?.includes(event.category) ? CATEGORY_NOUNS[event.category] : null;
}

export function templateReason(event, prefs, tags = []) {
  const { day, slot } = bogotaDayAndSlot(event.startsAt);
  const zone = normalizeText(prefs.zone);
  return phrase({
    like: likedNoun(event, prefs, tags),
    weekday: prefs.days?.includes(day) ? weekdayOf(event.startsAt) : null,
    slot: prefs.timeSlots?.includes(slot) ? slot : null,
    inZone: Boolean(zone) && normalizeText(event.location).includes(zone),
  });
}
