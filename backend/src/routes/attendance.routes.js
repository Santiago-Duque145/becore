import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import { eventIdParamsSchema } from '../schemas/events.schemas.js';
import { activityQuerySchema, attendeeParamsSchema, checkInBodySchema } from '../schemas/attendance.schemas.js';
import * as controller from '../controllers/attendance.controller.js';

const router = Router();
const participantOnly = [requireAuth, requireRole('participant')];
const organizerOnly = [requireAuth, requireRole('organizer')];
const byId = { params: eventIdParamsSchema };

router.post('/events/:id/attendance', ...participantOnly, validate(byId), controller.confirmAttendance);
router.delete('/events/:id/attendance', ...participantOnly, validate(byId), controller.cancelAttendance);
router.get('/events/:id/attendees', ...organizerOnly, validate(byId), controller.listAttendees);
router.patch(
  '/events/:id/attendees/:userId',
  ...organizerOnly,
  validate({ params: attendeeParamsSchema, body: checkInBodySchema }),
  controller.setCheckIn,
);
router.get(
  '/events/:id/activity',
  requireAuth,
  validate({ ...byId, query: activityQuerySchema }),
  controller.listActivity,
);

export default router;
