import * as aiRepo from '../../repositories/ai.repository.js';
import { gemini } from './geminiClient.js';
import {
  TAGGING_JSON_SCHEMA,
  TAGGING_SYSTEM,
  eventEmbeddingText,
  profileEmbeddingText,
  taggingPrompt,
  taggingResultSchema,
} from './prompts.js';

// IA2 (docs/specs/ai.md §3): etiquetas y embedding de eventos, embedding de perfiles. Siempre en segundo plano: la API
// responde primero y esto corre después (setImmediate). Si Gemini falla, no se escribe nada (o solo las etiquetas) y
// `npm run ai:backfill` lo completa. Nunca lanza hacia quien lo programa.

const BACKGROUND = { timeoutMs: 20_000, retry: true };

// Campos de un evento que cambian sus etiquetas o su embedding
export const AI_EVENT_FIELDS = ['title', 'description', 'category'];
export const touchesAiFields = (patch) => AI_EVENT_FIELDS.some((field) => patch[field] !== undefined);

// → { tags, embedded } o lanza AiError si no se pudo etiquetar
export async function indexEvent(event, { client = gemini, repo = aiRepo } = {}) {
  const { tags } = await client.generateJson(
    { system: TAGGING_SYSTEM, prompt: taggingPrompt(event), jsonSchema: TAGGING_JSON_SCHEMA, zodSchema: taggingResultSchema },
    BACKGROUND,
  );
  let embedding = null;
  try {
    embedding = await client.embedText(eventEmbeddingText(event, tags), BACKGROUND);
  } catch {
    // las etiquetas sirven solas; el embedding queda NULL y lo completa el backfill
  }
  await repo.upsertEventAi(event.id, { tags, embedding });
  return { tags, embedded: Boolean(embedding) };
}

export async function indexProfile(userId, prefs, { client = gemini, repo = aiRepo } = {}) {
  const embedding = await client.embedText(profileEmbeddingText(prefs), BACKGROUND);
  await repo.upsertUserAi(userId, embedding);
}

// Programa el trabajo después de responder. Con la IA apagada no hace nada.
function later(label, work, { client = gemini, schedule = setImmediate } = {}) {
  if (!client.enabled) return false;
  schedule(() =>
    work().catch((error) => console.warn(`[ai] ${label} quedó pendiente para el backfill: ${error.code ?? 'AI_ERROR'}`)),
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
