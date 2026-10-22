import { getAiMetrics, recordAction } from '../services/recommendations/feedback.js';

// 204 siempre: si el evento no se le mostró en "Para ti" (o ya contaba) simplemente no se registra; no es un error
export async function feedback(req, res) {
  await recordAction(req.user.id, req.body.eventId, req.body.action);
  res.status(204).end();
}

export async function aiMetrics(_req, res) {
  res.json({ data: await getAiMetrics() });
}
