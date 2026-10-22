// "Para ti" (auth-onboarding §8, docs/specs/ai.md §3 y §10). Contrato de GET /events/recommended sin cambios:
// (Event & { reason })[]. Dos variantes de la prueba A/B, fijas por usuario (variant.js):
// - "rules": R5 tal cual (candidatos → scoreEvent → rankScored), con la razón de las reglas.
// - "ai": puntaje híbrido (embeddings + reglas + calificaciones) y re-ordenado con Gemini. El usuario NUNCA espera a
//   Gemini: si hay caché vigente (24 h) se usa; si no, se responde ya con el orden híbrido y una frase por plantilla, y
//   el re-ordenado se calcula en segundo plano para la próxima visita. Sin respuesta de Gemini, siempre hay frase.
// Cada recomendación mostrada se registra en recommendation_events con su origen (gemini, template o rules).
//
// PRIVACIDAD: profiles.gender, profiles.age_range y data_consent_at NO se usan para recomendar ni se envían a Gemini ni
// a ningún otro servicio externo. Aquí solo se leen los gustos (user_preferences). Si alguien agrega sexo o edad a
// scoreEvent o a un prompt, rompe lo que prometimos en /privacidad.
import { env } from '../../config/env.js';
import * as eventsRepo from '../../repositories/events.repository.js';
import * as aiRepo from '../../repositories/ai.repository.js';
import { findUserAttendances } from '../../repositories/attendance.repository.js';
import { findPreferencesByUserId } from '../../repositories/preferences.repository.js';
import { gemini } from '../ai/geminiClient.js';
import { later } from '../ai/indexing.service.js';
import { toEventsWithAttendance } from '../events.service.js';
import { rankHybrid } from './hybrid.js';
import { templateReason } from './reasons.js';
import { RERANK_CANDIDATES, rerankWithGemini } from './rerank.js';
import { rankScored, scoreEvent } from './score.js';
import { abVariant } from './variant.js';

export const CACHE_TTL_MS = 24 * 3600 * 1000;

// Publicados, futuros, con cupo, que el usuario no organiza ni tiene confirmados
export async function getCandidates(user) {
  const events = await eventsRepo.listRecommendationCandidates({ excludeOrganizerId: user.id });
  const withSpots = events.filter((e) => e.confirmedCount < e.capacity);
  const attendances = await findUserAttendances(
    user.id,
    withSpots.map((e) => e.id),
  );
  const confirmed = new Set(attendances.filter((a) => a.status === 'confirmed').map((a) => a.eventId));
  return withSpots.filter((e) => !confirmed.has(e.id));
}

// Variante "rules": R5
function pickByRules(candidates, prefs, limit) {
  return rankScored(
    candidates.map((event) => ({ event, ...scoreEvent(event, prefs) })),
    limit,
  ).map(({ event, reason }) => ({ event, reason, source: 'rules' }));
}

// Orden guardado (solo lo que sigue siendo candidato) + relleno con el orden híbrido y frase por plantilla
export function mergeWithCache(cachedItems, ranked, prefs, limit) {
  const byId = new Map(ranked.map((item) => [item.event.id, item]));
  const picked = [];
  for (const { eventId, reason, source } of cachedItems ?? []) {
    const item = byId.get(eventId);
    if (!item || picked.some((p) => p.event.id === eventId)) continue;
    picked.push({ event: item.event, reason, source });
  }
  for (const item of ranked) {
    if (picked.length >= limit) break;
    if (picked.some((p) => p.event.id === item.event.id)) continue;
    picked.push({ event: item.event, reason: templateReason(item.event, prefs, item.tags), source: 'template' });
  }
  return picked.slice(0, limit);
}

// Re-ordenado en segundo plano: un solo usuario a la vez por proceso
const inFlight = new Set();

