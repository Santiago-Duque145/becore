import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

// Cliente único de Gemini (docs/specs/ai.md §3 y §7). Solo el backend llama a Gemini.
// - Toda llamada tiene timeout (AbortSignal) y, si se pide, 1 reintento ante 429/503/red (segundo plano).
// - La salida JSON se valida con Zod: Gemini no aplica minLength/maxLength/uniqueItems del esquema.
// - Cortacircuito: 3 fallos en 60 s → la IA se salta 5 min (no se insiste mientras Gemini está saturado).
// - Logs: modelo, operación, duración y código. NUNCA el prompt, la respuesta ni datos del usuario.
// IA5 (imágenes) quedó como trabajo futuro: no hay generateImage.

export class AiError extends Error {
  // code: AI_DISABLED | AI_UNAVAILABLE (cortacircuito) | AI_TIMEOUT | AI_RATE_LIMITED | AI_OVERLOADED | AI_INVALID_OUTPUT | AI_ERROR
  constructor(code, message = code) {
    super(message);
    this.code = code;
  }
}

const EMBEDDING_DIMENSIONS = 768;
const RETRY_DELAY_MS = 2000;
const BREAKER = { failures: 3, windowMs: 60_000, pauseMs: 5 * 60_000 };
const RETRIABLE = new Set(['AI_TIMEOUT', 'AI_RATE_LIMITED', 'AI_OVERLOADED', 'AI_ERROR']);

// Error del SDK → código propio (sin copiar el mensaje de Google, que puede repetir el contenido enviado)
export function toAiError(error) {
  if (error instanceof AiError) return error;
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return new AiError('AI_TIMEOUT');
  if (error?.status === 429) return new AiError('AI_RATE_LIMITED');
  if (error?.status === 503 || error?.status === 500) return new AiError('AI_OVERLOADED');
  return new AiError('AI_ERROR');
}

// deps inyectables para las pruebas: sdk (con .models.generateContent / .models.embedContent), config, reloj, log y espera
export function createGeminiClient({ sdk, config, now = Date.now, log = console.warn, sleep = defaultSleep } = {}) {
  const enabled = Boolean(sdk) && config.enabled;
  let failures = [];
  let pausedUntil = 0;

  function recordFailure() {
    const t = now();
    failures = [...failures.filter((f) => t - f < BREAKER.windowMs), t];
    if (failures.length >= BREAKER.failures) {
      pausedUntil = t + BREAKER.pauseMs;
      failures = [];
      log('[ai] cortacircuito: IA en pausa 5 min');
    }
  }

  async function call(operation, model, run, { timeoutMs, retry }) {
    if (!enabled) throw new AiError('AI_DISABLED');
    if (now() < pausedUntil) throw new AiError('AI_UNAVAILABLE');
    for (let attempt = 0; ; attempt++) {
      const started = now();
      try {
        const result = await run(AbortSignal.timeout(timeoutMs));
        failures = [];
        return result;
      } catch (raw) {
        const error = toAiError(raw);
        log(`[ai] ${operation} ${model} falló: ${error.code} (${now() - started} ms, intento ${attempt + 1})`);
        if (error.code === 'AI_INVALID_OUTPUT') throw error; // reintentar no arregla un JSON mal formado del mismo prompt
        recordFailure();
        if (!retry || attempt > 0 || !RETRIABLE.has(error.code) || now() < pausedUntil) throw error;
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  return {
    enabled,

    // Vector de 768 dimensiones (gemini-embedding-2 ya lo devuelve normalizado). El texto lleva su prefijo de tarea (§5.2).
    async embedText(text, { timeoutMs = 10_000, retry = false } = {}) {
      return call(
        'embed',
        config.embeddingModel,
        async (abortSignal) => {
          const response = await sdk.models.embedContent({
            model: config.embeddingModel,
            contents: text,
            config: { outputDimensionality: EMBEDDING_DIMENSIONS, abortSignal },
          });
          const values = response?.embeddings?.[0]?.values;
          if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) throw new AiError('AI_INVALID_OUTPUT');
          return values;
        },
        { timeoutMs, retry },
      );
    },

    // JSON con esquema (responseJsonSchema) validado con Zod. system va como instrucción de sistema, prompt con los datos.
    async generateJson({ system, prompt, jsonSchema, zodSchema }, { timeoutMs = 10_000, retry = false } = {}) {
      return call(
        'json',
        config.textModel,
        async (abortSignal) => {
          const response = await sdk.models.generateContent({
            model: config.textModel,
            contents: prompt,
            config: {
              systemInstruction: system,
              responseMimeType: 'application/json',
              responseJsonSchema: jsonSchema,
              thinkingConfig: { thinkingLevel: 'MINIMAL' },
              abortSignal,
            },
          });
          let parsed;
          try {
            parsed = JSON.parse(response?.text ?? '');
          } catch {
            throw new AiError('AI_INVALID_OUTPUT');
          }
          const result = zodSchema.safeParse(parsed);
          if (!result.success) throw new AiError('AI_INVALID_OUTPUT');
          return result.data;
        },
        { timeoutMs, retry },
      );
    },
  };
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Instancia de la app. Con AI_ENABLED=false o sin clave queda apagada (todas las llamadas lanzan AI_DISABLED).
const aiOn = env.AI_ENABLED === 'true';
if (aiOn && !env.GEMINI_API_KEY) console.warn('[ai] AI_ENABLED=true pero falta GEMINI_API_KEY: la IA queda apagada');

export const gemini = createGeminiClient({
  sdk: aiOn && env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null,
  config: { enabled: aiOn, textModel: env.GEMINI_TEXT_MODEL, embeddingModel: env.GEMINI_EMBEDDING_MODEL },
});
