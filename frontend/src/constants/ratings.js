// Etiquetas de calificación (P2). Mismos slugs y orden que backend/src/constants/ratings.js;
// ratings.test.js falla si se desincronizan.
export const RATING_TAGS = [
  { slug: 'well_organized', label: 'Bien organizado' },
  { slug: 'punctual', label: 'Puntual' },
  { slug: 'good_vibe', label: 'Buen ambiente' },
  { slug: 'would_repeat', label: 'Lo repetiría' },
  { slug: 'good_venue', label: 'Buen lugar' },
  { slug: 'needs_improvement', label: 'Por mejorar' },
];

export const RATING_TAG_LABELS = Object.fromEntries(RATING_TAGS.map((t) => [t.slug, t.label]));

export const RATING_WINDOW_DAYS = 7;
export const RATING_COMMENT_MAX = 500;

export const STAR_LABELS = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
