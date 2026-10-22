import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/events.repository.js', () => ({ listRecommendationCandidates: vi.fn() }));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  findUserAttendances: vi.fn(async () => []),
  listConfirmedPreviewIds: vi.fn(async () => ({})),
  listConfirmedUserIds: vi.fn(),
}));
vi.mock('../src/repositories/preferences.repository.js', () => ({ findPreferencesByUserId: vi.fn() }));
vi.mock('../src/services/notifications.service.js', () => ({ notify: vi.fn() }));

import { listRecommendationCandidates } from '../src/repositories/events.repository.js';
import { findPreferencesByUserId } from '../src/repositories/preferences.repository.js';
import { getRecommendations, mergeWithCache, refreshAiCache, CACHE_TTL_MS } from '../src/services/recommendations/index.js';
import { HYBRID_THRESHOLD, hybridScore, rankHybrid, scaleSimilarity } from '../src/services/recommendations/hybrid.js';
import { FALLBACK_REASON, templateReason } from '../src/services/recommendations/reasons.js';
import { picksFromResponse, rerankPrompt, rerankResultSchema } from '../src/services/recommendations/rerank.js';
import { abVariant } from '../src/services/recommendations/variant.js';
import { AiError } from '../src/services/ai/geminiClient.js';
import { leaks } from './ai-indexing.test.js';

const SAT_3PM = '2026-10-31T20:00:00.000Z'; // sábado 3:00 p. m. en Bogotá
const TUE_8PM = '2026-11-04T01:00:00.000Z'; // martes 8:00 p. m. en Bogotá
const ev = (id, over = {}) => ({
  id,
  title: `Evento ${id}`,
  category: 'sport',
  location: 'Cancha de Belén',
  startsAt: SAT_3PM,
  capacity: 10,
  confirmedCount: 2,
  status: 'published',
  organizerId: 'org',
  organizer: { id: 'org', fullName: 'Organizador Real' },
  ...over,
});
const prefs = { categories: ['sport'], interests: ['football'], days: ['weekends'], timeSlots: ['afternoon'], motivations: ['fun'], zone: null };
const user = { id: 'u-ai', fullName: 'Valentina Restrepo', email: 'valentina@correo.com', gender: 'female', ageRange: '25-34' };

function fakeRepo(over = {}) {
  return {
    findCachedRecommendations: vi.fn(async () => null),
    findEventAiByIds: vi.fn(async () => ({})),
    findUserEmbedding: vi.fn(async () => null),
    findLikedSignals: vi.fn(async () => ({ categories: [], tags: [] })),
    saveCachedRecommendations: vi.fn(async () => {}),
    insertRecommendationEvents: vi.fn(async () => {}),
    ...over,
  };
}
const enabledClient = (generateJson = vi.fn()) => ({ enabled: true, generateJson, embeddingModel: 'e' });

beforeEach(() => vi.clearAllMocks());

describe('variante A/B', () => {
  it('es fija por usuario y reparte cerca de la mitad', () => {
    expect(abVariant('u-1', 'sal')).toBe(abVariant('u-1', 'sal'));
    const ai = Array.from({ length: 2000 }, (_, i) => abVariant(`user-${i}`, 'sal')).filter((v) => v === 'ai').length;
    expect(ai / 2000).toBeGreaterThan(0.45);
    expect(ai / 2000).toBeLessThan(0.55);
  });
});

describe('frase por plantilla (sin Gemini)', () => {
  it('gusto + día + franja: "Porque te gusta el fútbol y es un sábado en la tarde"', () => {
    expect(templateReason(ev('a'), prefs, ['football'])).toBe('Porque te gusta el fútbol y es un sábado en la tarde');
  });

  it('sin etiqueta que coincida usa la categoría; sin día que coincida, solo la franja', () => {
    expect(templateReason(ev('a', { startsAt: TUE_8PM }), { ...prefs, timeSlots: ['evening'] }, [])).toBe(
      'Porque te gusta el deporte y es en la noche',
    );
  });

  it('solo horario, solo zona o nada: nunca queda vacía', () => {
    const none = { categories: [], interests: [], days: ['weekends'], timeSlots: [], zone: null };
    expect(templateReason(ev('a', { category: 'culture' }), none, [])).toBe('Encaja con tu horario: es un sábado');
    expect(templateReason(ev('a', { category: 'other', startsAt: TUE_8PM }), { ...none, days: [], zone: 'belén' }, [])).toBe('Es en tu zona');
    expect(templateReason(ev('a', { category: 'other', startsAt: TUE_8PM }), { ...none, days: [] }, [])).toBe(FALLBACK_REASON);
  });
});

