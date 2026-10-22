import { randomUUID } from 'node:crypto';
import * as eventsRepo from '../../repositories/events.repository.js';
import * as searchRepo from '../../repositories/search.repository.js';
import { gemini } from '../ai/geminiClient.js';
import { toEventsWithAttendance } from '../events.service.js';
import { detectIntent } from './intent.js';
import { normalizeQuery, scrubQuery } from './query-text.js';
import { SEARCH_THRESHOLD, containsQuery, scoreEvent } from './score.js';

// IA7 · Búsqueda en lenguaje natural de Descubre (docs/specs/ai.md §IA7).
// - Semántica: embedding de la consulta (solo el cupo de embeddings, nunca el de texto) contra event_ai con el índice
//   HNSW, más coincidencia literal y refuerzos por día, franja, categoría y gusto detectados con reglas (intent.js).
// - Clásica (respaldo): sin tildes ni mayúsculas, en título, descripción y lugar. Se usa con la IA apagada, si Gemini
//   falla o si la persona pasa su límite. Nunca un 500 por la IA.
// PRIVACIDAD: a Gemini solo va la consulta, sin correos ni teléfonos (scrubQuery); nada de la persona.

export const MAX_RESULTS = 30;
export const MATCH_CANDIDATES = 50;
const UPCOMING_MAX = 200;
const PUBLIC_STATUSES = ['published', 'in_progress'];

// Embeddings ya calculados: misma consulta normalizada → mismo vector (24 h, máx. 500, como el geocodificador)
const CACHE_TTL_MS = 24 * 3600 * 1000;
const CACHE_MAX = 500;
// Embeddings nuevos por persona: 30 cada 10 min; pasado eso, modo clásico (sin error)
export const USER_LIMIT = 30;
const USER_WINDOW_MS = 10 * 60 * 1000;

export function createSearchService({
  client = gemini,
  events = eventsRepo,
  search = searchRepo,
  withAttendance = toEventsWithAttendance,
  now = Date.now,
  schedule = setImmediate,
} = {}) {
  const cache = new Map();
  const usage = new Map();

  function cached(key) {
    const hit = cache.get(key);
    if (hit && now() - hit.at < CACHE_TTL_MS) return hit.vector;
    cache.delete(key);
    return null;
  }

  function remember(key, vector) {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, { vector, at: now() });
  }

  // true si la persona aún puede pedir un embedding nuevo (y lo cuenta)
  function takeQuota(userId) {
    const recent = (usage.get(userId) ?? []).filter((t) => now() - t < USER_WINDOW_MS);
    if (recent.length >= USER_LIMIT) {
      usage.set(userId, recent);
      return false;
    }
    usage.set(userId, [...recent, now()]);
    return true;
  }

  // Vector de la consulta, o null si toca el modo clásico
  async function queryVector(userId, query) {
    if (!client.enabled) return null;
    const key = normalizeQuery(query);
    const hit = cached(key);
    if (hit) return hit;
    if (!takeQuota(userId)) return null;
    try {
      const vector = await client.embedText(`task: search result | query: ${query}`);
      remember(key, vector);
      return vector;
    } catch (error) {
      console.warn(`[ai] búsqueda en modo clásico: ${error.code ?? 'AI_ERROR'}`);
      return null;
    }
  }

  async function upcoming(category) {
    const { rows } = await events.listEvents({ scope: 'upcoming', statuses: PUBLIC_STATUSES, category, page: 1, pageSize: UPCOMING_MAX });
    return rows;
  }

  async function semantic(query, vector, candidates) {
    const [matches, tags] = await Promise.all([
      search.matchEventEmbeddings(vector, MATCH_CANDIDATES),
      search.findEventTagsByIds(candidates.map((e) => e.id)),
    ]);
    const similarity = new Map(matches.map((m) => [m.eventId, m.similarity]));
    const intent = detectIntent(query);
    return candidates
      .map((event) => ({
        event,
        score: scoreEvent({ q: query, intent, event, tags: tags[event.id] ?? [], similarity: similarity.get(event.id) ?? null }),
      }))
      .filter((r) => r.score >= SEARCH_THRESHOLD)
      .sort((a, b) => b.score - a.score || new Date(a.event.startsAt) - new Date(b.event.startsAt))
      .map((r) => r.event);
  }

  const classic = (query, candidates) =>
    candidates.filter((e) => containsQuery(query, `${e.title} ${e.description ?? ''} ${e.location}`));

  function record(row) {
    schedule(() => search.insertSearchEvent(row).catch((error) => console.warn(`[search] registro pendiente: ${error.code ?? error.message}`)));
  }

  return {
    // → { data: Event[], meta: { mode, total, searchId } }
    async searchEvents(user, { q, category }) {
      const query = scrubQuery(q);
      // En paralelo: los eventos próximos y el embedding de la consulta
      const [candidates, vector] = await Promise.all([upcoming(category), query.length >= 2 ? queryVector(user.id, query) : null]);
      let mode = vector ? 'semantic' : 'classic';
      let found;
      if (vector) {
        try {
          found = await semantic(query, vector, candidates);
        } catch (error) {
          console.warn(`[search] búsqueda semántica falló, modo clásico: ${error.code ?? error.message}`);
          mode = 'classic';
        }
      }
      if (mode === 'classic') found = query ? classic(query, candidates) : [];
      const data = await withAttendance(user, found.slice(0, MAX_RESULTS));
      const searchId = randomUUID();
      if (query) record({ id: searchId, queryText: query, mode, resultsCount: data.length });
      return { data, meta: { mode, total: data.length, searchId } };
    },

    // El primer resultado que se abre de una búsqueda. Sin esperar y sin errores hacia el cliente.
    recordOpen(searchId, eventId) {
      schedule(() => search.markSearchOpened(searchId, eventId).catch((error) => console.warn(`[search] apertura pendiente: ${error.code ?? error.message}`)));
    },
  };
}

export const searchService = createSearchService();
