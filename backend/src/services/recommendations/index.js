// "Para ti" (auth-onboarding §8): getCandidates(user) → scoreEvent → rank.
// Cada etapa es reemplazable sin cambiar el contrato de GET /events/recommended (Event + reason):
// un re-ranking con IA entraría como otra función entre scoreEvent y la respuesta (recibe los
// candidatos ya puntuados y devuelve el mismo arreglo reordenado, con su reason), y si falla se
// usa el orden por reglas. Hoy no hay IA: está fuera de alcance (CLAUDE.md §9).
import * as eventsRepo from '../../repositories/events.repository.js';
import { findUserAttendances } from '../../repositories/attendance.repository.js';
import { findPreferencesByUserId } from '../../repositories/preferences.repository.js';
import { toEventsWithAttendance } from '../events.service.js';
import { rankScored, scoreEvent } from './score.js';

// Publicados, futuros, con cupo, que el usuario no organiza ni tiene confirmados
export async function getCandidates(user) {
  const events = await eventsRepo.listRecommendationCandidates({ excludeOrganizerId: user.id });
  const withSpots = events.filter((e) => e.confirmedCount < e.capacity);
  const attendances = await findUserAttendances(
    user.id,
    withSpots.map((e) => e.id),
  );
  const confirmed = new Set(attendances.filter((a) => a.status === 'confirmed').map((a) => a.eventId));
  return withSpots.filter((e) => !confirmed.has(e.id));
}

export async function getRecommendations(user, limit) {
  const prefs = await findPreferencesByUserId(user.id);
  if (!prefs) return [];
  const candidates = await getCandidates(user);
  const ranked = rankScored(
    candidates.map((event) => ({ event, ...scoreEvent(event, prefs) })),
    limit,
  );
  const events = await toEventsWithAttendance(
    user,
    ranked.map((r) => r.event),
  );
  return events.map((event, i) => ({ ...event, reason: ranked[i].reason }));
}
