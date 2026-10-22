import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/repositories/events.repository.js', () => ({
  listRecommendationCandidates: vi.fn(),
}));
vi.mock('../src/repositories/attendance.repository.js', () => ({
  findUserAttendances: vi.fn(),
  listConfirmedPreviewIds: vi.fn(),
  listConfirmedUserIds: vi.fn(),
}));
vi.mock('../src/repositories/preferences.repository.js', () => ({
  findPreferencesByUserId: vi.fn(),
}));
vi.mock('../src/services/notifications.service.js', () => ({ notify: vi.fn() }));

import { listRecommendationCandidates } from '../src/repositories/events.repository.js';
import { findUserAttendances } from '../src/repositories/attendance.repository.js';
import { findPreferencesByUserId } from '../src/repositories/preferences.repository.js';
import { getCandidates, getRecommendations } from '../src/services/recommendations/index.js';

const user = { id: 'u1', role: 'participant' };
const SAT_8AM = '2026-10-31T13:00:00.000Z';
const ev = (id, over = {}) => ({
  id,
  title: id,
  category: 'sport',
  location: 'Cancha',
  startsAt: SAT_8AM,
  capacity: 10,
  confirmedCount: 2,
  status: 'published',
  organizerId: 'org',
  organizer: { id: 'org', fullName: 'Org' },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  findUserAttendances.mockResolvedValue([]);
});

describe('getCandidates', () => {
  it('excluye los del propio usuario, los llenos y los que ya confirmó', async () => {
    listRecommendationCandidates.mockResolvedValue([ev('libre'), ev('lleno', { confirmedCount: 10 }), ev('confirmado'), ev('cancelado')]);
    findUserAttendances.mockImplementation(async (_u, ids) =>
      [
        { eventId: 'confirmado', status: 'confirmed', checkedIn: false },
        { eventId: 'cancelado', status: 'cancelled', checkedIn: false },
      ].filter((a) => ids.includes(a.eventId)),
    );
    const result = await getCandidates(user);
    expect(listRecommendationCandidates).toHaveBeenCalledWith({ excludeOrganizerId: 'u1' });
    expect(result.map((e) => e.id)).toEqual(['libre', 'cancelado']);
  });
});

describe('getRecommendations · variante "rules" (R5 tal cual)', () => {
  it('sin preferencias devuelve [] sin consultar eventos', async () => {
    findPreferencesByUserId.mockResolvedValue(null);
    expect(await getRecommendations(user, 6, { variant: 'rules' })).toEqual([]);
    expect(listRecommendationCandidates).not.toHaveBeenCalled();
  });

  it('ordena por puntaje, quita los de 0 y agrega reason con el formato de Event', async () => {
    findPreferencesByUserId.mockResolvedValue({ categories: ['culture'], days: ['weekends'], timeSlots: [], zone: null });
    listRecommendationCandidates.mockResolvedValue([
      ev('finde', { category: 'other' }),
      ev('cultura', { category: 'culture' }),
      ev('nada', { category: 'other', startsAt: '2026-11-04T00:00:00.000Z' }),
    ]);
    const result = await getRecommendations(user, 6, { variant: 'rules' });
    expect(result.map((e) => [e.id, e.reason])).toEqual([
      ['cultura', 'Porque te gusta la cultura'],
      ['finde', 'Encaja con tus fines de semana'],
    ]);
    expect(result[0]).toMatchObject({ availableSpots: 8, isFull: false, myAttendance: null });
    expect(result[0]).not.toHaveProperty('organizerId');
  });

  it('respeta el límite', async () => {
    findPreferencesByUserId.mockResolvedValue({ categories: ['sport'], days: [], timeSlots: [], zone: null });
    listRecommendationCandidates.mockResolvedValue(['a', 'b', 'c'].map((id) => ev(id)));
    expect(await getRecommendations(user, 2, { variant: 'rules' })).toHaveLength(2);
  });
});
