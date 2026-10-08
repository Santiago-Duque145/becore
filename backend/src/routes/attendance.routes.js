import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import { eventIdParamsSchema } from '../schemas/events.schemas.js';
import * as controller from '../controllers/attendance.controller.js';

const router = Router();
const participantOnly = [requireAuth, requireRole('participant')];
const byId = { params: eventIdParamsSchema };

router.post('/events/:id/attendance', ...participantOnly, validate(byId), controller.confirmAttendance);
router.delete('/events/:id/attendance', ...participantOnly, validate(byId), controller.cancelAttendance);

export default router;
