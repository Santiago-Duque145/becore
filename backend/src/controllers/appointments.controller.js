import * as availabilityService from '../services/availability.service.js';
import * as appointmentsService from '../services/appointments.service.js';
import * as usersService from '../services/users.service.js';

export async function listMyAvailability(req, res) {
  res.json({ data: await availabilityService.listMine(req.user) });
}

export async function createAvailability(req, res) {
  res.status(201).json({ data: await availabilityService.createSlot(req.user, req.body) });
}

export async function deleteAvailability(req, res) {
  await availabilityService.deleteSlot(req.user, req.params.id);
  res.status(204).end();
}

export async function searchParticipants(req, res) {
  res.json({ data: await usersService.findParticipants(req.validatedQuery.q) });
}

export async function createAppointment(req, res) {
  res.status(201).json({ data: await appointmentsService.createAppointment(req.user, req.body) });
}

export async function listAppointments(req, res) {
  res.json({ data: await appointmentsService.listAppointments(req.user, req.validatedQuery.scope) });
}

export async function cancelAppointment(req, res) {
  res.json({ data: await appointmentsService.cancelAppointment(req.user, req.params.id) });
}
