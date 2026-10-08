import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  eventIdParamsSchema,
} from '../schemas/events.schemas.js';
import * as controller from '../controllers/events.controller.js';

const router = Router();
const organizerOnly = [requireAuth, requireRole('organizer')];
const byId = { params: eventIdParamsSchema };

router.get('/events', requireAuth, validate({ query: listEventsQuerySchema }), controller.listEvents);
router.post('/events', ...organizerOnly, validate({ body: createEventSchema }), controller.createEvent);
router.get('/events/:id', requireAuth, validate(byId), controller.getEvent);
router.patch('/events/:id', ...organizerOnly, validate({ ...byId, body: updateEventSchema }), controller.updateEvent);
router.post('/events/:id/cancel', ...organizerOnly, validate(byId), controller.cancelEvent);
router.post('/events/:id/publish', ...organizerOnly, validate(byId), controller.publishEvent);

export default router;
