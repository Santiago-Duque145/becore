import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

vi.mock('../src/config/supabase.js', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn() } },
}));
vi.mock('../src/repositories/profiles.repository.js', () => ({
  findProfileById: vi.fn(),
  updateProfile: vi.fn(),
  findAvatarsByIds: vi.fn(async () => []),
}));
vi.mock('../src/services/drafts/draft.service.js', () => ({
  draftService: { createDraft: vi.fn() },
}));

import { supabaseAdmin } from '../src/config/supabase.js';
import { findProfileById } from '../src/repositories/profiles.repository.js';
import { draftService } from '../src/services/drafts/draft.service.js';

const organizer = { id: 'org-1', email: 'o@becore.test', fullName: 'Org', role: 'organizer' };
const participant = { id: 'par-1', email: 'p@becore.test', fullName: 'Par', role: 'participant' };
const post = (body) => request(app).post('/api/v1/events/draft').set('Authorization', 'Bearer token').send(body);
const TEXT = 'micro el sábado en la tarde en Belén para 12 personas';

beforeEach(() => {
  vi.clearAllMocks();
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'org-1' } }, error: null });
  findProfileById.mockResolvedValue(organizer);
  draftService.createDraft.mockResolvedValue({ draft: { title: 'Micro en Belén' } });
});

describe('POST /api/v1/events/draft', () => {
  it('sin sesión → 401', async () => {
    expect((await request(app).post('/api/v1/events/draft').send({ text: TEXT })).status).toBe(401);
  });

  it('participante → 403 y no llama al servicio', async () => {
    findProfileById.mockResolvedValue(participant);
    expect((await post({ text: TEXT })).status).toBe(403);
    expect(draftService.createDraft).not.toHaveBeenCalled();
  });

  it('texto de menos de 10 o más de 500 caracteres, o ausente → 400', async () => {
    expect((await post({ text: 'corto' })).status).toBe(400);
    expect((await post({ text: 'x'.repeat(501) })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect(draftService.createDraft).not.toHaveBeenCalled();
  });

  it('organizador → 200 con el borrador, y el servicio recibe al usuario y la frase', async () => {
    const res = await post({ text: `  ${TEXT}  ` });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { draft: { title: 'Micro en Belén' } } });
    expect(draftService.createDraft).toHaveBeenCalledWith(organizer, { text: TEXT });
  });

  it('sin IA → 200 con draft null y reason', async () => {
    draftService.createDraft.mockResolvedValue({ draft: null, reason: 'AI_DISABLED' });
    const res = await post({ text: TEXT });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ draft: null, reason: 'AI_DISABLED' });
  });
});
