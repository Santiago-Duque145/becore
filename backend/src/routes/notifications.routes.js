import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { validate } from '../middleware/validate.js';
import { inboxQuerySchema, notificationIdParamsSchema } from '../schemas/notifications.schemas.js';
import * as controller from '../controllers/notifications.controller.js';

const router = Router();

// Avisos de la app (campana). Rutas fijas antes de /:id
router.get('/notifications', requireAuth, validate({ query: inboxQuerySchema }), controller.listNotifications);
router.get('/notifications/unread-count', requireAuth, controller.unreadCount);
router.post('/notifications/read-all', requireAuth, controller.markAllRead);
router.post('/notifications/:id/read', requireAuth, validate({ params: notificationIdParamsSchema }), controller.markRead);

export default router;
