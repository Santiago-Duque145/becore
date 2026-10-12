import { z } from 'zod';
import { bogotaInputToIso, isoToBogotaInput } from './format.js';

// Zod 4 sigue corriendo los refine aunque falle min(1): nunca convertir un valor vacío o a medio escribir
function inputTime(v) {
  if (!v) return NaN;
  try {
    return new Date(bogotaInputToIso(v)).getTime();
  } catch {
    return NaN;
  }
}
const isValidInput = (v) => !Number.isNaN(inputTime(v));

export const DESCRIPTION_MAX = 2000;
export const CAPACITY_MIN = 1;
export const CAPACITY_MAX = 1000;

// Duración opcional: el formulario la convierte en endsAt (la API no cambia)
export const DURATION_OPTIONS = [
  { value: '30', label: '30 minutos' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1 hora y media' },
  { value: '120', label: '2 horas' },
  { value: '180', label: '3 horas' },
  { value: '240', label: '4 horas' },
  { value: '360', label: '6 horas' },
  { value: '480', label: '8 horas' },
];

export function durationLabel(minutes) {
  const known = DURATION_OPTIONS.find((o) => Number(o.value) === minutes);
  if (known) return known.label;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h && `${h} h`, m && `${m} min`].filter(Boolean).join(' ');
}

// Mismos límites que events.schemas.js del backend (docs/specs/api.md §3)
export const eventFormSchema = z.object({
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(100, 'El título no puede superar 100 caracteres'),
  description: z.string().trim().max(DESCRIPTION_MAX, `La descripción no puede superar ${DESCRIPTION_MAX} caracteres`),
  category: z.enum(['sport', 'culture', 'recreation', 'other'], { error: 'Elige una categoría' }),
  location: z.string().trim().min(3, 'El lugar debe tener al menos 3 caracteres').max(200, 'El lugar no puede superar 200 caracteres'),
  startsAt: z
    .string()
    .min(1, 'Elige la fecha y la hora')
    .refine(isValidInput, 'Fecha y hora inválidas')
    .refine((v) => !isValidInput(v) || inputTime(v) > Date.now(), 'La fecha debe estar en el futuro'),
  durationMinutes: z.string().refine((v) => v === '' || Number(v) > 0, 'Elige una duración válida'),
  capacity: z.coerce
    .number({ error: 'El cupo debe ser un número' })
    .int('El cupo debe ser un número entero')
    .min(CAPACITY_MIN, 'El cupo debe ser al menos 1')
    .max(CAPACITY_MAX, 'El cupo no puede superar 1000'),
});

// Valores del formulario → body de la API
export function formValuesToPayload(values) {
  const startsAt = bogotaInputToIso(values.startsAt);
  const payload = {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    location: values.location.trim(),
    startsAt,
    capacity: Number(values.capacity),
  };
  if (values.durationMinutes) {
    payload.endsAt = new Date(new Date(startsAt).getTime() + Number(values.durationMinutes) * 60_000).toISOString();
  }
  return payload;
}

// Evento de la API → valores del formulario (editar)
export function eventToFormValues(event) {
  const minutes = event.endsAt ? Math.round((new Date(event.endsAt) - new Date(event.startsAt)) / 60_000) : null;
  return {
    title: event.title,
    description: event.description ?? '',
    category: event.category,
    location: event.location,
    startsAt: isoToBogotaInput(event.startsAt),
    durationMinutes: minutes ? String(minutes) : '',
    capacity: event.capacity,
  };
}
