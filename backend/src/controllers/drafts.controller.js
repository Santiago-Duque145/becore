import { draftService } from '../services/drafts/draft.service.js';

// IA8: siempre 200; si la IA no está disponible, data.draft es null y data.reason dice por qué
export async function createEventDraft(req, res) {
  res.json({ data: await draftService.createDraft(req.user, req.body) });
}
