import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { AiError, createGeminiClient, gemini, toAiError } from '../src/services/ai/geminiClient.js';

const config = { enabled: true, textModel: 'gemini-test', embeddingModel: 'embedding-test' };
const vector = (n = 768) => Array.from({ length: n }, () => 0.01);
const schema = { zodSchema: z.object({ tags: z.array(z.string()).max(4) }), jsonSchema: { type: 'object' } };
const request = { system: 'sistema', prompt: '<datos>evento</datos>', ...schema };

// SDK falso: cada método recibe el body y devuelve lo que diga `impl`
function fakeSdk({ generate, embed } = {}) {
  return {
    models: {
      generateContent: vi.fn(generate ?? (async () => ({ text: '{"tags":["football"]}' }))),
      embedContent: vi.fn(embed ?? (async () => ({ embeddings: [{ values: vector() }] }))),
    },
  };
}
const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { status });
// Se queda colgado hasta que el AbortSignal del cliente lo corte
const hang = (body) =>
  new Promise((_, reject) => body.config.abortSignal.addEventListener('abort', () => reject(body.config.abortSignal.reason)));

function client(sdk, extra = {}) {
  const logs = [];
  const c = createGeminiClient({ sdk, config, log: (m) => logs.push(m), sleep: async () => {}, ...extra });
  return { c, logs };
}

describe('apagado y respaldo', () => {
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
});

describe('generateJson', () => {
  it('manda instrucción de sistema, datos, esquema JSON, modelo y un AbortSignal; devuelve lo validado con Zod', async () => {
    const sdk = fakeSdk();
    const { c } = client(sdk);
    expect(await c.generateJson(request)).toEqual({ tags: ['football'] });
    const body = sdk.models.generateContent.mock.calls[0][0];
    expect(body.model).toBe('gemini-test');
    expect(body.contents).toBe('<datos>evento</datos>');
    expect(body.config).toMatchObject({ systemInstruction: 'sistema', responseMimeType: 'application/json', responseJsonSchema: { type: 'object' } });
    expect(body.config.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it('JSON roto o que no cumple el esquema Zod → AI_INVALID_OUTPUT, sin reintentar', async () => {
    for (const text of ['no es json', '{"tags":["a","b","c","d","e"]}', '']) {
      const sdk = fakeSdk({ generate: async () => ({ text }) });
      const { c } = client(sdk);
      await expect(c.generateJson(request, { retry: true })).rejects.toMatchObject({ code: 'AI_INVALID_OUTPUT' });
      expect(sdk.models.generateContent).toHaveBeenCalledTimes(1);
    }
  });

  it('timeout: el AbortSignal corta la llamada → AI_TIMEOUT', async () => {
    const { c } = client(fakeSdk({ generate: hang }));
    await expect(c.generateJson(request, { timeoutMs: 20 })).rejects.toMatchObject({ code: 'AI_TIMEOUT' });
  });

  it('en segundo plano reintenta 1 vez ante 503 y responde si el segundo intento sale bien', async () => {
    let calls = 0;
    const sdk = fakeSdk({ generate: async () => (++calls === 1 ? Promise.reject(httpError(503)) : { text: '{"tags":[]}' }) });
    const { c } = client(sdk);
    expect(await c.generateJson(request, { retry: true })).toEqual({ tags: [] });
    expect(calls).toBe(2);
  });

  it('sin retry (petición del usuario) no reintenta', async () => {
    const sdk = fakeSdk({ generate: async () => Promise.reject(httpError(429)) });
    const { c } = client(sdk);
    await expect(c.generateJson(request)).rejects.toMatchObject({ code: 'AI_RATE_LIMITED' });
    expect(sdk.models.generateContent).toHaveBeenCalledTimes(1);
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
  });

  it('un vector de otro tamaño → AI_INVALID_OUTPUT', async () => {
    const { c } = client(fakeSdk({ embed: async () => ({ embeddings: [{ values: vector(3072) }] }) }));
    await expect(c.embedText('x')).rejects.toMatchObject({ code: 'AI_INVALID_OUTPUT' });
  });
});

describe('cortacircuito y logs', () => {
  it('3 fallos en 60 s pausan la IA 5 min (AI_UNAVAILABLE sin llamar) y luego vuelve', async () => {
    let t = 0;
    const sdk = fakeSdk({ generate: async () => Promise.reject(httpError(503)) });
    const { c } = client(sdk, { now: () => t });
    for (let i = 0; i < 3; i++) await expect(c.generateJson(request)).rejects.toMatchObject({ code: 'AI_OVERLOADED' });
    await expect(c.generateJson(request)).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
    expect(sdk.models.generateContent).toHaveBeenCalledTimes(3);
    t = 5 * 60_000 + 1;
    sdk.models.generateContent.mockResolvedValueOnce({ text: '{"tags":[]}' });
    expect(await c.generateJson(request)).toEqual({ tags: [] });
  });

  it('los logs solo llevan operación, modelo, código y duración: nunca el prompt ni el mensaje de Google', async () => {
    const leaky = Object.assign(new Error('Tu prompt <datos>evento</datos> es inválido'), { status: 400 });
    const { c, logs } = client(fakeSdk({ generate: async () => Promise.reject(leaky) }));
    await expect(c.generateJson(request)).rejects.toBeInstanceOf(AiError);
    expect(logs.join('\n')).toMatch(/\[ai\] json gemini-test falló: AI_ERROR/);
    expect(logs.join('\n')).not.toMatch(/datos|evento|sistema/);
  });

  it('toAiError traduce timeout, 429, 503 y otros', () => {
    expect(toAiError(Object.assign(new Error(), { name: 'TimeoutError' })).code).toBe('AI_TIMEOUT');
    expect(toAiError(httpError(429)).code).toBe('AI_RATE_LIMITED');
    expect(toAiError(httpError(503)).code).toBe('AI_OVERLOADED');
    expect(toAiError(new Error('x')).code).toBe('AI_ERROR');
  });
});
