import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { AiError, createGeminiClient, gemini, parseModelList, toAiError } from '../src/services/ai/geminiClient.js';

const config = { enabled: true, textModels: ['texto-a', 'texto-b', 'texto-c'], embeddingModel: 'embedding-test' };
const vector = (n = 768) => Array.from({ length: n }, () => 0.01);
const schema = { zodSchema: z.object({ tags: z.array(z.string()).max(4) }), jsonSchema: { type: 'object' } };
const request = { system: 'sistema', prompt: '<datos>evento</datos>', ...schema };

// SDK falso: generate recibe el body (con body.model) y responde según el modelo
function fakeSdk({ generate, embed } = {}) {
  return {
    models: {
      generateContent: vi.fn(generate ?? (async () => ({ text: '{"tags":["football"]}' }))),
      embedContent: vi.fn(embed ?? (async () => ({ embeddings: [{ values: vector() }] }))),
    },
  };
}
const httpError = (status, message = `HTTP ${status}`) => Object.assign(new Error(message), { status });
const quotaError = () => httpError(429, '{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}');
// Se queda colgado hasta que el AbortSignal del cliente lo corte
const hang = (body) =>
  new Promise((_, reject) => body.config.abortSignal.addEventListener('abort', () => reject(body.config.abortSignal.reason)));
// Falla en los modelos indicados y responde bien en los demás
const failOn = (failures) => async (body) => {
  if (failures[body.model]) throw failures[body.model]();
  return { text: `{"tags":["${body.model}"]}` };
};
const models = (sdk) => sdk.models.generateContent.mock.calls.map(([body]) => body.model);

function client(sdk, extra = {}) {
  const logs = [];
  const c = createGeminiClient({ sdk, config, log: (m) => logs.push(m), sleep: async () => {}, ...extra });
  return { c, logs };
}

describe('apagado', () => {
  it('con AI_ENABLED=false o sin clave no llama a Gemini: AI_DISABLED', async () => {
    const sdk = fakeSdk();
    const off = createGeminiClient({ sdk, config: { ...config, enabled: false } });
    await expect(off.generateJson(request)).rejects.toMatchObject({ code: 'AI_DISABLED' });
    await expect(createGeminiClient({ sdk: null, config }).embedText('x')).rejects.toMatchObject({ code: 'AI_DISABLED' });
    expect(sdk.models.generateContent).not.toHaveBeenCalled();
  });

  it('en las pruebas la instancia de la app está apagada (ninguna prueba sale a internet)', async () => {
    expect(gemini.enabled).toBe(false);
    await expect(gemini.embedText('x')).rejects.toMatchObject({ code: 'AI_DISABLED' });
  });

  it('GEMINI_TEXT_MODELS: lista separada por comas, sin espacios ni vacíos', () => {
    expect(parseModelList(' gemini-3.6-flash, gemini-3-flash-preview ,,gemini-3.5-flash ')).toEqual([
      'gemini-3.6-flash',
      'gemini-3-flash-preview',
      'gemini-3.5-flash',
    ]);
    expect(parseModelList(undefined)).toEqual([]);
  });
});

