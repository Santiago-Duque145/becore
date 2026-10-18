import { z } from 'zod';
import { bogotaInputToIso } from './format.js';

const MAX_SLOT_MS = 8 * 3600 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

// Zod 4 sigue corriendo los refine aunque falle min(1): un valor vacío no debe lanzar RangeError
function toMs(v) {
  if (!v) return NaN;
  try {
    return new Date(bogotaInputToIso(v)).getTime();
  } catch {
    return NaN;
  }
}
const isValidInput = (v) => !Number.isNaN(toMs(v));

const startField = z
  .string()
  .min(1, 'Elige la fecha y hora de inicio')
  .refine(isValidInput, 'Fecha y hora inválidas')
  .refine((v) => !isValidInput(v) || toMs(v) > Date.now(), 'La fecha debe estar en el futuro');
const endField = z.string().min(1, 'Elige la fecha y hora de fin').refine(isValidInput, 'Fecha y hora inválidas');
const endsAfter = (d) => !isValidInput(d.startsAt) || !isValidInput(d.endsAt) || toMs(d.endsAt) > toMs(d.startsAt);
const endsAfterMessage = { message: 'La hora de fin debe ser posterior al inicio', path: ['endsAt'] };

// Disponibilidad: fecha + hora de inicio + hora de fin, el mismo día (hora de Colombia).
// Mismos límites que appointments.schemas.js del backend (docs/specs/api.md): futuro, fin > inicio, máx. 8 h.
const slotStartMs = (d) => (DATE_RE.test(d.date) && TIME_RE.test(d.startTime) ? toMs(`${d.date}T${d.startTime}`) : NaN);
const slotEndMs = (d) => (DATE_RE.test(d.date) && TIME_RE.test(d.endTime) ? toMs(`${d.date}T${d.endTime}`) : NaN);
const bothValid = (d) => !Number.isNaN(slotStartMs(d)) && !Number.isNaN(slotEndMs(d));

export const availabilityFormSchema = z
  .object({
    date: z.string().regex(DATE_RE, 'Elige la fecha'),
    startTime: z.string().regex(TIME_RE, 'Elige la hora de inicio'),
    endTime: z.string().regex(TIME_RE, 'Elige la hora de fin'),
  })
  .refine((d) => Number.isNaN(slotStartMs(d)) || slotStartMs(d) > Date.now(), {
    message: 'El bloque debe empezar en el futuro',
    path: ['startTime'],
  })
  .refine((d) => !bothValid(d) || slotEndMs(d) > slotStartMs(d), {
    message: 'La hora de fin debe ser posterior al inicio',
    path: ['endTime'],
  })
  .refine((d) => !bothValid(d) || slotEndMs(d) - slotStartMs(d) <= MAX_SLOT_MS, {
    message: 'Un bloque no puede durar más de 8 horas',
    path: ['endTime'],
  });

export const toAvailabilityPayload = (values) => ({
  startsAt: bogotaInputToIso(`${values.date}T${values.startTime}`),
  endsAt: bogotaInputToIso(`${values.date}T${values.endTime}`),
});

export const appointmentFormSchema = z
  .object({
    slotId: z.string().min(1, 'Elige una franja de tu disponibilidad'),
    title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(100, 'El título no puede superar 100 caracteres'),
    notes: z.string().trim().max(1000, 'Las notas no pueden superar 1000 caracteres'),
    location: z.string().trim().max(200, 'El lugar no puede superar 200 caracteres'),
    startsAt: startField,
    endsAt: endField,
  })
  .refine(endsAfter, endsAfterMessage);

export const toSlotPayload = (values) => ({
  startsAt: bogotaInputToIso(values.startsAt),
  endsAt: bogotaInputToIso(values.endsAt),
});