describe('puntaje híbrido', () => {
  it('0,5 · similitud + 0,5 · reglas/6 + 0,1 si le gustó algo parecido, tope 1', () => {
    expect(hybridScore({ rulesScore: 6, similarity: 1, liked: true })).toBe(1);
    expect(hybridScore({ rulesScore: 3, similarity: 0, liked: false })).toBe(0.25);
    expect(hybridScore({ rulesScore: 0, similarity: 0.6, liked: true })).toBeCloseTo(0.4);
  });

  it('la similitud de gemini-embedding-2 se reescala a 0..1 en el rango real (0,58–0,72)', () => {
    expect(scaleSimilarity(0.55)).toBe(0);
    expect(scaleSimilarity(0.8)).toBe(1);
    expect(scaleSimilarity(0.65)).toBeCloseTo(0.5);
  });

  it('un evento sin coincidencia de reglas entra (y puede ir primero) por similitud; sin nada de los dos, fuera', () => {
    const user768 = [1, 0];
    const ai = { cine: { tags: ['cinema'], embedding: [0.85, 0.53] }, otro: { tags: [], embedding: [0, 1] } };
    const ranked = rankHybrid([ev('cine', { category: 'culture', startsAt: TUE_8PM }), ev('otro', { category: 'other', startsAt: TUE_8PM }), ev('futbol')], prefs, {
      ai,
      userEmbedding: user768,
    });
    // cine: reglas 0, similitud máxima → 0,5 · fútbol: reglas 5/6, sin embedding → 0,42 · otro: nada → fuera
    expect(ranked.map((r) => r.event.id)).toEqual(['cine', 'futbol']);
    expect(ranked[0].score).toBeGreaterThanOrEqual(HYBRID_THRESHOLD);
    expect(ranked[0].tags).toEqual(['cinema']);
  });
});

describe('re-ordenado con Gemini: prompt y respuesta', () => {
  it('una sola petición con alias c1…; sin UUID, nombres, correos, sexo ni edad', () => {
    const events = [ev('11111111-aaaa', { title: 'Partido' }), ev('22222222-bbbb', { title: 'Torneo', tags: ['x'] })];
    const ranked = rankHybrid(events, { ...prefs, ...user }, {});
    const { prompt, aliases } = rerankPrompt({ ...prefs, ...user }, ranked);
    expect([...aliases.entries()]).toEqual([['c1', '11111111-aaaa'], ['c2', '22222222-bbbb']]);
    expect(prompt).toMatch(/^<datos>\nGustos: Le gustan: Fútbol\./);
    expect(prompt).toContain('c1 · Deporte · fin de semana, tarde · Partido · sin etiquetas · Cancha de Belén');
    expect(prompt).not.toMatch(/11111111|22222222/);
    expect(leaks(prompt)).toEqual([]);
    expect(prompt).not.toContain('Organizador Real');
  });

  it('descarta alias inventados y repetidos; la frase se valida con Zod (máx. 80)', () => {
    const aliases = new Map([['c1', 'ev-1'], ['c2', 'ev-2']]);
    expect(picksFromResponse([{ alias: 'c2', reason: 'B' }, { alias: 'c9', reason: 'X' }, { alias: 'c2', reason: 'otra' }, { alias: 'c1', reason: 'A' }], aliases)).toEqual([
      { eventId: 'ev-2', reason: 'B' },
      { eventId: 'ev-1', reason: 'A' },
    ]);
    expect(rerankResultSchema.safeParse({ items: [{ alias: 'c1', reason: 'x'.repeat(81) }] }).success).toBe(false);
  });
});

