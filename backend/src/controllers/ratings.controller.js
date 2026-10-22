import * as ratingsService from '../services/ratings.service.js';

export async function createRating(req, res) {
  res.status(201).json({ data: await ratingsService.rate(req.user, req.params.id, req.body) });
}

export async function updateRating(req, res) {
  res.json({ data: await ratingsService.rate(req.user, req.params.id, req.body) });
}

export async function getMyRating(req, res) {
  res.json({ data: await ratingsService.getMine(req.user, req.params.id) });
}

export async function getSummary(req, res) {
  res.json({ data: await ratingsService.summary(req.user, req.params.id) });
}
