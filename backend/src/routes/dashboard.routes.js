import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';
import { organizerDashboard, participantDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/dashboard/participant', requireAuth, participantDashboard);
router.get('/dashboard/organizer', requireAuth, requireRole('organizer'), organizerDashboard);

export default router;
