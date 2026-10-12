// Listas cerradas del cuestionario de onboarding (auth-onboarding.md §6).
// Deben ser idénticas a los check de supabase/migrations/20261011120000_onboarding_preferences.sql
// y a frontend/src/constants/preferences.js.

// Gustos en el orden de la spec: slug → categoría de evento (events.category)
export const INTERESTS = [
  { slug: 'football', category: 'sport' },
  { slug: 'basketball', category: 'sport' },
  { slug: 'volleyball', category: 'sport' },
  { slug: 'running', category: 'sport' },
  { slug: 'cycling', category: 'sport' },
  { slug: 'swimming', category: 'sport' },
  { slug: 'martial_arts', category: 'sport' },
  { slug: 'fitness', category: 'sport' },
  { slug: 'music', category: 'culture' },
  { slug: 'theater', category: 'culture' },
  { slug: 'dance', category: 'culture' },
  { slug: 'cinema', category: 'culture' },
  { slug: 'art_workshops', category: 'culture' },
  { slug: 'reading', category: 'culture' },
  { slug: 'board_games', category: 'recreation' },
  { slug: 'hiking', category: 'recreation' },
  { slug: 'outdoor_plans', category: 'recreation' },
  { slug: 'video_games', category: 'recreation' },
];

export const INTEREST_SLUGS = INTERESTS.map((i) => i.slug);
export const INTEREST_CATEGORY = Object.fromEntries(INTERESTS.map((i) => [i.slug, i.category]));

export const DAYS = ['weekdays', 'weekends'];
export const TIME_SLOTS = ['morning', 'afternoon', 'evening'];
export const MOTIVATIONS = ['fun', 'compete', 'learn', 'meet_people', 'health'];

export const MAX_MOTIVATIONS = 2;
export const MAX_ZONE_LENGTH = 80;

// Textos en español (los mismos del onboarding) para reutilizar en correos
export const INTEREST_LABELS = {
  football: 'Fútbol',
  basketball: 'Baloncesto',
  volleyball: 'Voleibol',
  running: 'Correr',
  cycling: 'Ciclismo',
  swimming: 'Natación',
  martial_arts: 'Artes marciales',
  fitness: 'Yoga y funcional',
  music: 'Música y conciertos',
  theater: 'Teatro',
  dance: 'Danza',
  cinema: 'Cine',
  art_workshops: 'Arte y talleres',
  reading: 'Lectura',
  board_games: 'Juegos de mesa',
  hiking: 'Caminatas',
  outdoor_plans: 'Planes al aire libre',
  video_games: 'Videojuegos',
};

export const CATEGORY_GROUP_LABELS = { sport: 'Deporte', culture: 'Cultura', recreation: 'Recreación' };

export const DAY_LABELS = { weekdays: 'Entre semana', weekends: 'Fines de semana' };

export const TIME_SLOT_LABELS = { morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche' };

export const MOTIVATION_LABELS = {
  fun: 'Divertirme',
  compete: 'Competir',
  learn: 'Aprender algo nuevo',
  meet_people: 'Conocer gente',
  health: 'Cuidar mi salud',
};
