import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { participantDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/dashboard/participant', requireAuth, participantDashboard);

export default router;