describe('generateJson con cadena de modelos', () => {
  it('usa el primero de la cadena con instrucción de sistema, esquema JSON y AbortSignal; devuelve { data, model }', async () => {
    const sdk = fakeSdk();
    const { c } = client(sdk);
    expect(await c.generateJson(request)).toEqual({ data: { tags: ['football'] }, model: 'texto-a' });
    const body = sdk.models.generateContent.mock.calls[0][0];
    expect(body).toMatchObject({ model: 'texto-a', contents: '<datos>evento</datos>' });
    expect(body.config).toMatchObject({ systemInstruction: 'sistema', responseMimeType: 'application/json', responseJsonSchema: { type: 'object' } });
    expect(body.config.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it('429 o cupo agotado en uno → pasa al siguiente', async () => {
    const sdk = fakeSdk({ generate: failOn({ 'texto-a': () => httpError(429), 'texto-b': quotaError }) });
    const { c } = client(sdk);
    expect(await c.generateJson(request)).toEqual({ data: { tags: ['texto-c'] }, model: 'texto-c' });
    expect(models(sdk)).toEqual(['texto-a', 'texto-b', 'texto-c']);
  });

  it('503, timeout y JSON inválido también pasan al siguiente', async () => {
    const sdk = fakeSdk({
      generate: async (body) => {
        if (body.model === 'texto-a') throw httpError(503);
        if (body.model === 'texto-b') return { text: 'no es json' };
        return { text: '{"tags":[]}' };
      },
    });
    const { c } = client(sdk);
    expect((await c.generateJson(request)).model).toBe('texto-c');
    const slow = fakeSdk({ generate: async (body) => (body.model === 'texto-a' ? hang(body) : { text: '{"tags":[]}' }) });
    expect((await client(slow).c.generateJson(request, { timeoutMs: 20 })).model).toBe('texto-b');
  });

  it('si todos fallan lanza el último error (y quien llama usa la plantilla)', async () => {
    const sdk = fakeSdk({ generate: async () => Promise.reject(httpError(503)) });
    await expect(client(sdk).c.generateJson(request)).rejects.toMatchObject({ code: 'AI_OVERLOADED' });
    expect(sdk.models.generateContent).toHaveBeenCalledTimes(3);
  });

  it('el freno es por modelo: un modelo con cupo agotado se salta 1 h sin llamarlo; los otros siguen', async () => {
    let t = 0;
    const sdk = fakeSdk({ generate: failOn({ 'texto-a': quotaError }) });
    const { c, logs } = client(sdk, { now: () => t });
    expect((await c.generateJson(request)).model).toBe('texto-b');
    expect(logs.join('\n')).toContain('texto-a: cupo del día agotado');
    sdk.models.generateContent.mockClear();
    t = 30 * 60_000;
    expect((await c.generateJson(request)).model).toBe('texto-b');
    expect(models(sdk)).toEqual(['texto-b']); // texto-a en pausa: ni se intenta
    t = 61 * 60_000;
    sdk.models.generateContent.mockClear();
    sdk.models.generateContent.mockImplementation(async (body) => ({ text: `{"tags":["${body.model}"]}` }));
    expect((await c.generateJson(request)).model).toBe('texto-a');
  });

  it('3 fallos en 60 s pausan ese modelo 5 min', async () => {
    const sdk = fakeSdk({ generate: failOn({ 'texto-a': () => httpError(503) }) });
    const { c } = client(sdk, { now: () => 0 });
    for (let i = 0; i < 3; i++) await c.generateJson(request);
    sdk.models.generateContent.mockClear();
    await c.generateJson(request);
    expect(models(sdk)).toEqual(['texto-b']);
  });

  it('los logs solo llevan operación, modelo, código y duración: nunca el prompt ni el mensaje de Google', async () => {
    const leaky = Object.assign(new Error('Tu prompt <datos>evento</datos> es inválido'), { status: 400 });
    const { c, logs } = client(fakeSdk({ generate: async () => Promise.reject(leaky) }));
    await expect(c.generateJson(request)).rejects.toBeInstanceOf(AiError);
    expect(logs.join('\n')).toMatch(/\[ai\] json texto-a falló: AI_ERROR/);
    expect(logs.join('\n')).not.toMatch(/datos|evento|sistema/);
  });
});

describe('embedText', () => {
  it('pide 768 dimensiones al modelo de embeddings y devuelve el vector', async () => {
    const sdk = fakeSdk();
    const { c } = client(sdk);
    expect(await c.embedText('title: none | text: Partido')).toHaveLength(768);
    expect(sdk.models.embedContent.mock.calls[0][0]).toMatchObject({
      model: 'embedding-test',
      contents: 'title: none | text: Partido',
      config: { outputDimensionality: 768 },
    });
    expect(c.embeddingModel).toBe('embedding-test');
  });

  it('un vector de otro tamaño → AI_INVALID_OUTPUT', async () => {
    const { c } = client(fakeSdk({ embed: async () => ({ embeddings: [{ values: vector(3072) }] }) }));
    await expect(c.embedText('x')).rejects.toMatchObject({ code: 'AI_INVALID_OUTPUT' });
  });

  it('en segundo plano reintenta 1 vez ante 503', async () => {
    let calls = 0;
    const sdk = fakeSdk({ embed: async () => (++calls === 1 ? Promise.reject(httpError(503)) : { embeddings: [{ values: vector() }] }) });
    expect(await client(sdk).c.embedText('x', { retry: true })).toHaveLength(768);
    expect(calls).toBe(2);
  });

  it('el cupo de texto agotado no frena los embeddings (otro modelo)', async () => {
    const sdk = fakeSdk({ generate: async () => Promise.reject(quotaError()) });
    const { c } = client(sdk);
    await expect(c.generateJson(request)).rejects.toMatchObject({ code: 'AI_QUOTA_EXHAUSTED' });
    expect(await c.embedText('x')).toHaveLength(768);
  });
});

describe('toAiError', () => {
  it('traduce timeout, 429 (minuto o día), 503 y otros', () => {
    expect(toAiError(Object.assign(new Error(), { name: 'TimeoutError' })).code).toBe('AI_TIMEOUT');
    expect(toAiError(httpError(429)).code).toBe('AI_RATE_LIMITED');
    expect(toAiError(quotaError()).code).toBe('AI_QUOTA_EXHAUSTED');
    expect(toAiError(httpError(503)).code).toBe('AI_OVERLOADED');
    expect(toAiError(new Error('x')).code).toBe('AI_ERROR');
  });
});
