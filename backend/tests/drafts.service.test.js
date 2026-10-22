import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiError } from '../src/services/ai/geminiClient.js';
import { createDraftService, DAILY_LIMIT } from '../src/services/drafts/draft.service.js';
import { draftOutputSchema } from '../src/services/drafts/draft-prompt.js';

const NOW = Date.parse('2026-10-21T15:00:00Z'); // miércoles 10:00 en Bogotá
const user = { id: 'org-1', email: 'org@becore.test', fullName: 'Olga Organizadora', role: 'organizer' };

const output = {
  title: 'Micro en Belén',
  description: 'Partido de micro para principiantes. Trae tu agua.',
  category: 'sport',
  suggested_duration_minutes: 100,
  suggested_capacity: 12,
  place_text: 'Parque de Belén',
  date_hint: 'el sábado en la tarde',
};

function setup({ generate, locate = vi.fn(async () => ({ lat: 6.23, lng: -75.6, label: 'x' })), enabled = true } = {}) {
  const client = { enabled, generateJson: generate ?? vi.fn(async () => ({ data: draftOutputSchema.parse(output), model: 'gemini-test' })) };
  return { client, locate, service: createDraftService({ client, locate, now: () => NOW }) };
}

beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('createDraft', () => {
  it('JSON válido → borrador con fecha por reglas, duración de las opciones y pin del geocodificador', async () => {
    const { service, locate } = setup();
    const { draft, reason } = await service.createDraft(user, { text: 'micro el sábado en la tarde en Belén para 12' });
    expect(reason).toBeUndefined();
    expect(draft).toEqual({
      title: 'Micro en Belén',
      description: 'Partido de micro para principiantes. Trae tu agua.',
      category: 'sport',
      startsAt: '2026-10-24T21:00:00.000Z', // sábado 16:00 Bogotá
      durationMinutes: 90,
      capacity: 12,
      location: 'Parque de Belén',
      latitude: 6.23,
      longitude: -75.6,
    });
    expect(locate).toHaveBeenCalledWith('Parque de Belén');
  });

  it('sin fecha entendible ni lugar encontrado → startsAt y coordenadas null (el formulario sigue manual)', async () => {
    const generate = vi.fn(async () => ({ data: draftOutputSchema.parse({ ...output, date_hint: 'pronto', place_text: '' }), model: 'm' }));
    const { service, locate } = setup({ generate });
    const { draft } = await service.createDraft(user, { text: 'algo tranquilo pronto' });
    expect(draft).toMatchObject({ startsAt: null, latitude: null, longitude: null, location: '' });
    expect(locate).not.toHaveBeenCalled();
  });

  it('si el geocodificador falla, el borrador sale sin pin', async () => {
    const { service } = setup({ locate: vi.fn(async () => { throw new Error('boom'); }) });
    const { draft } = await service.createDraft(user, { text: 'micro el sábado en Belén' });
    expect(draft).toMatchObject({ location: 'Parque de Belén', latitude: null, longitude: null });
  });

  it('IA apagada → { draft: null, reason } sin llamar al modelo', async () => {
    const { service, client } = setup({ enabled: false });
    expect(await service.createDraft(user, { text: 'micro el sábado en Belén' })).toEqual({ draft: null, reason: 'AI_DISABLED' });
    expect(client.generateJson).not.toHaveBeenCalled();
  });

  it.each([
    ['AI_QUOTA_EXHAUSTED', 'AI_ERROR'],
    ['AI_INVALID_OUTPUT', 'AI_ERROR'],
    ['AI_UNAVAILABLE', 'AI_UNAVAILABLE'],
  ])('fallo %s → 200 con draft null y reason %s', async (code, reason) => {
    const { service } = setup({ generate: vi.fn(async () => { throw new AiError(code); }) });
    expect(await service.createDraft(user, { text: 'micro el sábado en Belén' })).toEqual({ draft: null, reason });
  });

  it('límite diario por organizador; otro organizador y el día siguiente no se afectan', async () => {
    let now = NOW;
    const client = { enabled: true, generateJson: vi.fn(async () => ({ data: draftOutputSchema.parse(output), model: 'm' })) };
    const service = createDraftService({ client, locate: async () => null, now: () => now });
    for (let i = 0; i < DAILY_LIMIT; i++) expect((await service.createDraft(user, { text: 'micro el sábado' })).draft).not.toBeNull();
    expect(await service.createDraft(user, { text: 'micro el sábado' })).toEqual({ draft: null, reason: 'DAILY_LIMIT' });
    expect((await service.createDraft({ ...user, id: 'org-2' }, { text: 'micro el sábado' })).draft).not.toBeNull();
    now += 24 * 3600 * 1000;
    expect((await service.createDraft(user, { text: 'micro el sábado' })).draft).not.toBeNull();
    expect(client.generateJson).toHaveBeenCalledTimes(DAILY_LIMIT + 2);
  });

  it('privacidad: al modelo solo va la frase, sin correos ni teléfonos ni datos del organizador', async () => {
    const { service, client } = setup();
    await service.createDraft(user, { text: 'micro en Belén, escríbeme a olga@correo.com o al 300 123 4567' });
    const sent = JSON.stringify(client.generateJson.mock.calls[0][0]);
    expect(sent).toContain('micro en Belén');
    for (const secret of ['olga@correo.com', '300 123 4567', 'Olga', 'org-1', 'org@becore.test']) expect(sent).not.toContain(secret);
  });
});

describe('draftOutputSchema', () => {
  it('categoría inventada → "other"; capacidad o duración fuera de rango → null', () => {
    const parsed = draftOutputSchema.parse({ ...output, category: 'ajedrez', suggested_capacity: 5000, suggested_duration_minutes: 2 });
    expect(parsed).toMatchObject({ category: 'other', suggested_capacity: null, suggested_duration_minutes: null });
  });

  it('título vacío o de más de 80 caracteres → inválido (la cadena prueba otro modelo)', () => {
    expect(draftOutputSchema.safeParse({ ...output, title: 'x'.repeat(81) }).success).toBe(false);
    expect(draftOutputSchema.safeParse({ ...output, title: '' }).success).toBe(false);
  });
});
