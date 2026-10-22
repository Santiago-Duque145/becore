// Etiquetas de calificación. Deben ser idénticas al check de event_ratings.tags en
// supabase/migrations/20261022120100_event_ratings.sql y a frontend/src/constants/ratings.js.
export const RATING_TAGS = ['well_organized', 'punctual', 'good_vibe', 'would_repeat', 'good_venue', 'needs_improvement'];

export const RATING_TAG_LABELS = {
  well_organized: 'Bien organizado',
  punctual: 'Puntual',
  good_vibe: 'Buen ambiente',
  would_repeat: 'Lo repetiría',
  good_venue: 'Buen lugar',
  needs_improvement: 'Por mejorar',
};

// Días después de finalizado el evento en los que se puede calificar o editar
export const RATING_WINDOW_DAYS = 7;
