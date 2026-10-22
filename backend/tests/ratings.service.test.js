import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/ratings.repository.js', () => ({
  findRating: vi.fn(),
  upsertRating: vi.fn(),
  listEventRatings: vi.fn(),
}));
vi.mock('../src/repositories/attendance.repository.js', () => ({ findAttendee: vi.fn() }));
vi.mock('../src/repositories/events.repository.js', () => ({ findEventById: vi.fn() }));

import * as ratingsRepo from '../src/repositories/ratings.repository.js';
import * as attendanceRepo from '../src/repositories/attendance.repository.js';
import * as eventsRepo from '../src/repositories/events.repository.js';
import { rate, getMine, summary, buildSummary } from '../src/services/ratings.service.js';
import { deleteCachedRecommendations } from '../src/repositories/ai.repository.js';

const user = { id: 'u1' };
const input = { stars: 5, tags: ['punctual'], comment: null };
const DAY = 24 * 3600 * 1000;
const finishedEvent = (overrides = {}) => ({
  id: 'e1',
  status: 'finished',
  organizerId: 'org',
  finishedAt: new Date(Date.now() - DAY).toISOString(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  eventsRepo.findEventById.mockResolvedValue(finishedEvent());
  attendanceRepo.findAttendee.mockResolvedValue({ status: 'confirmed', checkedIn: true });
  ratingsRepo.upsertRating.mockImplementation(async (r) => ({ id: 'r1', ...r }));
});

describe('rate', () => {
  it('guarda la calificación de quien hizo check-in', async () => {
    const res = await rate(user, 'e1', input);
    expect(ratingsRepo.upsertRating).toHaveBeenCalledWith({ eventId: 'e1', userId: 'u1', ...input });
    expect(res.stars).toBe(5);
  });

  it('IA3: calificar borra el "Para ti" guardado de quien califica (cambia el bonus de afinidad)', async () => {
    await rate(user, 'e1', input);
    expect(deleteCachedRecommendations).toHaveBeenCalledWith('u1');
  });

  it('evento inexistente o borrador → 404', async () => {
    eventsRepo.findEventById.mockResolvedValue(null);
    await expect(rate(user, 'e1', input)).rejects.toMatchObject({ status: 404 });
    eventsRepo.findEventById.mockResolvedValue(finishedEvent({ status: 'draft' }));
    await expect(rate(user, 'e1', input)).rejects.toMatchObject({ status: 404 });
  });

  it('evento no finalizado → 409 EVENT_NOT_FINISHED', async () => {
    eventsRepo.findEventById.mockResolvedValue(finishedEvent({ status: 'in_progress' }));
    await expect(rate(user, 'e1', input)).rejects.toMatchObject({ status: 409, code: 'EVENT_NOT_FINISHED' });
  });

  it('sin check-in → 403 NOT_ATTENDED', async () => {
    attendanceRepo.findAttendee.mockResolvedValue({ status: 'confirmed', checkedIn: false });
    await expect(rate(user, 'e1', input)).rejects.toMatchObject({ status: 403, code: 'NOT_ATTENDED' });
    attendanceRepo.findAttendee.mockResolvedValue(null);
    await expect(rate(user, 'e1', input)).rejects.toMatchObject({ code: 'NOT_ATTENDED' });
    expect(ratingsRepo.upsertRating).not.toHaveBeenCalled();
  });

  it('fuera de los 7 días → 409 RATING_WINDOW_CLOSED', async () => {
    eventsRepo.findEventById.mockResolvedValue(finishedEvent({ finishedAt: new Date(Date.now() - 8 * DAY).toISOString() }));
    await expect(rate(user, 'e1', input)).rejects.toMatchObject({ status: 409, code: 'RATING_WINDOW_CLOSED' });
  });

  it('calificar de nuevo edita (un solo registro por usuario y evento)', async () => {
    await rate(user, 'e1', input);
    await rate(user, 'e1', { ...input, stars: 3 });
    expect(ratingsRepo.upsertRating).toHaveBeenCalledTimes(2);
    expect(ratingsRepo.upsertRating).toHaveBeenLastCalledWith(expect.objectContaining({ stars: 3, userId: 'u1' }));
  });
});

describe('getMine', () => {
  it('sin calificación → 404 RATING_NOT_FOUND', async () => {
    ratingsRepo.findRating.mockResolvedValue(null);
    await expect(getMine(user, 'e1')).rejects.toMatchObject({ code: 'RATING_NOT_FOUND' });
  });
});

describe('summary', () => {
  const ratings = [
    { stars: 5, tags: ['punctual', 'good_vibe'], comment: 'Genial', createdAt: 'a' },
    { stars: 4, tags: ['punctual'], comment: null, createdAt: 'b' },
  ];

  it('promedio, conteos y comentarios solo para el organizador', async () => {
    ratingsRepo.listEventRatings.mockResolvedValue(ratings);
    const asOrganizer = await summary({ id: 'org' }, 'e1');
    expect(asOrganizer).toMatchObject({ average: 4.5, total: 2, byStars: { 4: 1, 5: 1 }, byTag: { punctual: 2, good_vibe: 1 } });
    expect(asOrganizer.comments).toEqual([{ stars: 5, comment: 'Genial', createdAt: 'a' }]);

    const asOther = await summary({ id: 'otro' }, 'e1');
    expect(asOther).not.toHaveProperty('comments');
  });

  it('sin calificaciones → average null', () => {
    expect(buildSummary([], { withComments: false })).toMatchObject({ average: null, total: 0 });
  });
});
