import { gemini } from '../ai/geminiClient.js';
import { locatePlace } from '../geocode.service.js';
import { scrubQuery } from '../search/query-text.js';
import { parseDateHint } from './date-hint.js';
import { DRAFT_JSON_SCHEMA, DRAFT_SYSTEM, draftOutputSchema, draftPrompt } from './draft-prompt.js';

// IA8 · Asistente para crear eventos (docs/specs/ai.md §16). Una sola llamada al modelo de texto; la fecha la resuelven
// reglas (date-hint.js) y el lugar el geocodificador. Nunca un error por la IA: sin cupo o con falla → { draft: null, reason }.
// PRIVACIDAD: a Gemini solo va la frase, sin correos ni teléfonos; nada de quién la escribe. El log no lleva la frase.

export const DAILY_LIMIT = 10;
const TEXT_MAX = 500;
const GEMINI_TIMEOUT_MS = 20_000;
const LOCATE_TIMEOUT_MS = 6_000;
const BOGOTA_OFFSET_MS = 5 * 3600 * 1000;
const DURATIONS = [30, 60, 90, 120, 180, 240, 360, 480]; // mismas opciones del formulario

const bogotaDay = (t) => new Date(t - BOGOTA_OFFSET_MS).toISOString().slice(0, 10);
const nearestDuration = (minutes) => DURATIONS.reduce((best, d) => (Math.abs(d - minutes) < Math.abs(best - minutes) ? d : best));
const withTimeout = (promise, ms) => Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

export function createDraftService({ client = gemini, locate = locatePlace, now = Date.now } = {}) {
  const usage = new Map(); // organizador → { day, count } (se reinicia con el backend)

  // true si el organizador aún puede pedir un borrador hoy (y lo cuenta)
  function takeQuota(userId) {
    const day = bogotaDay(now());
    const current = usage.get(userId);
    const count = current?.day === day ? current.count : 0;
    if (count >= DAILY_LIMIT) return false;
    usage.set(userId, { day, count: count + 1 });
    return true;
  }

  async function pin(placeText) {
    if (!placeText) return { latitude: null, longitude: null };
    const found = await withTimeout(locate(placeText).catch(() => null), LOCATE_TIMEOUT_MS);
    return found ? { latitude: found.lat, longitude: found.lng } : { latitude: null, longitude: null };
  }

  return {
    // → { draft: {…} | null, reason?: 'AI_DISABLED' | 'AI_UNAVAILABLE' | 'AI_ERROR' | 'DAILY_LIMIT' }
    async createDraft(user, { text }) {
      if (!client.enabled) return { draft: null, reason: 'AI_DISABLED' };
      if (!takeQuota(user.id)) return { draft: null, reason: 'DAILY_LIMIT' };
      const phrase = scrubQuery(text).slice(0, TEXT_MAX);
      const started = now();
      let result;
      try {
        result = await client.generateJson(
          { system: DRAFT_SYSTEM, prompt: draftPrompt(phrase), jsonSchema: DRAFT_JSON_SCHEMA, zodSchema: draftOutputSchema },
          { timeoutMs: GEMINI_TIMEOUT_MS },
        );
      } catch (error) {
        const code = error.code ?? 'AI_ERROR';
        console.warn(`[ai] borrador falló: ${code} (${now() - started} ms)`);
        return { draft: null, reason: code === 'AI_UNAVAILABLE' ? 'AI_UNAVAILABLE' : 'AI_ERROR' };
      }
      console.warn(`[ai] borrador ok: ${result.model} (${now() - started} ms)`);
      const { data } = result;
      return {
        draft: {
          title: data.title,
          description: data.description,
          category: data.category,
          startsAt: parseDateHint(data.date_hint, now()),
          durationMinutes: data.suggested_duration_minutes ? nearestDuration(data.suggested_duration_minutes) : null,
          capacity: data.suggested_capacity,
          location: data.place_text,
          ...(await pin(data.place_text)),
        },
      };
    },
  };
}

export const draftService = createDraftService();
