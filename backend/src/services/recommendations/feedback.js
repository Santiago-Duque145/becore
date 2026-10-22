import * as aiRepo from '../../repositories/ai.repository.js';
import { DEMO_ORGANIZER_EMAIL } from '../../constants/demo.js';

// IA4 (docs/specs/ai.md §9 y §10): clics y confirmados de lo que se mostró en "Para ti", y las métricas por variante.
// Un clic o una confirmación solo cuentan si ese evento se le mostró al usuario en "Para ti" en los últimos 7 días;
// heredan la variante y el origen (gemini, template o rules) de ese "mostrado".

export const ATTRIBUTION_WINDOW_MS = 7 * 24 * 3600 * 1000;

const isDuplicate = (error) => error?.code === '23505'; // clicked y confirmed: una vez por usuario y evento

// → true si quedó registrado; false si no se le mostró en 7 días o ya estaba registrado. Nunca lanza por duplicado.
export async function recordAction(userId, eventId, action, { repo = aiRepo, now = Date.now } = {}) {
  const shown = await repo.findLatestShown(userId, eventId, new Date(now() - ATTRIBUTION_WINDOW_MS).toISOString());
  if (!shown) return false;
  try {
    await repo.insertRecommendationEvents([{ userId, eventId, variant: shown.variant, action, source: shown.source }]);
    return true;
  } catch (error) {
    if (isDuplicate(error)) return false;
    throw error;
  }
}

// Desde confirmar asistencia: no se espera ni puede romper la confirmación
export function recordConfirmedLater(userId, eventId, deps) {
  recordAction(userId, eventId, 'confirmed', deps).catch((error) =>
    console.warn(`[ai] no se registró "confirmado": ${error.code ?? 'error'}`),
  );
}

const ratio = (part, total) => (total ? Math.round((part / total) * 1000) / 1000 : null);

// Función pura: filas de recommendation_events + calificaciones → métricas de un grupo de filas
function summarize(rows, ratings) {
  const pairs = (action) => new Set(rows.filter((r) => r.action === action).map((r) => `${r.userId}|${r.eventId}`));
  const shown = pairs('shown');
  const clicked = pairs('clicked');
  const confirmed = pairs('confirmed');
  const stars = ratings.filter((r) => confirmed.has(`${r.userId}|${r.eventId}`)).map((r) => r.stars);
  return {
    users: new Set(rows.filter((r) => r.action === 'shown').map((r) => r.userId)).size,
    shown: shown.size,
    clicked: clicked.size,
    confirmed: confirmed.size,
    ctr: ratio(clicked.size, shown.size),
    confirmRate: ratio(confirmed.size, shown.size),
    avgRating: stars.length ? Math.round((stars.reduce((a, b) => a + b, 0) / stars.length) * 100) / 100 : null,
    ratings: stars.length,
  };
}

// "Mostrados" cuenta pares distintos (usuario, evento): "shown" se repite en cada visita.
// La variante "ai" se separa además por origen: lo que de verdad vino de Gemini y lo que salió de la plantilla.
export function computeAiMetrics(allRows, ratings, { demoEmail = DEMO_ORGANIZER_EMAIL } = {}) {
  const rows = allRows.filter((r) => r.organizerEmail !== demoEmail);
  const of = (filter) => rows.filter(filter);
  return {
    rules: summarize(of((r) => r.variant === 'rules'), ratings),
    ai: {
      ...summarize(of((r) => r.variant === 'ai'), ratings),
      bySource: {
        gemini: summarize(of((r) => r.variant === 'ai' && r.source === 'gemini'), ratings),
        template: summarize(of((r) => r.variant === 'ai' && r.source === 'template'), ratings),
      },
    },
    excludedDemoRows: allRows.length - rows.length,
  };
}

export async function getAiMetrics({ repo = aiRepo } = {}) {
  const rows = await repo.listRecommendationEventsForMetrics();
  const ratings = await repo.listRatingsFor([...new Set(rows.filter((r) => r.action === 'confirmed').map((r) => r.eventId))]);
  return computeAiMetrics(rows, ratings);
}
