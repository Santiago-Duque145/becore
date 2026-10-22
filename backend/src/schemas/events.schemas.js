import { z } from 'zod';
import { IMAGE_TYPES } from '../constants/avatars.js';

const CATEGORIES = ['sport', 'culture', 'recreation', 'other'];
const isoWithZone = z.iso.datetime({ offset: true, error: 'Fecha y hora inválidas (ISO 8601 con zona)' });
const futureDate = isoWithZone.refine((v) => new Date(v).getTime() > Date.now(), 'La fecha debe estar en el futuro');

// Ruta del archivo que el organizador ya subió a Storage con la URL firmada (null = quitar la portada)
const coverPath = z.string().trim().min(3).max(200).nullable();

// Ubicación en el mapa (P6), opcional: las dos coordenadas juntas o ninguna (null en PATCH las quita)
const latitude = z.number({ error: 'La latitud debe ser un número' }).min(-90, 'Latitud fuera de rango').max(90, 'Latitud fuera de rango');
const longitude = z.number({ error: 'La longitud debe ser un número' }).min(-180, 'Longitud fuera de rango').max(180, 'Longitud fuera de rango');

export function coordinatesTogether(d) {
  const hasLat = d.latitude !== undefined;
  const hasLng = d.longitude !== undefined;
  if (hasLat !== hasLng) return false;
  return !hasLat || (d.latitude === null) === (d.longitude === null);
}
const coordinatesMessage = { message: 'Envía la latitud y la longitud juntas', path: ['latitude'] };

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
    coverPath: coverPath.optional(),
    latitude: latitude.nullable().optional(),
    longitude: longitude.nullable().optional(),
    status: z.enum(['draft', 'published'], { error: 'Estado inválido' }).optional(),
  })
  .refine(endsAfterStarts, endsAfterMessage)
  .refine(coordinatesTogether, coordinatesMessage);

export const updateEventSchema = z
  .object({
    title: fields.title,
    description: fields.description,
    category: fields.category,
    location: fields.location,
    startsAt: fields.startsAt,
    endsAt: fields.endsAt,
    capacity: fields.capacity,
    coverPath,
    latitude: latitude.nullable(),
    longitude: longitude.nullable(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Envía al menos un campo para actualizar')
  .refine(endsAfterStarts, endsAfterMessage)
  .refine(coordinatesTogether, coordinatesMessage);

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

export const recommendedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

// IA7 · búsqueda en lenguaje natural
export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Escribe al menos 2 letras').max(200, 'La búsqueda no puede superar 200 caracteres'),
  category: z.enum(CATEGORIES).optional(),
});

export const searchOpenParamsSchema = z.object({
  searchId: z.uuid({ error: 'Identificador de búsqueda inválido' }),
});

export const searchOpenSchema = z.object({
  eventId: z.uuid({ error: 'Identificador de evento inválido' }),
});

export const eventIdParamsSchema = z.object({
  id: z.uuid({ error: 'Identificador de evento inválido' }),
});

export const coverUploadSchema = z.object({
  contentType: z.enum(IMAGE_TYPES, { error: 'Sube una imagen WebP, JPEG o PNG' }),
  withOriginal: z.boolean().optional(), // P8: URL extra para el original (volver a encuadrar)
});
