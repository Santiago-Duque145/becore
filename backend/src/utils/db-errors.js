import { AppError } from './app-error.js';

const RPC_CODES = new Map([
  ['EVENT_FULL', [409, 'El evento ya no tiene cupos']],
  ['ALREADY_CONFIRMED', [409, 'Ya confirmaste tu asistencia a este evento']],
  ['NOT_CONFIRMED', [409, 'No tienes una asistencia confirmada en este evento']],
  ['EVENT_NOT_ACTIVE', [409, 'El evento fue cancelado']],
  ['EVENT_STARTED', [409, 'El evento ya empezó, no se puede modificar']],
  ['CHECKIN_NOT_OPEN', [409, 'El check-in se habilita 2 horas antes del evento']],
  ['APPOINTMENT_NOT_ACTIVE', [409, 'La cita fue cancelada']],
  ['INVALID_EVENT_TRANSITION', [409, 'Ese cambio de estado no está permitido para el evento']],
  ['INVALID_INITIAL_STATUS', [409, 'Un evento nuevo no puede crearse en ese estado']],
]);

export function translateDbError(error) {
  if (!error) return null;

  const rpc = RPC_CODES.get(error.message);
  if (rpc) return new AppError(rpc[0], error.message, rpc[1]);

  if (error.code === '23514') {
    const constraint = error.constraint_name ?? error.message ?? '';
    if (constraint.includes('events_confirmed_within_capacity')) {
      return new AppError(409, 'CAPACITY_BELOW_CONFIRMED', 'El cupo no puede ser menor que los confirmados actuales');
    }
    return new AppError(409, 'CONSTRAINT_VIOLATION', 'Los datos no cumplen las reglas');
  }

  if (error.code === '23505') return new AppError(409, 'DUPLICATE', 'Ese registro ya existe');

  return null;
}
