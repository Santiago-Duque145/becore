import { z } from 'zod';

export const patchMeSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre no puede superar 80 caracteres').trim(),
});
