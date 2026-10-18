import * as ratingsRepo from '../repositories/ratings.repository.js';
import * as attendanceRepo from '../repositories/attendance.repository.js';
import * as eventsRepo from '../repositories/events.repository.js';
import { RATING_TAGS, RATING_WINDOW_DAYS } from '../constants/ratings.js';
import { AppError } from '../utils/app-error.js';

const DAY_MS = 24 * 3600 * 1000;

const notFound = () => new AppError(404, 'EVENT_NOT_FOUND', 'El evento no existe');

async function findEvent(eventId) {
  const event = await eventsRepo.findEventById(eventId);
  if (!event || event.status === 'draft') throw notFound();
  return event;
}

// Reglas de elegibilidad: evento finalizado, check-in hecho y dentro del plazo
async function assertCanRate(event, userId) {
  if (event.status !== 'finished') {
    throw new AppError(409, 'EVENT_NOT_FINISHED', 'Solo puedes calificar eventos que ya terminaron');
  }
  const attendee = await attendanceRepo.findAttendee(event.id, userId);
  if (!attendee?.checkedIn) {
    throw new AppError(403, 'NOT_ATTENDED', 'Solo califican quienes hicieron check-in en el evento');
  }
  const deadline = new Date(event.finishedAt).getTime() + RATING_WINDOW_DAYS * DAY_MS;
  if (Date.now() > deadline) {
    throw new AppError(409, 'RATING_WINDOW_CLOSED', `El plazo para calificar (${RATING_WINDOW_DAYS} días) ya terminó`);
  }
}

// Crear y editar comparten regla: una calificación por usuario y evento
export async function rate(user, eventId, input) {
  const event = await findEvent(eventId);
  await assertCanRate(event, user.id);
  return ratingsRepo.upsertRating({ eventId, userId: user.id, ...input });
}

export async function getMine(user, eventId) {
  await findEvent(eventId);
  const rating = await ratingsRepo.findRating(eventId, user.id);
  if (!rating) throw new AppError(404, 'RATING_NOT_FOUND', 'Aún no calificaste este evento');
  return rating;
}

export function buildSummary(ratings, { withComments }) {
  const byStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const byTag = Object.fromEntries(RATING_TAGS.map((tag) => [tag, 0]));
  let sum = 0;
  for (const r of ratings) {
    byStars[r.stars] += 1;
    sum += r.stars;
    for (const tag of r.tags) byTag[tag] += 1;
  }
  const total = ratings.length;
  const result = { average: total ? Math.round((sum / total) * 10) / 10 : null, total, byStars, byTag };
  if (withComments) {
    result.comments = ratings
      .filter((r) => r.comment)
      .slice(0, 20)
      .map((r) => ({ stars: r.stars, comment: r.comment, createdAt: r.createdAt }));
  }
  return result;
}

// Los comentarios (anónimos) solo los ve el organizador del evento
export async function summary(user, eventId) {
  const event = await findEvent(eventId);
  const ratings = await ratingsRepo.listEventRatings(eventId);
  return buildSummary(ratings, { withComments: event.organizerId === user.id });
}
