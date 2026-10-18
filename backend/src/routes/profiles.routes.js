import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { validate } from '../middleware/validate.js';
import { consentSchema, onboardingSchema, patchMeSchema, preferencesSchema } from '../schemas/profiles.schemas.js';
import { getMe, patchMe, putConsent, putOnboarding, putPreferences } from '../controllers/profiles.controller.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, validate({ body: patchMeSchema }), patchMe);
router.put('/me/onboarding', requireAuth, validate({ body: onboardingSchema }), putOnboarding);
router.put('/me/consent', requireAuth, validate({ body: consentSchema }), putConsent);
router.put('/me/preferences', requireAuth, validate({ body: preferencesSchema }), putPreferences);

export default router;
