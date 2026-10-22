import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiError } from '../src/services/ai/geminiClient.js';
import { eventEmbeddingText, interestQueryText, profileEmbeddingText, profileSummary } from '../src/services/ai/prompts.js';
import {
  TAG_MARGIN,
  TAG_THRESHOLD,
  clearInterestVectorsMemory,
  getInterestVectors,
  interestCacheKey,
  tagsFromEmbedding,
} from '../src/services/ai/interest-tags.js';
import { indexEvent, indexProfile, scheduleEventIndex, scheduleProfileIndex, touchesAiFields } from '../src/services/ai/indexing.service.js';
import { INTEREST_SLUGS } from '../src/constants/preferences.js';

const event = { id: 'ev-1', title: 'Partido de fútbol 5', description: 'Equipos mixtos en Belén.', category: 'sport', status: 'published' };
const prefs = { interests: ['football', 'music'], days: ['weekends'], timeSlots: ['evening'], motivations: ['meet_people'], zone: 'Belén' };

// Perfil "envenenado": todo lo que NUNCA debe llegar a Gemini (docs/specs/ai.md §8)
const forbidden = {
  id: '0c9a7f1e-5b9d-4a1b-9a8e-2f6d3c1b7e44',
  userId: '0c9a7f1e-5b9d-4a1b-9a8e-2f6d3c1b7e44',
  fullName: 'Valentina Restrepo',
  email: 'valentina@correo.com',
  gender: 'female',
  ageRange: '25-34',
  dataConsentAt: '2026-10-17T10:00:00Z',
  organizer: { fullName: 'Carlos Gómez', email: 'carlos@correo.com' },
};
export const leaks = (text) =>
  ['Valentina', 'Restrepo', 'valentina@correo.com', '0c9a7f1e', 'female', 'Femenino', '25-34', 'Carlos', 'carlos@correo.com', '2026-10-17'].filter(
    (needle) => text.includes(needle),
  );

// Vectores de juguete: 18 ejes, uno por gusto. Un evento "apunta" a los gustos con el peso que se le dé.
const axis = (slug) => INTEREST_SLUGS.map((s) => (s === slug ? 1 : 0));
const interestVectors = Object.fromEntries(INTEREST_SLUGS.map((s) => [s, axis(s)]));
const eventVector = (weights) => INTEREST_SLUGS.map((s) => weights[s] ?? 0);

function fakeClient({ embedFails = false } = {}) {
  return {
    enabled: true,
    embeddingModel: 'embedding-test',
    generateJson: vi.fn(),
    embedText: vi.fn(async () => {
      if (embedFails) throw new AiError('AI_TIMEOUT');
      return eventVector({ football: 0.74, music: 0.71, dance: 0.6 });
    }),
  };
}
const fakeRepo = () => ({ upsertEventAi: vi.fn(async () => {}), upsertUserAi: vi.fn(async () => {}) });
const vectorsFor = async () => interestVectors;

describe('privacidad de los textos que van a Gemini (§8)', () => {
  it('los textos de embedding no llevan nombre, correo, IDs, sexo, edad ni datos del organizador', () => {
    const texts = [
      eventEmbeddingText({ ...forbidden, ...event }),
      profileSummary({ ...forbidden, ...prefs }),
      profileEmbeddingText({ ...forbidden, ...prefs }),
    ];
    for (const text of texts) expect(leaks(text), text).toEqual([]);
  });
});

describe('textos de los embeddings', () => {
  it('evento: prefijo de documento, categoría en español y descripción (sin etiquetas: salen del vector)', () => {
    expect(eventEmbeddingText(event)).toBe('title: Partido de fútbol 5 | text: Deporte. Equipos mixtos en Belén.');
    expect(eventEmbeddingText({ ...event, description: '' })).toBe('title: Partido de fútbol 5 | text: Deporte');
  });

  it('perfil: prefijo de búsqueda y los gustos en palabras', () => {
    expect(profileEmbeddingText(prefs)).toBe(
      'task: search result | query: Le gustan: Fútbol, Música y conciertos. Días: Fines de semana. Horario: Noche. Busca: Conocer gente. Zona: Belén.',
    );
  });

  it('cada gusto tiene su texto de búsqueda', () => {
    expect(interestQueryText('board_games')).toBe('task: search result | query: Juegos de mesa: ajedrez, cartas, parqués y noches de juegos');
  });
});

describe('etiquetas por similitud con los 18 gustos', () => {
  it('umbral 0,68 y margen 0,04 elegidos con los 32 eventos etiquetados (docs/progreso/18_*)', () => {
    expect([TAG_THRESHOLD, TAG_MARGIN]).toEqual([0.68, 0.04]);
  });

  it('asigna los que pasan el umbral y quedan a menos del margen del mejor, de más a menos parecido', () => {
    expect(tagsFromEmbedding(eventVector({ football: 0.74, music: 0.71, dance: 0.69 }), interestVectors)).toEqual(['football', 'music']);
    // dance (0,69) pasa el umbral pero queda a 0,05 del mejor: fuera
  });

  it('nada sobre el umbral → sin etiquetas (mejor ninguna que una equivocada)', () => {
    expect(tagsFromEmbedding(eventVector({ football: 0.67, board_games: 0.666 }), interestVectors)).toEqual([]);
  });

  it('máximo 4', () => {
    const many = eventVector({ football: 0.8, music: 0.79, dance: 0.79, cinema: 0.78, theater: 0.78 });
    expect(tagsFromEmbedding(many, interestVectors)).toHaveLength(4);
  });
});

