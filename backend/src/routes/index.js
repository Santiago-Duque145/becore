import { Router } from 'express';
import systemRoutes from './system.routes.js';
import profilesRoutes from './profiles.routes.js';

const router = Router();

router.use('/', systemRoutes);
router.use('/', profilesRoutes);

export default router;
