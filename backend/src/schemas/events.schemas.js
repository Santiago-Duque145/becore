import { z } from 'zod';

const CATEGORIES = ['sport', 'culture', 'recreation', 'other'];
const isoWithZone = z.iso.datetime({ offset: true, error: 'Fecha y hora inválidas (ISO 8601 con zona)' });
const futureDate = isoWithZone.refine((v) => new Date(v).getTime() > Date.now(), 'La fecha debe estar en el futuro');

const fields = {
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(100, 'El título no puede superar 100 caracteres'),
  description: z.string().trim().max(2000, 'La descripción no puede superar 2000 caracteres'),
  category: z.enum(CATEGORIES, { error: 'Elige una categoría válida' }),
  location: z.string().trim().min(3, 'El lugar debe tener al menos 3 caracteres').max(200, 'El lugar no puede superar 200 caracteres'),
  startsAt: futureDate,
  endsAt: isoWithZone,
  capacity: z
    .number({ error: 'El cupo debe ser un número' })
    .int('El cupo debe ser un número entero')
    .min(1, 'El cupo debe ser al menos 1')
    .max(1000, 'El cupo no puede superar 1000'),
};

const endsAfterStarts = (d) => !d.startsAt || !d.endsAt || new Date(d.endsAt) > new Date(d.startsAt);
const endsAfterMessage = { message: 'La hora de fin debe ser posterior al inicio', path: ['endsAt'] };

export const createEventSchema = z
  .object({
    title: fields.title,
    description: fields.description.default(''),
    category: fields.category,
    location: fields.location,
    startsAt: fields.startsAt,
    endsAt: fields.endsAt.optional(),
    capacity: fields.capacity,
    status: z.enum(['draft', 'published'], { error: 'Estado inválido' }).optional(),
  })
  .refine(endsAfterStarts, endsAfterMessage);

export const updateEventSchema = z
  .object({
    title: fields.title,
    description: fields.description,
    category: fields.category,
    location: fields.location,
    startsAt: fields.startsAt,
    endsAt: fields.endsAt,
    capacity: fields.capacity,
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Envía al menos un campo para actualizar')
  .refine(endsAfterStarts, endsAfterMessage);

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD');

export const listEventsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past']).default('upcoming'),
  category: z.enum(CATEGORIES).optional(),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  organizer: z.literal('me').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const eventIdParamsSchema = z.object({
  id: z.uuid({ error: 'Identificador de evento inválido' }),
});
