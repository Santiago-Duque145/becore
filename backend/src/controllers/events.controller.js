import * as eventsService from '../services/events.service.js';
import { explainEmpty, getRecommendations } from '../services/recommendations/index.js';
import { searchService } from '../services/search/search.service.js';

export async function listEvents(req, res) {
  const { data, meta } = await eventsService.listEvents(req.user, req.validatedQuery);
  res.json({ data, meta });
}

// meta.emptyReason solo cuando la lista viene vacía (es aditivo: data sigue siendo el mismo arreglo)
export async function listRecommended(req, res) {
  const data = await getRecommendations(req.user, req.validatedQuery.limit);
  if (data.length) return res.json({ data });
  res.json({ data, meta: { emptyReason: await explainEmpty(req.user) } });
}

// IA7: semántica si la IA responde; si no, clásica (meta.mode lo dice)
export async function searchEvents(req, res) {
  const { data, meta } = await searchService.searchEvents(req.user, req.validatedQuery);
  res.json({ data, meta });
}

// Registro sin esperar: siempre 204
export function recordSearchOpen(req, res) {
  searchService.recordOpen(req.params.searchId, req.body.eventId);
  res.status(204).end();
}

export async function createEvent(req, res) {
  const data = await eventsService.createEvent(req.user, req.body);
  res.status(201).json({ data });
}

export async function getEvent(req, res) {
  res.json({ data: await eventsService.getEvent(req.user, req.params.id) });
}

export async function updateEvent(req, res) {
  res.json({ data: await eventsService.updateEvent(req.user, req.params.id, req.body) });
}

export async function cancelEvent(req, res) {
  res.json({ data: await eventsService.cancelEvent(req.user, req.params.id) });
}

export async function publishEvent(req, res) {
  res.json({ data: await eventsService.publishEvent(req.user, req.params.id) });
}

export async function createCoverUpload(req, res) {
  res.status(201).json({ data: await eventsService.createCoverUpload(req.user, req.body.contentType, req.body.withOriginal) });
}

export async function finishEvent(req, res) {
  res.json({ data: await eventsService.finishEvent(req.user, req.params.id) });
}

export async function listConfirmedPeople(req, res) {
  res.json({ data: await eventsService.listConfirmedPeople(req.user, req.params.id) });
}
