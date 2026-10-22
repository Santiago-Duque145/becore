import { describe, it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { normalizeQuery, scrubQuery } from '../src/services/search/query-text.js';
import { detectIntent } from '../src/services/search/intent.js';
import { SEARCH_THRESHOLD, eventWhen, intentBoost, literalMatch, scaleSimilarity, scoreEvent } from '../src/services/search/score.js';
import { USER_LIMIT, createSearchService } from '../src/services/search/search.service.js';
import { AiError } from '../src/services/ai/geminiClient.js';

// 2030-11-02 es sábado; 2030-11-04 y la noche del 05 UTC son lunes en Bogotá
const football = { id: 'e-fut', title: 'Partido de microfútbol', description: 'Equipos mixtos', category: 'sport', location: 'Cancha de Belén', startsAt: '2030-11-02T20:00:00Z' };
const movie = { id: 'e-cine', title: 'Estreno Avengers Doomsday', description: 'Función especial', category: 'culture', location: 'Viva Envigado', startsAt: '2030-11-05T00:30:00Z' };
const yoga = { id: 'e-yoga', title: 'Yoga al amanecer', description: 'Trae tu tapete', category: 'sport', location: 'Parque Arví', startsAt: '2030-11-04T13:00:00Z' };
const ALL = [football, movie, yoga];
const user = { id: 'u-1' };
const vec = [0.1, 0.2];

describe('query-text', () => {
  it('scrubQuery quita correos y teléfonos, deja números cortos (5k, horas)', () => {
    expect(scrubQuery('fútbol con ana@correo.com o al 300 123 4567')).toBe('fútbol con o al');
    expect(scrubQuery('carrera 5k a las 7')).toBe('carrera 5k a las 7');
    expect(scrubQuery('a'.repeat(300))).toHaveLength(200);
  });

  it('normalizeQuery: minúsculas, sin tildes ni signos', () => {
    expect(normalizeQuery('  ¿Fútbol   el SÁBADO? ')).toBe('futbol el sabado');
  });
});

describe('detectIntent', () => {
  it('día, franja, categoría y gusto en una frase', () => {
    const intent = detectIntent('Fútbol el sábado en la tarde, algo de deporte');
    expect([...intent.days]).toEqual([6]);
    expect(intent.slot).toBe('afternoon');
    expect([...intent.categories]).toEqual(['sport']);
    expect([...intent.interests]).toEqual(['football']);
  });

  it('"mañana" sola no es franja; "en la mañana" sí; fin de semana y entre semana', () => {
    expect(detectIntent('algo para mañana').slot).toBeNull();
    expect(detectIntent('yoga en la mañana').slot).toBe('morning');
    expect(detectIntent('planes el fin de semana').days.has('weekends')).toBe(true);
    expect(detectIntent('algo entre semana en la noche').days.has('weekdays')).toBe(true);
  });

  it('las palabras cuentan completas (micro ≠ microondas)', () => {
    expect(detectIntent('microondas').interests.size).toBe(0);
    expect(detectIntent('una peli').interests.has('cinema')).toBe(true);
  });
});

describe('score', () => {
  it('reescala la similitud entre el piso y el techo', () => {
    expect(scaleSimilarity(0.44)).toBe(0);
    expect(scaleSimilarity(0.8)).toBe(1);
    expect(scaleSimilarity(0.3)).toBe(0);
    expect(scaleSimilarity(0.62)).toBeCloseTo(0.5);
  });

  it('coincidencia literal en título o lugar, sin palabras de relleno', () => {
    expect(literalMatch('Avengers', movie)).toBe(true);
    expect(literalMatch('algo en arvi', yoga)).toBe(true);
    expect(literalMatch('cine en Belén', football)).toBe(false);
  });

  it('día y franja en hora de Bogotá', () => {
    expect(eventWhen(football.startsAt)).toEqual({ dow: 6, slot: 'afternoon' });
    expect(eventWhen(movie.startsAt)).toEqual({ dow: 1, slot: 'evening' });
  });

  it('refuerzos: día 0,15 · franja 0,1 · categoría 0,1 · gusto 0,25', () => {
    const intent = detectIntent('fútbol el sábado en la tarde, deporte');
    expect(intentBoost(intent, football, ['football'])).toBeCloseTo(0.6);
    expect(intentBoost(intent, movie, ['cinema'])).toBe(0);
    expect(intentBoost(detectIntent('fin de semana'), football)).toBeCloseTo(0.15);
    expect(intentBoost(detectIntent('entre semana'), movie)).toBeCloseTo(0.15);
  });

  it('sin refuerzos, solo entra por similitud alta (~0,71 cruda)', () => {
    const intent = detectIntent('algo tranquilo');
    expect(scoreEvent({ q: 'algo tranquilo', intent, event: yoga, similarity: 0.7 })).toBeLessThan(SEARCH_THRESHOLD);
    expect(scoreEvent({ q: 'algo tranquilo', intent, event: yoga, similarity: 0.72 })).toBeGreaterThanOrEqual(SEARCH_THRESHOLD);
  });
});

function setup({ enabled = true, matches = [], tags = {}, embed } = {}) {
  const client = { enabled, embedText: embed ?? vi.fn(async () => vec) };
  const events = { listEvents: vi.fn(async ({ category }) => ({ rows: ALL.filter((e) => !category || e.category === category) })) };
  const search = {
    matchEventEmbeddings: vi.fn(async () => matches),
    findEventTagsByIds: vi.fn(async () => tags),
    insertSearchEvent: vi.fn(async () => {}),
    markSearchOpened: vi.fn(async () => {}),
  };
  const withAttendance = vi.fn(async (_u, list) => list.map((e) => ({ ...e, myAttendance: null })));
  const service = createSearchService({ client, events, search, withAttendance, schedule: (fn) => fn() });
  return { service, client, events, search };
}

describe('searchEvents', () => {
  it('semántica: similitud + refuerzos, ordenado por puntaje y con registro sin datos de la persona', async () => {
    const { service, client, search } = setup({
      matches: [
        { eventId: 'e-fut', similarity: 0.62 },
        { eventId: 'e-yoga', similarity: 0.6 },
        { eventId: 'e-cine', similarity: 0.55 },
      ],
      tags: { 'e-fut': ['football'] },
    });
    const res = await service.searchEvents(user, { q: 'fútbol el sábado en la tarde' });
    expect(res.data.map((e) => e.id)).toEqual(['e-fut']);
    expect(res.meta).toMatchObject({ mode: 'semantic', total: 1 });
    expect(client.embedText).toHaveBeenCalledWith('task: search result | query: fútbol el sábado en la tarde');
    expect(search.insertSearchEvent).toHaveBeenCalledWith({ id: res.meta.searchId, queryText: 'fútbol el sábado en la tarde', mode: 'semantic', resultsCount: 1 });
  });

  it('"Avengers" entra por coincidencia literal aunque la similitud sea baja', async () => {
    const { service } = setup({ matches: [{ eventId: 'e-cine', similarity: 0.5 }] });
    expect((await service.searchEvents(user, { q: 'Avengers' })).data.map((e) => e.id)).toEqual(['e-cine']);
  });

  it('nada pasa el umbral → lista vacía en modo semántico', async () => {
    const { service } = setup({ matches: ALL.map((e) => ({ eventId: e.id, similarity: 0.6 })) });
    const res = await service.searchEvents(user, { q: 'clases de piano' });
    expect(res).toMatchObject({ data: [], meta: { mode: 'semantic', total: 0 } });
  });

  it('a Gemini y al registro va la consulta sin correo ni teléfono', async () => {
    const { service, client, search } = setup();
    await service.searchEvents(user, { q: 'yoga escribe a ana@correo.com o 3001234567' });
    expect(client.embedText).toHaveBeenCalledWith('task: search result | query: yoga escribe a o');
    expect(search.insertSearchEvent.mock.calls[0][0].queryText).toBe('yoga escribe a o');
  });

  it('la caché evita pedir el mismo embedding dos veces (sin tildes ni mayúsculas)', async () => {
    const { service, client } = setup();
    await service.searchEvents(user, { q: 'Fútbol' });
    await service.searchEvents({ id: 'u-2' }, { q: 'futbol' });
    expect(client.embedText).toHaveBeenCalledTimes(1);
  });

  it('la categoría filtra los candidatos', async () => {
    const { service, events } = setup({ matches: [{ eventId: 'e-yoga', similarity: 0.8 }, { eventId: 'e-cine', similarity: 0.8 }] });
    const res = await service.searchEvents(user, { q: 'algo tranquilo', category: 'culture' });
    expect(events.listEvents).toHaveBeenCalledWith(expect.objectContaining({ scope: 'upcoming', category: 'culture' }));
    expect(res.data.map((e) => e.id)).toEqual(['e-cine']);
  });

  it('IA apagada → clásica en título, descripción y lugar, sin tildes', async () => {
    const { service, client } = setup({ enabled: false });
    const res = await service.searchEvents(user, { q: 'tapete' });
    expect(res.data.map((e) => e.id)).toEqual(['e-yoga']);
    expect(res.meta.mode).toBe('classic');
    expect(client.embedText).not.toHaveBeenCalled();
    expect((await service.searchEvents(user, { q: 'belen' })).data.map((e) => e.id)).toEqual(['e-fut']);
  });

  it.each([
    ['error de red', new AiError('AI_UNAVAILABLE')],
    ['cupo agotado', new AiError('AI_QUOTA_EXHAUSTED')],
  ])('%s de Gemini → clásica, sin 500', async (_label, error) => {
    const { service } = setup({ embed: vi.fn(async () => Promise.reject(error)) });
    const res = await service.searchEvents(user, { q: 'Avengers' });
    expect(res.meta.mode).toBe('classic');
    expect(res.data.map((e) => e.id)).toEqual(['e-cine']);
  });

  it('falla la función de la base → clásica', async () => {
    const { service, search } = setup();
    search.matchEventEmbeddings.mockRejectedValue(new Error('boom'));
    expect((await service.searchEvents(user, { q: 'Arví' })).meta.mode).toBe('classic');
  });

  it(`más de ${USER_LIMIT} embeddings nuevos en 10 min → clásica para esa persona`, async () => {
    const { service, client } = setup();
    for (let i = 0; i < USER_LIMIT; i += 1) await service.searchEvents(user, { q: `consulta ${i}` });
    expect((await service.searchEvents(user, { q: 'otra más' })).meta.mode).toBe('classic');
    expect((await service.searchEvents({ id: 'u-2' }, { q: 'otra más' })).meta.mode).toBe('semantic');
    expect(client.embedText).toHaveBeenCalledTimes(USER_LIMIT + 1);
  });

  it('recordOpen marca la búsqueda y no propaga errores', async () => {
    const { service, search } = setup();
    search.markSearchOpened.mockRejectedValue(new Error('boom'));
    expect(() => service.recordOpen('s-1', 'e-fut')).not.toThrow();
    expect(search.markSearchOpened).toHaveBeenCalledWith('s-1', 'e-fut');
  });
});

const migration = await readFile(new URL('../../supabase/migrations/20261022180000_ai_search.sql', import.meta.url), 'utf8');

describe('migración ai_search', () => {
  const code = migration.replace(/--.*$/gm, '');

  it('match_event_embeddings: security definer, search_path vacío, ordena por <=> y solo la ejecuta service_role', () => {
    expect(code).toMatch(/security definer\s+set search_path = ''/);
    expect(code).toMatch(/order by ea\.embedding operator\(extensions\.<=>\) p_query/);
    expect(code).toMatch(/revoke all on function public\.match_event_embeddings\(extensions\.vector, int\) from public, anon, authenticated/);
    expect(code).toMatch(/grant execute on function public\.match_event_embeddings\(extensions\.vector, int\) to service_role/);
  });

  it('search_events: sin user_id, RLS sin políticas y sin permisos para anon/authenticated', () => {
    const table = code.slice(code.indexOf('create table public.search_events'), code.indexOf(');', code.indexOf('create table public.search_events')));
    expect(table).not.toMatch(/user_id|profiles/);
    expect(code).toMatch(/alter table public\.search_events enable row level security/);
    expect(code).toMatch(/revoke all on public\.search_events from anon, authenticated/);
    expect(code).not.toMatch(/create policy/);
  });
});
