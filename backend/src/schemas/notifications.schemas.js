import { z } from 'zod';

export const inboxQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const notificationIdParamsSchema = z.object({
  id: z.uuid({ error: 'Identificador de aviso inválido' }),
});
