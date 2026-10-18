import { Router } from 'express';
import systemRoutes from './system.routes.js';
import publicRoutes from './public.routes.js';
import profilesRoutes from './profiles.routes.js';
import eventsRoutes from './events.routes.js';
import attendanceRoutes from './attendance.routes.js';
import appointmentsRoutes from './appointments.routes.js';
import notificationsRoutes from './notifications.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import ratingsRoutes from './ratings.routes.js';
import geocodeRoutes from './geocode.routes.js';

const router = Router();

router.use('/', systemRoutes);
router.use('/', publicRoutes);
router.use('/', profilesRoutes);
router.use('/', eventsRoutes);
router.use('/', attendanceRoutes);
router.use('/', appointmentsRoutes);
router.use('/', notificationsRoutes);
router.use('/', dashboardRoutes);
router.use('/', ratingsRoutes);
router.use('/', geocodeRoutes);

export default router;
