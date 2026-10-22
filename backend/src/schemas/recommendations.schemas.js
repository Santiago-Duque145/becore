import { z } from 'zod';

// POST /recommendations/feedback (IA4). Por ahora solo el clic: "mostrado" y "confirmado" los registra el backend.
export const feedbackBodySchema = z.object({
  eventId: z.uuid({ error: 'Evento inválido' }),
  action: z.enum(['clicked'], { error: 'Acción inválida' }),
});
