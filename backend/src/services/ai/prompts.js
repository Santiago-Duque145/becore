import {
  CATEGORY_GROUP_LABELS,
  DAY_LABELS,
  INTEREST_LABELS,
  INTEREST_SLUGS,
  MOTIVATION_LABELS,
  TIME_SLOT_LABELS,
} from '../../constants/preferences.js';

// Textos que se envían a Gemini (docs/specs/ai.md §5). Funciones PURAS que reciben solo lo permitido (§8):
// del evento, título, descripción y categoría; del usuario, gustos, días, franjas, motivaciones y zona.
// Nunca nombre, correo, IDs de usuario, sexo, edad ni ubicación del dispositivo: se construye desde campos elegidos,
// nunca con un spread del perfil, y una prueba lo comprueba con un perfil que trae todos esos datos.

export const CATEGORY_LABELS = { ...CATEGORY_GROUP_LABELS, other: 'Otro' };
const labels = (slugs, dict) => (slugs ?? []).map((slug) => dict[slug]).filter(Boolean);

// Texto de usuario dentro de <datos>: sin saltos raros ni etiquetas que cierren el bloque
export const clean = (text, max) =>
  String(text ?? '')
    .replace(/<\/?datos>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

// ---------- 5.2 Embeddings (gemini-embedding-2: prefijos de tarea en el texto) ----------
// Evento (documento). Sin etiquetas: las etiquetas salen de comparar ESTE embedding con el de cada gusto (§5.1).
export function eventEmbeddingText({ title, description, category }) {
  const parts = [CATEGORY_LABELS[category] ?? 'Otro', clean(description, 2000)].filter(Boolean);
  return `title: ${clean(title, 100) || 'none'} | text: ${parts.join('. ')}`;
}

// Perfil: los gustos en palabras, sin prefijo de tarea (lo usan el embedding y el re-ordenado de IA3)
export function profileSummary({ interests, days, timeSlots, motivations, zone }) {
  const join = (list, empty) => (list.length ? list.join(', ') : empty);
  return [
    `Le gustan: ${join(labels(interests, INTEREST_LABELS), 'cualquier plan')}.`,
    `Días: ${join(labels(days, DAY_LABELS), 'cualquiera')}.`,
    `Horario: ${join(labels(timeSlots, TIME_SLOT_LABELS), 'cualquiera')}.`,
    `Busca: ${join(labels(motivations, MOTIVATION_LABELS), 'pasarla bien')}.`,
    `Zona: ${clean(zone, 80) || 'cualquiera'}.`,
  ].join(' ');
}

// Perfil (consulta): prefijo de búsqueda de gemini-embedding-2
export const profileEmbeddingText = (prefs) => `task: search result | query: ${profileSummary(prefs)}`;

// ---------- 5.1 Etiquetas por similitud (IA3: sin el modelo de texto) ----------
// Cada gusto se describe como una búsqueda; su embedding se calcula una vez y queda en caché (interest-embeddings.js).
export const INTEREST_QUERIES = {
  football: 'Fútbol: partidos, torneos, fútbol 5, microfútbol o ver un partido de fútbol',
  basketball: 'Baloncesto: partidos y torneos de básquet',
  volleyball: 'Voleibol: partidos de vóley de playa o de cancha',
  running: 'Correr: carreras, trote, 5K, maratones y grupos de running',
  cycling: 'Ciclismo: ciclopaseos, rodadas y salidas en bicicleta',
  swimming: 'Natación: piscina, clases y competencias de nado',
  martial_arts: 'Artes marciales: karate, taekwondo, boxeo, jiu-jitsu y defensa personal',
  fitness: 'Yoga y entrenamiento funcional: clases de yoga, pilates, crossfit y ejercicio',
  music: 'Música y conciertos: conciertos, toques, bandas en vivo, DJ y fiestas con música',
  theater: 'Teatro: obras, funciones, improvisación y artes escénicas',
  dance: 'Danza: clases y presentaciones de baile, salsa y danza urbana',
  cinema: 'Cine: películas, estrenos, proyecciones y cine al aire libre',
  art_workshops: 'Arte y talleres: pintura, manualidades, fotografía y talleres creativos',
  reading: 'Lectura: clubes de lectura, libros, bibliotecas y escritura',
  board_games: 'Juegos de mesa: ajedrez, cartas, parqués y noches de juegos',
  hiking: 'Caminatas: senderismo, rutas por la montaña y ecocaminatas',
  outdoor_plans: 'Planes al aire libre: pícnics, paseos, parques y actividades al aire libre',
  video_games: 'Videojuegos: torneos de videojuegos, consolas, e-sports y gaming',
};

export const interestQueryText = (slug) => `task: search result | query: ${INTEREST_QUERIES[slug]}`;

if (Object.keys(INTEREST_QUERIES).join() !== INTEREST_SLUGS.join()) {
  throw new Error('INTEREST_QUERIES debe tener los mismos gustos y en el mismo orden que INTERESTS');
}
