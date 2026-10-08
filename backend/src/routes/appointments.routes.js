import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import {
  createAppointmentSchema,
  createAvailabilitySchema,
  idParamsSchema,
  listAppointmentsQuerySchema,
  searchParticipantsQuerySchema,
} from '../schemas/appointments.schemas.js';
import * as controller from '../controllers/appointments.controller.js';

const router = Router();
const organizerOnly = [requireAuth, requireRole('organizer')];
const byId = { params: idParamsSchema };

router.get('/availability/mine', ...organizerOnly, controller.listMyAvailability);
router.post('/availability', ...organizerOnly, validate({ body: createAvailabilitySchema }), controller.createAvailability);
router.delete('/availability/:id', ...organizerOnly, validate(byId), controller.deleteAvailability);

router.get(
  '/users/participants',
  ...organizerOnly,
  validate({ query: searchParticipantsQuerySchema }),
  controller.searchParticipants,
);

router.post('/appointments', ...organizerOnly, validate({ body: createAppointmentSchema }), controller.createAppointment);
router.get('/appointments', requireAuth, validate({ query: listAppointmentsQuerySchema }), controller.listAppointments);
router.post('/appointments/:id/cancel', ...organizerOnly, validate(byId), controller.cancelAppointment);

export default router;
