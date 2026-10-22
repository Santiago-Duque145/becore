import { bogotaDayAndSlot, normalizeText } from './score.js';

// Frase por plantilla para la variante "ai" cuando no hay respuesta de Gemini (o mientras se calcula en segundo plano).
// Se arma con lo que coincide entre el evento y los gustos de la persona: gusto, día de la semana y franja.
// Ej.: "Porque te gusta el fútbol y es un sábado en la tarde". Nunca queda vacía.

const INTEREST_PHRASES = {
  football: 'el fútbol',
  basketball: 'el baloncesto',
  volleyball: 'el voleibol',
  running: 'correr',
  cycling: 'el ciclismo',
  swimming: 'la natación',
  martial_arts: 'las artes marciales',
  fitness: 'el yoga y el funcional',
  music: 'la música',
  theater: 'el teatro',
  dance: 'la danza',
  cinema: 'el cine',
  art_workshops: 'el arte y los talleres',
  reading: 'la lectura',
  board_games: 'los juegos de mesa',
  hiking: 'las caminatas',
  outdoor_plans: 'los planes al aire libre',
  video_games: 'los videojuegos',
};
const CATEGORY_PHRASES = { sport: 'el deporte', culture: 'la cultura', recreation: 'la recreación' };
const SLOT_WORDS = { morning: 'mañana', afternoon: 'tarde', evening: 'noche' };
export const FALLBACK_REASON = 'Parecido a lo que te gusta';

const weekdayName = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', weekday: 'long' });

// Gusto que coincide: primero una etiqueta del evento que esté entre sus gustos; si no, la categoría
function likedPhrase(event, prefs, tags) {
  const liked = tags.find((tag) => prefs.interests?.includes(tag));
  if (liked) return INTEREST_PHRASES[liked];
  return prefs.categories?.includes(event.category) ? CATEGORY_PHRASES[event.category] : null;
}

// "es un sábado en la tarde" / "es un sábado" / "es en la tarde", solo con lo que coincide con sus días y franjas
function timePhrase(event, prefs) {
  const { day, slot } = bogotaDayAndSlot(event.startsAt);
  const dayOk = prefs.days?.includes(day);
  const slotOk = prefs.timeSlots?.includes(slot);
  const weekday = weekdayName.format(new Date(event.startsAt));
  if (dayOk && slotOk) return `es un ${weekday} en la ${SLOT_WORDS[slot]}`;
  if (dayOk) return `es un ${weekday}`;
  if (slotOk) return `es en la ${SLOT_WORDS[slot]}`;
  return null;
}

export function templateReason(event, prefs, tags = []) {
  const like = likedPhrase(event, prefs, tags);
  const when = timePhrase(event, prefs);
  if (like && when) return `Porque te gusta ${like} y ${when}`;
  if (like) return `Porque te gusta ${like}`;
  if (when) return `Encaja con tu horario: ${when}`;
  const zone = normalizeText(prefs.zone);
  if (zone && normalizeText(event.location).includes(zone)) return 'Es en tu zona';
  return FALLBACK_REASON;
}
