import { z } from 'zod';
import { bogotaInputToIso } from './format.js';

const MAX_SLOT_MS = 8 * 3600 * 1000;
const isValidInput = (v) => !Number.isNaN(new Date(bogotaInputToIso(v)).getTime());
const toMs = (v) => new Date(bogotaInputToIso(v)).getTime();

const startField = z
  .string()
  .min(1, 'Elige la fecha y hora de inicio')
  .refine(isValidInput, 'Fecha y hora inválidas')
  .refine((v) => toMs(v) > Date.now(), 'La fecha debe estar en el futuro');
const endField = z.string().min(1, 'Elige la fecha y hora de fin').refine(isValidInput, 'Fecha y hora inválidas');
const endsAfter = (d) => !d.startsAt || !d.endsAt || toMs(d.endsAt) > toMs(d.startsAt);
const endsAfterMessage = { message: 'La hora de fin debe ser posterior al inicio', path: ['endsAt'] };

// Mismos límites que appointments.schemas.js del backend (docs/specs/api.md)
export const availabilityFormSchema = z
  .object({ startsAt: startField, endsAt: endField })
  .refine(endsAfter, endsAfterMessage)
  .refine((d) => !d.startsAt || !d.endsAt || toMs(d.endsAt) - toMs(d.startsAt) <= MAX_SLOT_MS, {
    message: 'Un bloque no puede durar más de 8 horas',
    path: ['endsAt'],
  });

export const appointmentFormSchema = z
  .object({
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
