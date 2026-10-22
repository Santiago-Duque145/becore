import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import { feedbackBodySchema } from '../schemas/recommendations.schemas.js';
import { aiMetrics, feedback } from '../controllers/recommendations.controller.js';

const router = Router();

// IA4 · prueba A/B de "Para ti" (docs/specs/ai.md §9)
router.post('/recommendations/feedback', requireAuth, validate({ body: feedbackBodySchema }), feedback);
router.get('/admin/ai-metrics', requireAuth, requireRole('organizer'), aiMetrics);

export default router;
