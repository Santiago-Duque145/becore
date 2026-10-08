import * as appointmentsRepo from '../repositories/appointments.repository.js';
import { findParticipantIds } from '../repositories/profiles.repository.js';
import { notify } from './notifications.service.js';
import { buildContent } from '../mail/templates.js';
import { AppError } from '../utils/app-error.js';

function toAppointment(appointment) {
  const rest = { ...appointment };
  delete rest.organizerId;
  return rest;
}

async function assertAllParticipants(ids) {
  const valid = new Set(await findParticipantIds(ids));
  if (ids.every((id) => valid.has(id))) return;
  throw new AppError(400, 'VALIDATION_ERROR', 'Revisa los datos enviados', [
    { field: 'participantIds', message: 'Todos los invitados deben ser participantes registrados' },
  ]);
}

// Se inserta la cita y luego los invitados; si lo segundo falla se borra la cita (compensación)
async function insertWithParticipants(user, input, participantIds) {
  const id = await appointmentsRepo.insertAppointment(user.id, input);
  try {
    await appointmentsRepo.insertParticipants(id, participantIds);
  } catch (err) {
    await appointmentsRepo.deleteAppointment(id);
    throw err;
  }
  return id;
}

export async function createAppointment(user, input) {
  const participantIds = [...new Set(input.participantIds)];
  await assertAllParticipants(participantIds);

  const id = await insertWithParticipants(user, input, participantIds);
  const appointment = await appointmentsRepo.findAppointmentById(id);
  await notify({
    userIds: participantIds,
    type: 'appointment_created',
    appointmentId: id,
    buildContent: () => buildContent('appointment_created', appointment),
  });
  return toAppointment(appointment);
}

export async function listAppointments(user, scope) {
  const appointments = await appointmentsRepo.listForUser(user.id, scope);
  return appointments.map(toAppointment);
}

export async function cancelAppointment(user, id) {
  const appointment = await appointmentsRepo.findAppointmentById(id);
  if (!appointment) throw new AppError(404, 'NOT_FOUND', 'No encontramos lo que buscas');
  if (appointment.organizerId !== user.id) throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
  if (appointment.status === 'cancelled') throw new AppError(409, 'APPOINTMENT_NOT_ACTIVE', 'La cita fue cancelada');

  await appointmentsRepo.markCancelled(id);
  const cancelled = { ...appointment, status: 'cancelled' };
  await notify({
    userIds: appointment.participants.map((p) => p.id),
    type: 'appointment_cancelled',
    appointmentId: id,
    buildContent: () => buildContent('appointment_cancelled', cancelled),
  });
  return toAppointment(cancelled);
}
