import { z } from 'zod';
import { eventIdParamsSchema } from './events.schemas.js';

export const attendeeParamsSchema = eventIdParamsSchema.extend({
  userId: z.uuid({ error: 'Identificador de usuario inválido' }),
});

export const checkInBodySchema = z.object({
  checkedIn: z.boolean({ error: 'checkedIn debe ser verdadero o falso' }),
});

export const activityQuerySchema = z.object({
  limit: z.coerce
    .number({ error: 'El límite debe ser un número' })
    .int('El límite debe ser un número entero')
    .min(1, 'El límite mínimo es 1')
    .max(20, 'El límite máximo es 20')
    .default(10),
});
