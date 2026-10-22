import * as aiRepo from '../../repositories/ai.repository.js';
import { gemini } from './geminiClient.js';
import { getInterestVectors, tagsFromEmbedding } from './interest-tags.js';
import { eventEmbeddingText, profileEmbeddingText } from './prompts.js';

// IA2/IA3 (docs/specs/ai.md §3): embedding y etiquetas de eventos, embedding de perfiles. Solo el modelo de embeddings:
// las etiquetas salen de comparar el embedding del evento con el de los 18 gustos (interest-tags.js), sin gastar el
// cupo del modelo de texto. Siempre en segundo plano: la API responde primero y esto corre después (setImmediate).
// Si Gemini falla no se escribe nada y `npm run ai:backfill` lo completa. Nunca lanza hacia quien lo programa.

const BACKGROUND = { timeoutMs: 20_000, retry: true };

// Campos de un evento que cambian sus etiquetas o su embedding
export const AI_EVENT_FIELDS = ['title', 'description', 'category'];
export const touchesAiFields = (patch) => AI_EVENT_FIELDS.some((field) => patch[field] !== undefined);

// → { tags } o lanza AiError si no se pudo calcular el embedding
export async function indexEvent(event, { client = gemini, repo = aiRepo, interestVectors = getInterestVectors } = {}) {
  const embedding = await client.embedText(eventEmbeddingText(event), BACKGROUND);
  const tags = tagsFromEmbedding(embedding, await interestVectors(client, client.embeddingModel));
  await repo.upsertEventAi(event.id, { tags, embedding });
  return { tags };
}

export async function indexProfile(userId, prefs, { client = gemini, repo = aiRepo } = {}) {
  const embedding = await client.embedText(profileEmbeddingText(prefs), BACKGROUND);
  await repo.upsertUserAi(userId, embedding);
}

// Programa el trabajo después de responder. Con la IA apagada no hace nada.
export function later(label, work, { client = gemini, schedule = setImmediate } = {}) {
  if (!client.enabled) return false;
  schedule(() =>
    work().catch((error) => console.warn(`[ai] ${label} quedó pendiente: ${error.code ?? 'AI_ERROR'}`)),
  );
  return true;
}

// Solo eventos que se pueden recomendar o calificar (los borradores se etiquetan al publicarse)
export function scheduleEventIndex(event, deps) {
  if (!aiRepo.AI_EVENT_STATUSES.includes(event.status)) return false;
  return later('etiquetado de evento', () => indexEvent(event, deps), deps);
}

export const scheduleProfileIndex = (userId, prefs, deps) =>
  later('embedding de perfil', () => indexProfile(userId, prefs, deps), deps);