describe('caché de 24 h y relleno', () => {
  const ranked = rankHybrid([ev('a'), ev('b'), ev('c')], prefs, { ai: { a: { tags: ['football'] } } });

  it('usa el orden guardado (solo lo que sigue siendo candidato) y completa con plantilla', () => {
    const cached = [
      { eventId: 'c', reason: 'Gemini dice C', source: 'gemini' },
      { eventId: 'ya-no-existe', reason: 'X', source: 'gemini' },
    ];
    const picked = mergeWithCache(cached, ranked, prefs, 3);
    expect(picked.map((p) => [p.event.id, p.source])).toEqual([
      ['c', 'gemini'],
      ['a', 'template'],
      ['b', 'template'],
    ]);
    expect(picked.every((p) => p.reason.length > 0)).toBe(true);
  });

  it('refreshAiCache: una petición, guarda primero lo que eligió Gemini y luego el resto del top 15, por 24 h', async () => {
    const generateJson = vi.fn(async () => ({ data: { items: [{ alias: 'c3', reason: 'Te va a encantar' }] }, model: 'gemini-3.6-flash' }));
    const repo = fakeRepo();
    expect(await refreshAiCache('u-ai', prefs, ranked, { client: enabledClient(generateJson), repo })).toEqual({ model: 'gemini-3.6-flash', picked: 1 });
    expect(generateJson).toHaveBeenCalledTimes(1);
    const [, saved] = repo.saveCachedRecommendations.mock.calls[0];
    expect(saved.variant).toBe('ai');
    expect(saved.ttlMs).toBe(CACHE_TTL_MS);
    expect(saved.items.map((i) => [i.eventId, i.source])).toEqual([
      [ranked[2].event.id, 'gemini'],
      [ranked[0].event.id, 'template'],
      [ranked[1].event.id, 'template'],
    ]);
  });

  it('si Gemini falla en toda la cadena no se guarda nada (se intenta en la próxima visita)', async () => {
    const repo = fakeRepo();
    const failing = enabledClient(vi.fn(async () => Promise.reject(new AiError('AI_QUOTA_EXHAUSTED'))));
    await expect(refreshAiCache('u-ai', prefs, ranked, { client: failing, repo })).rejects.toMatchObject({ code: 'AI_QUOTA_EXHAUSTED' });
    expect(repo.saveCachedRecommendations).not.toHaveBeenCalled();
  });
});

describe('getRecommendations · variante "ai"', () => {
  beforeEach(() => {
    findPreferencesByUserId.mockResolvedValue(prefs);
    listRecommendationCandidates.mockResolvedValue([ev('a'), ev('b', { category: 'culture' })]);
  });

  it('sin caché: responde YA con frase por plantilla, programa el re-ordenado y registra "mostrado" con origen template', async () => {
    const schedule = vi.fn();
    const repo = fakeRepo();
    const result = await getRecommendations(user, 6, { variant: 'ai', repo, client: enabledClient(), schedule });
    expect(result.map((e) => [e.id, e.reason])).toEqual([
      ['a', 'Porque te gusta el deporte y es un sábado en la tarde'],
      ['b', 'Encaja con tu horario: es un sábado en la tarde'],
    ]);
    expect(schedule).toHaveBeenCalledTimes(1); // segundo plano: el usuario no esperó a Gemini
    expect(repo.insertRecommendationEvents).toHaveBeenCalledWith([
      { userId: 'u-ai', eventId: 'a', variant: 'ai', action: 'shown', source: 'template' },
      { userId: 'u-ai', eventId: 'b', variant: 'ai', action: 'shown', source: 'template' },
    ]);
  });

  it('con caché vigente: usa el orden y las frases de Gemini, no programa nada y registra origen gemini', async () => {
    const schedule = vi.fn();
    const repo = fakeRepo({
      findCachedRecommendations: vi.fn(async () => ({ variant: 'ai', items: [{ eventId: 'b', reason: 'Frase de Gemini', source: 'gemini' }] })),
    });
    const result = await getRecommendations(user, 6, { variant: 'ai', repo, client: enabledClient(), schedule });
    expect(result.map((e) => [e.id, e.reason])).toEqual([
      ['b', 'Frase de Gemini'],
      ['a', 'Porque te gusta el deporte y es un sábado en la tarde'],
    ]);
    expect(schedule).not.toHaveBeenCalled();
    expect(repo.insertRecommendationEvents.mock.calls[0][0].map((r) => r.source)).toEqual(['gemini', 'template']);
  });

  it('con la IA apagada también responde (híbrido sin embeddings + plantilla), sin errores', async () => {
    const repo = fakeRepo();
    const result = await getRecommendations(user, 6, { variant: 'ai', repo, client: { enabled: false } });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.reason)).toBe(true);
  });

  it('variante "rules": registra origen rules y no toca la caché', async () => {
    const repo = fakeRepo();
    await getRecommendations(user, 6, { variant: 'rules', repo });
    expect(repo.findCachedRecommendations).not.toHaveBeenCalled();
    expect(repo.insertRecommendationEvents.mock.calls[0][0].every((r) => r.source === 'rules' && r.variant === 'rules')).toBe(true);
  });

  it('si falla el registro de "mostrado", el usuario igual recibe su lista', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const repo = fakeRepo({ insertRecommendationEvents: vi.fn(async () => Promise.reject(Object.assign(new Error('x'), { code: '42P01' }))) });
    expect(await getRecommendations(user, 6, { variant: 'rules', repo })).toHaveLength(2);
    await new Promise((r) => setTimeout(r, 0));
    warn.mockRestore();
  });
});
