import { z } from 'zod';

// IA8 · Frase con la que el organizador describe el evento
export const draftBodySchema = z.object({
  text: z
    .string({ error: 'Describe tu evento en una frase' })
    .trim()
    .min(10, 'Cuéntanos un poco más (mínimo 10 caracteres)')
    .max(500, 'La frase no puede superar 500 caracteres'),
});
