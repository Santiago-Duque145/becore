import { Router } from 'express';
import systemRoutes from './system.routes.js';
import profilesRoutes from './profiles.routes.js';
import eventsRoutes from './events.routes.js';

const router = Router();

router.use('/', systemRoutes);
router.use('/', profilesRoutes);
router.use('/', eventsRoutes);

export default router;