export async function refreshAiCache(userId, prefs, ranked, { client = gemini, repo = aiRepo } = {}) {
  const top = ranked.slice(0, RERANK_CANDIDATES);
  const { picks, model } = await rerankWithGemini(client, prefs, top);
  const byId = new Map(top.map((item) => [item.event.id, item]));
  const items = picks.map(({ eventId, reason }) => {
    const item = byId.get(eventId);
    // Frase demasiado larga de Gemini (reason null): se queda su orden, con la frase de la plantilla
    if (!reason) return { eventId, score: item.score, reason: templateReason(item.event, prefs, item.tags), source: 'template' };
    return { eventId, score: item.score, reason, source: 'gemini' };
  });
  // El resto del top 15, en orden híbrido, para poder completar la lista si algún elegido deja de ser candidato
  for (const item of top) {
    if (items.some((i) => i.eventId === item.event.id)) continue;
    items.push({ eventId: item.event.id, score: item.score, reason: templateReason(item.event, prefs, item.tags), source: 'template' });
  }
  await repo.saveCachedRecommendations(userId, { variant: 'ai', items, ttlMs: CACHE_TTL_MS });
  console.info(`[ai] re-ordenado listo con ${model}: ${picks.length} elegidos por Gemini`); // sin datos del usuario
  return { model, picked: picks.length };
}

function scheduleRefresh(userId, prefs, ranked, deps = {}) {
  if (inFlight.has(userId) || !ranked.length) return false;
  inFlight.add(userId);
  const started = later(
    're-ordenado de Para ti',
    () => refreshAiCache(userId, prefs, ranked, deps).finally(() => inFlight.delete(userId)),
    deps,
  );
  if (!started) inFlight.delete(userId);
  return started;
}

// Variante "ai"
async function pickByAi(user, prefs, candidates, limit, deps = {}) {
  const repo = deps.repo ?? aiRepo;
  const ids = candidates.map((e) => e.id);
  const [cache, ai, userEmbedding, likedSignals] = await Promise.all([
    repo.findCachedRecommendations(user.id),
    repo.findEventAiByIds(ids),
    repo.findUserEmbedding(user.id),
    repo.findLikedSignals(user.id),
  ]);
  const ranked = rankHybrid(candidates, prefs, { ai, userEmbedding, likedSignals });
  const validCache = cache?.variant === 'ai' ? cache.items : null;
  if (!validCache) scheduleRefresh(user.id, prefs, ranked, deps);
  return mergeWithCache(validCache, ranked, prefs, limit);
}

function logShown(userId, variant, picked, repo) {
  const rows = picked.map(({ event, source }) => ({ userId, eventId: event.id, variant, action: 'shown', source }));
  repo.insertRecommendationEvents(rows).catch((error) => console.warn(`[ai] no se registró "mostrado": ${error.code ?? 'error'}`));
}

// Por qué "Para ti" vino vacío (solo se calcula en ese caso), para que el frontend muestre el estado adecuado:
// no_preferences · no_events (no hay próximos de otros organizadores) · all_confirmed (ya confirmó todos los que tienen
// cupo) · no_matches (hay eventos, pero ninguno encaja o los que quedan están llenos)
export async function explainEmpty(user) {
  if (!(await findPreferencesByUserId(user.id))) return 'no_preferences';
  const upcoming = await eventsRepo.listRecommendationCandidates({ excludeOrganizerId: user.id });
  if (!upcoming.length) return 'no_events';
  const attendances = await findUserAttendances(
    user.id,
    upcoming.map((e) => e.id),
  );
  const confirmed = new Set(attendances.filter((a) => a.status === 'confirmed').map((a) => a.eventId));
  const open = upcoming.filter((e) => !confirmed.has(e.id) && e.confirmedCount < e.capacity);
  return confirmed.size > 0 && open.length === 0 ? 'all_confirmed' : 'no_matches';
}

export async function getRecommendations(user, limit, deps = {}) {
  const repo = deps.repo ?? aiRepo;
  const prefs = await findPreferencesByUserId(user.id);
  if (!prefs) return [];
  const variant = deps.variant ?? abVariant(user.id, env.AB_SALT);
  const candidates = await getCandidates(user);
  const picked = variant === 'ai' ? await pickByAi(user, prefs, candidates, limit, deps) : pickByRules(candidates, prefs, limit);
  if (!picked.length) return [];
  logShown(user.id, variant, picked, repo);
  const events = await toEventsWithAttendance(
    user,
    picked.map((p) => p.event),
  );
  // reasonKind (P8) solo elige el ícono de la insignia: destello si la frase viene de la variante "ai" (Gemini o su
  // plantilla), check si viene de reglas. La pantalla nunca dice "IA" ni el nombre de la variante.
  return events.map((event, i) => ({ ...event, reason: picked[i].reason, reasonKind: picked[i].source === 'rules' ? 'check' : 'spark' }));
}