describe('caché de los 18 embeddings de gustos', () => {
  beforeEach(() => clearInterestVectorsMemory());
  const memFs = () => {
    const files = new Map();
    return {
      files,
      readFile: vi.fn(async (url) => {
        if (!files.has(String(url))) throw new Error('ENOENT');
        return files.get(String(url));
      }),
      writeFile: vi.fn(async (url, text) => files.set(String(url), text)),
      mkdir: vi.fn(async () => {}),
    };
  };

  it('se calculan una vez (18 llamadas), quedan en archivo y en memoria', async () => {
    const client = { embedText: vi.fn(async () => [1, 0]) };
    const fs = memFs();
    await getInterestVectors(client, 'embedding-test', fs);
    await getInterestVectors(client, 'embedding-test', fs);
    expect(client.embedText).toHaveBeenCalledTimes(18);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    clearInterestVectorsMemory(); // reinicio del proceso: lee el archivo, no vuelve a llamar
    await getInterestVectors(client, 'embedding-test', fs);
    expect(client.embedText).toHaveBeenCalledTimes(18);
  });

  it('otro modelo invalida la caché del archivo', async () => {
    expect(interestCacheKey('a')).not.toBe(interestCacheKey('b'));
  });

  it('si falla, no queda una promesa rota en memoria: la próxima vez reintenta', async () => {
    const client = { embedText: vi.fn().mockRejectedValueOnce(new AiError('AI_TIMEOUT')).mockResolvedValue([1, 0]) };
    const fs = memFs();
    await expect(getInterestVectors(client, 'm', fs)).rejects.toMatchObject({ code: 'AI_TIMEOUT' });
    await expect(getInterestVectors(client, 'm', fs)).resolves.toBeTruthy();
  });
});

describe('indexEvent / indexProfile (sin el modelo de texto)', () => {
  it('embedding del evento → etiquetas por similitud → event_ai; nunca llama al modelo de texto', async () => {
    const client = fakeClient();
    const repo = fakeRepo();
    expect(await indexEvent(event, { client, repo, interestVectors: vectorsFor })).toEqual({ tags: ['football', 'music'] });
    expect(client.embedText.mock.calls[0]).toEqual([eventEmbeddingText(event), { timeoutMs: 20_000, retry: true }]);
    expect(client.generateJson).not.toHaveBeenCalled();
    expect(repo.upsertEventAi).toHaveBeenCalledWith('ev-1', { tags: ['football', 'music'], embedding: expect.any(Array) });
  });

  it('si falla el embedding no escribe nada y lanza (queda para el backfill)', async () => {
    const repo = fakeRepo();
    await expect(indexEvent(event, { client: fakeClient({ embedFails: true }), repo, interestVectors: vectorsFor })).rejects.toMatchObject({
      code: 'AI_TIMEOUT',
    });
    expect(repo.upsertEventAi).not.toHaveBeenCalled();
  });

  it('perfil: embedding de los gustos en user_ai', async () => {
    const client = fakeClient();
    const repo = fakeRepo();
    await indexProfile('u-1', prefs, { client, repo });
    expect(client.embedText.mock.calls[0][0]).toMatch(/^task: search result \| query: Le gustan/);
    expect(repo.upsertUserAi).toHaveBeenCalledWith('u-1', expect.any(Array));
  });
});

describe('programación en segundo plano', () => {
  it('solo programa eventos publicados, en curso o finalizados; nunca borradores ni cancelados', () => {
    const deps = { client: fakeClient(), repo: fakeRepo(), schedule: vi.fn(), interestVectors: vectorsFor };
    expect(scheduleEventIndex({ ...event, status: 'published' }, deps)).toBe(true);
    expect(scheduleEventIndex({ ...event, status: 'finished' }, deps)).toBe(true);
    expect(scheduleEventIndex({ ...event, status: 'draft' }, deps)).toBe(false);
    expect(scheduleEventIndex({ ...event, status: 'cancelled' }, deps)).toBe(false);
    expect(deps.schedule).toHaveBeenCalledTimes(2);
  });

  it('con la IA apagada no programa nada', () => {
    const schedule = vi.fn();
    expect(scheduleProfileIndex('u-1', prefs, { client: { enabled: false }, schedule })).toBe(false);
    expect(schedule).not.toHaveBeenCalled();
  });

  it('un error en segundo plano se registra con su código y no sale hacia la API', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    scheduleEventIndex(event, { client: fakeClient({ embedFails: true }), repo: fakeRepo(), schedule: (fn) => fn(), interestVectors: vectorsFor });
    await new Promise((r) => setTimeout(r, 0));
    expect(warn).toHaveBeenCalledWith('[ai] etiquetado de evento quedó pendiente: AI_TIMEOUT');
    warn.mockRestore();
  });

  it('se re-etiqueta al editar título, descripción o categoría; no por cupo, fecha ni lugar', () => {
    expect(touchesAiFields({ title: 'Nuevo' })).toBe(true);
    expect(touchesAiFields({ category: 'culture' })).toBe(true);
    expect(touchesAiFields({ capacity: 30, startsAt: '2026-11-01T20:00:00Z', location: 'Belén' })).toBe(false);
  });
});
