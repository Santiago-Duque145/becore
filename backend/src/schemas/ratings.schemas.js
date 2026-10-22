import { z } from 'zod';
import { RATING_TAGS } from '../constants/ratings.js';

export const ratingBodySchema = z.object({
  stars: z
    .number({ error: 'Elige de 1 a 5 estrellas' })
    .int('Elige de 1 a 5 estrellas')
    .min(1, 'Elige de 1 a 5 estrellas')
    .max(5, 'Elige de 1 a 5 estrellas'),
  tags: z
    .array(z.enum(RATING_TAGS, { error: 'Etiqueta inválida' }))
    .max(RATING_TAGS.length)
    .default([])
    .transform((tags) => [...new Set(tags)]),
  comment: z
    .string()
    .trim()
    .max(500, 'El comentario admite hasta 500 caracteres')
    .nullish()
    .transform((value) => value || null),
});
