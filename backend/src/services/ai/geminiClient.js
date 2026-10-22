import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

// Cliente único de Gemini (docs/specs/ai.md §3 y §7). Solo el backend llama a Gemini.
// - Toda llamada tiene timeout (AbortSignal). Embeddings: 1 reintento si se pide (segundo plano).
// - Texto: CADENA de modelos (GEMINI_TEXT_MODELS). Si uno da 429, cupo agotado, 503, timeout o JSON inválido, o está en
//   pausa, se pasa al siguiente. Cada modelo de la capa gratuita tiene su propio cupo diario.
// - La salida JSON se valida con Zod: Gemini no aplica minLength/maxLength/uniqueItems del esquema.
// - Cortacircuito POR MODELO: 3 fallos en 60 s → ese modelo se salta 5 min; cupo diario agotado → 1 h. Un modelo con
//   problemas (p. ej. el de texto) no apaga al otro (el de embeddings tiene su propio cupo).
// - Logs: modelo, operación, duración y código. NUNCA el prompt, la respuesta ni datos del usuario.
// IA5 (imágenes) quedó como trabajo futuro: no hay generateImage.

export class AiError extends Error {
  // code: AI_DISABLED | AI_UNAVAILABLE (cortacircuito) | AI_TIMEOUT | AI_RATE_LIMITED | AI_QUOTA_EXHAUSTED (cupo del día)
  //       | AI_OVERLOADED | AI_INVALID_OUTPUT | AI_ERROR
  constructor(code, message = code) {
    super(message);
    this.code = code;
  }
}

const EMBEDDING_DIMENSIONS = 768;
const RETRY_DELAY_MS = 2000;
const BREAKER = { failures: 3, windowMs: 60_000, pauseMs: 5 * 60_000, quotaPauseMs: 60 * 60_000 };
const RETRIABLE = new Set(['AI_TIMEOUT', 'AI_RATE_LIMITED', 'AI_OVERLOADED', 'AI_ERROR']);

// "a, b ,c" → ['a', 'b', 'c'] (GEMINI_TEXT_MODELS)
export const parseModelList = (value) =>
  String(value ?? '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

// Error del SDK → código propio (sin copiar el mensaje de Google, que puede repetir el contenido enviado)
export function toAiError(error) {
  if (error instanceof AiError) return error;
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return new AiError('AI_TIMEOUT');
  // La capa gratuita tiene cupo por minuto y por día (20 peticiones diarias por modelo en los flash, medido el 22 oct).
  // El del día no se recupera en minutos: no se reintenta. Del mensaje de Google solo se mira el id de la cuota.
  if (error?.status === 429) return new AiError(/PerDay/.test(String(error.message)) ? 'AI_QUOTA_EXHAUSTED' : 'AI_RATE_LIMITED');
  if (error?.status === 503 || error?.status === 500) return new AiError('AI_OVERLOADED');
  return new AiError('AI_ERROR');
}

// deps inyectables para las pruebas: sdk (con .models.generateContent / .models.embedContent), config, reloj, log y espera
export function createGeminiClient({ sdk, config, now = Date.now, log = console.warn, sleep = defaultSleep } = {}) {
  const enabled = Boolean(sdk) && config.enabled;
  const breakers = new Map(); // modelo → { failures: [t…], pausedUntil }
  const breakerFor = (model) => breakers.get(model) ?? breakers.set(model, { failures: [], pausedUntil: 0 }).get(model);

  function recordFailure(model, error) {
    const b = breakerFor(model);
    const t = now();
    if (error.code === 'AI_QUOTA_EXHAUSTED') {
      b.pausedUntil = t + BREAKER.quotaPauseMs;
      log(`[ai] ${model}: cupo del día agotado, en pausa 1 h`);
      return;
    }
    b.failures = [...b.failures.filter((f) => t - f < BREAKER.windowMs), t];
    if (b.failures.length >= BREAKER.failures) {
      b.pausedUntil = t + BREAKER.pauseMs;
      b.failures = [];
      log(`[ai] cortacircuito: ${model} en pausa 5 min`);
    }
  }

  async function call(operation, model, run, { timeoutMs, retry }) {
    if (!enabled) throw new AiError('AI_DISABLED');
    const breaker = breakerFor(model);
    if (now() < breaker.pausedUntil) throw new AiError('AI_UNAVAILABLE');
    for (let attempt = 0; ; attempt++) {
      const started = now();
      try {
        const result = await run(AbortSignal.timeout(timeoutMs));
        breaker.failures = [];
        return result;
      } catch (raw) {
        const error = toAiError(raw);
        log(`[ai] ${operation} ${model} falló: ${error.code} (${now() - started} ms, intento ${attempt + 1})`);
        if (error.code === 'AI_INVALID_OUTPUT') throw error; // reintentar no arregla un JSON mal formado del mismo prompt
        recordFailure(model, error);
        if (!retry || attempt > 0 || !RETRIABLE.has(error.code) || now() < breaker.pausedUntil) throw error;
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  const textModels = config.textModels ?? [];

  return {
    enabled,
    textModels,
    embeddingModel: config.embeddingModel,

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

    // JSON con esquema (responseJsonSchema) validado con Zod, probando la cadena de modelos en orden.
    // → { data, model } con el modelo que respondió. Si ninguno responde, lanza el último error.
    async generateJson({ system, prompt, jsonSchema, zodSchema }, { timeoutMs = 10_000 } = {}) {
      if (!enabled) throw new AiError('AI_DISABLED');
      let lastError = new AiError('AI_UNAVAILABLE');
      for (const model of textModels) {
        try {
          const data = await call(
            'json',
            model,
            async (abortSignal) => {
              const response = await sdk.models.generateContent({
                model,
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
            { timeoutMs, retry: false },
          );
          return { data, model };
        } catch (error) {
          lastError = error; // cualquier fallo de un modelo → el siguiente de la cadena
        }
      }
      throw lastError;
    },
  };
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Instancia de la app. Con AI_ENABLED=false o sin clave queda apagada (todas las llamadas lanzan AI_DISABLED).
const aiOn = env.AI_ENABLED === 'true';
if (aiOn && !env.GEMINI_API_KEY) console.warn('[ai] AI_ENABLED=true pero falta GEMINI_API_KEY: la IA queda apagada');

export const gemini = createGeminiClient({
  sdk: aiOn && env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null,
  config: { enabled: aiOn, textModels: parseModelList(env.GEMINI_TEXT_MODELS), embeddingModel: env.GEMINI_EMBEDDING_MODEL },
});
