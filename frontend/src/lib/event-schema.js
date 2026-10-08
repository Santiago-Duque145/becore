import { z } from 'zod';
import { bogotaInputToIso } from './format.js';

const isValidInput = (v) => !Number.isNaN(new Date(bogotaInputToIso(v)).getTime());

// Mismos límites que events.schemas.js del backend (docs/specs/api.md §3)
export const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(100, 'El título no puede superar 100 caracteres'),
    description: z.string().trim().max(2000, 'La descripción no puede superar 2000 caracteres'),
    category: z.enum(['sport', 'culture', 'recreation', 'other'], { error: 'Elige una categoría' }),
    location: z.string().trim().min(3, 'El lugar debe tener al menos 3 caracteres').max(200, 'El lugar no puede superar 200 caracteres'),
    startsAt: z
      .string()
      .min(1, 'Elige la fecha y hora de inicio')
      .refine(isValidInput, 'Fecha y hora inválidas')
      .refine((v) => new Date(bogotaInputToIso(v)).getTime() > Date.now(), 'La fecha debe estar en el futuro'),
    endsAt: z.string().refine((v) => v === '' || isValidInput(v), 'Fecha y hora inválidas'),
    capacity: z.coerce
      .number({ error: 'El cupo debe ser un número' })
      .int('El cupo debe ser un número entero')
      .min(1, 'El cupo debe ser al menos 1')
      .max(1000, 'El cupo no puede superar 1000'),
  })
  .refine((d) => !d.endsAt || !d.startsAt || new Date(bogotaInputToIso(d.endsAt)) > new Date(bogotaInputToIso(d.startsAt)), {
    message: 'La hora de fin debe ser posterior al inicio',
    path: ['endsAt'],
  });

// Valores del formulario → body de la API
export function formValuesToPayload(values) {
  const payload = {
    title: values.title,
    description: values.description,
    category: values.category,
    location: values.location,
    startsAt: bogotaInputToIso(values.startsAt),
    capacity: values.capacity,
  };
  if (values.endsAt) payload.endsAt = bogotaInputToIso(values.endsAt);
  return payload;
}
