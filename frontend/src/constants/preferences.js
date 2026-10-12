// Opciones del onboarding (auth-onboarding §6). Mismos slugs y mismo orden que
// backend/src/constants/preferences.js; preferences.test.js falla si se desincronizan.

export const ROLE_OPTIONS = [
  { value: 'participant', title: 'Quiero participar', description: 'Encontrar eventos y apuntarme' },
  { value: 'organizer', title: 'Quiero organizar', description: 'Crear eventos y manejar cupos' },
];

// Paso 2, agrupados por categoría de evento
export const INTEREST_GROUPS = [
  {
    category: 'sport',
    label: 'Deporte',
    options: [
      { slug: 'football', label: 'Fútbol' },
      { slug: 'basketball', label: 'Baloncesto' },
      { slug: 'volleyball', label: 'Voleibol' },
      { slug: 'running', label: 'Correr' },
      { slug: 'cycling', label: 'Ciclismo' },
      { slug: 'swimming', label: 'Natación' },
      { slug: 'martial_arts', label: 'Artes marciales' },
      { slug: 'fitness', label: 'Yoga y funcional' },
    ],
  },
  {
    category: 'culture',
    label: 'Cultura',
    options: [
      { slug: 'music', label: 'Música y conciertos' },
      { slug: 'theater', label: 'Teatro' },
      { slug: 'dance', label: 'Danza' },
      { slug: 'cinema', label: 'Cine' },
      { slug: 'art_workshops', label: 'Arte y talleres' },
      { slug: 'reading', label: 'Lectura' },
    ],
  },
  {
    category: 'recreation',
    label: 'Recreación',
    options: [
      { slug: 'board_games', label: 'Juegos de mesa' },
      { slug: 'hiking', label: 'Caminatas' },
      { slug: 'outdoor_plans', label: 'Planes al aire libre' },
      { slug: 'video_games', label: 'Videojuegos' },
    ],
  },
];

// Paso 3
export const DAY_OPTIONS = [
  { slug: 'weekdays', label: 'Entre semana' },
  { slug: 'weekends', label: 'Fines de semana' },
];

export const TIME_SLOT_OPTIONS = [
  { slug: 'morning', label: 'Mañana' },
  { slug: 'afternoon', label: 'Tarde' },
  { slug: 'evening', label: 'Noche' },
];

// Paso 4
export const MOTIVATION_OPTIONS = [
  { slug: 'fun', label: 'Divertirme' },
  { slug: 'compete', label: 'Competir' },
  { slug: 'learn', label: 'Aprender algo nuevo' },
  { slug: 'meet_people', label: 'Conocer gente' },
  { slug: 'health', label: 'Cuidar mi salud' },
];

export const MAX_MOTIVATIONS = 2;
export const MAX_ZONE_LENGTH = 80;
