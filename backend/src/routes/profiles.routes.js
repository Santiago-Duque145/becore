import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { validate } from '../middleware/validate.js';
import {
  avatarPathSchema,
  avatarPresetSchema,
  consentSchema,
  onboardingSchema,
  patchMeSchema,
  preferencesSchema,
  uploadUrlSchema,
} from '../schemas/profiles.schemas.js';
import {
  deleteAvatar,
  getMe,
  patchMe,
  postAvatarUploadUrl,
  putAvatar,
  putAvatarPreset,
  putConsent,
  putOnboarding,
  putPreferences,
} from '../controllers/profiles.controller.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, validate({ body: patchMeSchema }), patchMe);
router.put('/me/onboarding', requireAuth, validate({ body: onboardingSchema }), putOnboarding);
router.put('/me/consent', requireAuth, validate({ body: consentSchema }), putConsent);
router.put('/me/preferences', requireAuth, validate({ body: preferencesSchema }), putPreferences);
router.post('/me/avatar/upload-url', requireAuth, validate({ body: uploadUrlSchema }), postAvatarUploadUrl);
router.put('/me/avatar', requireAuth, validate({ body: avatarPathSchema }), putAvatar);
router.put('/me/avatar-preset', requireAuth, validate({ body: avatarPresetSchema }), putAvatarPreset);
router.delete('/me/avatar', requireAuth, deleteAvatar);

export default router;
