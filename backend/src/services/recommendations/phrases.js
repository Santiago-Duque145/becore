// Frases de "Para ti" (P8): cercanas y concretas, en español de Colombia, de máximo 60 caracteres y sin prometer nada
// que no salga de los datos ("Fútbol el sábado en la tarde, como te gusta"). Las usan la plantilla de la variante "ai"
// (reasons.js) y las reglas de R5 (score.js): solo cambia el texto, no el puntaje ni el orden.

export const MAX_PHRASE_LENGTH = 60;

// Cada gusto como sustantivo que abre la frase
export const INTEREST_NOUNS = {
  football: 'Fútbol',
  basketball: 'Baloncesto',
  volleyball: 'Voleibol',
  running: 'Correr',
  cycling: 'Ciclismo',
  swimming: 'Natación',
  martial_arts: 'Artes marciales',
  fitness: 'Yoga y funcional',
  music: 'Música',
  theater: 'Teatro',
  dance: 'Baile',
  cinema: 'Cine',
  art_workshops: 'Arte y talleres',
  reading: 'Lectura',
  board_games: 'Juegos de mesa',
  hiking: 'Caminata',
  outdoor_plans: 'Plan al aire libre',
  video_games: 'Videojuegos',
};
export const CATEGORY_NOUNS = { sport: 'Deporte', culture: 'Plan cultural', recreation: 'Recreación' };
const SLOT_WORDS = { morning: 'mañana', afternoon: 'tarde', evening: 'noche' };
export const FALLBACK_REASON = 'Parecido a lo que te gusta';

const weekdayName = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', weekday: 'long' });
// "sábado", "miércoles"… del inicio del evento en hora de Bogotá
export const weekdayOf = (iso) => weekdayName.format(new Date(iso));

// like: sustantivo del gusto o la categoría · weekday: solo si el día encaja con sus días · slot: solo si la franja
// encaja · inZone: el lugar está en su zona. Lo que no coincide no se menciona.
export function phrase({ like, weekday, slot, inZone }) {
  const when = [weekday && `el ${weekday}`, slot && `en la ${SLOT_WORDS[slot]}`].filter(Boolean).join(' ');
  if (like && when) return `${like} ${when}, como te gusta`;
  if (like) return `${like}, de lo que más te gusta`;
  if (when) return `${when.charAt(0).toUpperCase()}${when.slice(1)}, justo en tu horario`;
  if (inZone) return 'Queda en tu zona';
  return FALLBACK_REASON;
}
