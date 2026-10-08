import * as eventsService from '../services/events.service.js';

export async function listEvents(req, res) {
  const { data, meta } = await eventsService.listEvents(req.user, req.validatedQuery);
  res.json({ data, meta });
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
