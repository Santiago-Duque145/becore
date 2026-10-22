import { CATEGORY_GROUP_LABELS, INTEREST_LABELS } from '../../constants/preferences.js';
import { normalizeQuery } from './query-text.js';

// IA7 · Lo que la frase pide, detectado con reglas en español (sin LLM): días, franja, categoría y gustos.
// → { days: Set('mon'…'sun' | 'weekends' | 'weekdays'), slot: 'morning'|'afternoon'|'evening'|null, categories: Set, interests: Set }

const WEEKDAYS = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };

// "mañana" sola es ambigua (¿mañana o en la mañana?): solo cuenta como franja con preposición o "temprano"
const SLOTS = [
  [/\b(en|por|de) la manana\b|\btemprano\b|\bmadrugada\b/, 'morning'],
  [/\b(en|por|de) la tarde\b|\btarde\b|\batardecer\b/, 'afternoon'],
  [/\b(en|por|de) la noche\b|\bnoche\b|\bnocturn[oa]s?\b/, 'evening'],
];

const CATEGORY_WORDS = {
  sport: ['deporte', 'deportes', 'deportivo', 'deportiva', 'ejercicio', 'entrenar', 'entrenamiento'],
  culture: ['cultura', 'cultural', 'culturales', 'arte', 'artistico'],
  recreation: ['recreacion', 'recreativo', 'recreativa', 'paseo', 'juegos'],
};

// Sinónimos y palabras sueltas de cada gusto, además de su nombre (INTEREST_LABELS)
const INTEREST_WORDS = {
  football: ['futbol', 'micro', 'microfutbol', 'futsal', 'partido de futbol', 'balon'],
  basketball: ['baloncesto', 'basket', 'basquet', 'basquetbol', 'basketball'],
  volleyball: ['voleibol', 'voley', 'volley'],
  running: ['correr', 'carrera', 'trote', 'trotar', 'running', '5k', '10k', 'maraton'],
  cycling: ['ciclismo', 'bici', 'bicicleta', 'ciclopaseo', 'rodada', 'ciclovia'],
  swimming: ['natacion', 'nadar', 'piscina'],
  martial_arts: ['artes marciales', 'karate', 'taekwondo', 'boxeo', 'jiu jitsu', 'judo', 'defensa personal'],
  fitness: ['yoga', 'funcional', 'crossfit', 'pilates', 'gimnasio', 'estiramientos'],
  music: ['musica', 'concierto', 'conciertos', 'banda', 'dj', 'toque'],
  theater: ['teatro', 'obra', 'obras', 'impro', 'improvisacion'],
  dance: ['danza', 'baile', 'bailar', 'salsa', 'tango'],
  cinema: ['cine', 'pelicula', 'peliculas', 'peli', 'estreno', 'proyeccion'],
  art_workshops: ['taller', 'talleres', 'pintura', 'pintar', 'acuarela', 'manualidades', 'fotografia', 'dibujo', 'dibujar'],
  reading: ['lectura', 'leer', 'libro', 'libros', 'club de lectura', 'biblioteca'],
  board_games: ['juegos de mesa', 'ajedrez', 'parques', 'cartas', 'catan'],
  hiking: ['caminata', 'caminatas', 'senderismo', 'montana', 'cerro', 'ecocaminata'],
  outdoor_plans: ['aire libre', 'picnic', 'parque', 'naturaleza'],
  video_games: ['videojuegos', 'videojuego', 'gaming', 'consola', 'fifa', 'esports'],
};

// la frase completa, entre espacios o en los bordes (el texto ya viene normalizado: sin tildes ni signos)
const has = (text, phrase) => ` ${text} `.includes(` ${phrase} `);

export function detectIntent(q) {
  const text = normalizeQuery(q);
  const days = new Set();
  for (const [word, dow] of Object.entries(WEEKDAYS)) if (has(text, word)) days.add(dow);
  if (/\bfin(es)? de semana\b|\bfinde\b/.test(text)) days.add('weekends');
  if (/\bentre semana\b/.test(text)) days.add('weekdays');
  const slot = SLOTS.find(([re]) => re.test(text))?.[1] ?? null;
  const categories = new Set();
  for (const [category, words] of Object.entries(CATEGORY_WORDS)) {
    if ([normalizeQuery(CATEGORY_GROUP_LABELS[category]), ...words].some((w) => has(text, w))) categories.add(category);
  }
  const interests = new Set();
  for (const [slug, words] of Object.entries(INTEREST_WORDS)) {
    if ([normalizeQuery(INTEREST_LABELS[slug]), ...words].some((w) => has(text, w))) interests.add(slug);
  }
  return { days, slot, categories, interests };
}
