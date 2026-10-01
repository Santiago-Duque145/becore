import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { validate } from '../middleware/validate.js';
import { patchMeSchema } from '../schemas/profiles.schemas.js';
import { getMe, patchMe } from '../controllers/profiles.controller.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, validate({ body: patchMeSchema }), patchMe);

export default router;
