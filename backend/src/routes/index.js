import { Router } from 'express';
import systemRoutes from './system.routes.js';
import profilesRoutes from './profiles.routes.js';
import eventsRoutes from './events.routes.js';
import attendanceRoutes from './attendance.routes.js';
import appointmentsRoutes from './appointments.routes.js';

const router = Router();

router.use('/', systemRoutes);
router.use('/', profilesRoutes);
router.use('/', eventsRoutes);
router.use('/', attendanceRoutes);
router.use('/', appointmentsRoutes);

export default router;
