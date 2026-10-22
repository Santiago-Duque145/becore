import { cosine } from '../ai/interest-tags.js';
import { scoreEvent } from './score.js';

// Puntaje híbrido de la variante "ai" (docs/specs/ai.md §6). Funciones puras.
//   reglas    = puntaje de R5 / 6 (máximo: categoría 3 + día 1 + franja 1 + zona 1)
//   similitud = coseno(embedding del evento, embedding del perfil) llevado a 0..1 (ver SIM_*); 0 si falta alguno
//   bonus     = 0,1 si la categoría o una etiqueta del evento está entre las de eventos que calificó con ≥ 4
//   híbrido   = min(1, 0,5 · similitud + 0,5 · reglas + bonus)
export const RULES_MAX = 6;
export const LIKED_BONUS = 0.1;
export const HYBRID_THRESHOLD = 0.25;
// Las similitudes perfil ↔ evento de gemini-embedding-2 no van de 0 a 1. Calibrado el 22 oct con los 8 perfiles y los
// 10 eventos reales (80 pares, docs/progreso/19_*): mín. 0,565 · p10 0,593 · mediana 0,647 · máx. 0,720. Se reescalan
// a 0..1 entre 0,58 y 0,72: un evento entra solo por similitud (≥ 0,25) si supera ~0,65, la mediana de los pares en
// los que el evento tiene una etiqueta entre los gustos de la persona.
export const SIM_FLOOR = 0.58;
export const SIM_CEIL = 0.72;

export const scaleSimilarity = (raw) => Math.min(1, Math.max(0, (raw - SIM_FLOOR) / (SIM_CEIL - SIM_FLOOR)));

export function hybridScore({ rulesScore, similarity, liked }) {
  return Math.min(1, 0.5 * similarity + 0.5 * (rulesScore / RULES_MAX) + (liked ? LIKED_BONUS : 0));
}

// candidates: Event[] · ai: { [eventId]: { tags, embedding } } · likedSignals: { categories, tags }
// → [{ event, score, tags, rulesReason }] por puntaje desc, luego startsAt asc e id (estable).
// Entra todo lo que R5 mostraría (puntaje de reglas > 0) MÁS lo que llegue a HYBRID_THRESHOLD solo por similitud o bonus:
// así la variante "ai" nunca muestra menos que la de reglas, ni siquiera sin embeddings.
export function rankHybrid(candidates, prefs, { ai = {}, userEmbedding = null, likedSignals = { categories: [], tags: [] } } = {}) {
  return candidates
    .map((event) => {
      const { tags = [], embedding = null } = ai[event.id] ?? {};
      const rules = scoreEvent(event, prefs);
      const similarity = userEmbedding && embedding ? scaleSimilarity(cosine(userEmbedding, embedding)) : 0;
      const liked = likedSignals.categories.includes(event.category) || tags.some((t) => likedSignals.tags.includes(t));
      const score = hybridScore({ rulesScore: rules.score, similarity, liked });
      return { event, tags, rulesReason: rules.reason, rulesScore: rules.score, score };
    })
    .filter((item) => item.rulesScore > 0 || item.score >= HYBRID_THRESHOLD)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(a.event.startsAt) - new Date(b.event.startsAt) ||
        String(a.event.id).localeCompare(String(b.event.id)),
    );
}
