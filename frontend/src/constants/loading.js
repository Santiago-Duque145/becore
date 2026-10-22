// P7 · Pantallas de carga. Frases que rotan debajo del BrandLoader, alternando deporte y cultura (tono de la skill §5).
export const LOADING_PHRASES = [
  'Calentando motores…',
  'Afinando la guitarra…',
  'Inflando el balón…',
  'Preparando el escenario…',
  'Marcando la cancha…',
  'Reuniendo a la comunidad…',
  'Contando los cupos…',
];

export const SLOW_MESSAGE = 'Esto está tardando más de lo normal…';

// Tiempos (ms): rotación de frases, retraso antes de mostrar el loader de pantalla completa (evita parpadeos),
// tiempo mínimo visible una vez aparece y cuándo pasa al estado "tardando más de lo normal".
export const PHRASE_INTERVAL_MS = 1800;
export const LOADER_DELAY_MS = 300;
export const LOADER_MIN_VISIBLE_MS = 500;
export const LOADER_SLOW_MS = 8000;
