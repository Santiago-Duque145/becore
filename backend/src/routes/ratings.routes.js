import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import { eventIdParamsSchema } from '../schemas/events.schemas.js';
import { ratingBodySchema } from '../schemas/ratings.schemas.js';
import * as controller from '../controllers/ratings.controller.js';

const router = Router();
const participantOnly = [requireAuth, requireRole('participant')];
const byId = { params: eventIdParamsSchema };

router.post('/events/:id/rating', ...participantOnly, validate({ ...byId, body: ratingBodySchema }), controller.createRating);
router.put('/events/:id/rating', ...participantOnly, validate({ ...byId, body: ratingBodySchema }), controller.updateRating);
router.get('/events/:id/rating/me', ...participantOnly, validate(byId), controller.getMyRating);
router.get('/events/:id/ratings/summary', requireAuth, validate(byId), controller.getSummary);

export default router;
