import { z } from 'zod';

const isoWithZone = z.iso.datetime({ offset: true, error: 'Fecha y hora inválidas (ISO 8601 con zona)' });
const futureDate = isoWithZone.refine((v) => new Date(v).getTime() > Date.now(), 'La fecha debe estar en el futuro');

const MAX_SLOT_MS = 8 * 3600 * 1000;
const endsAfterStarts = (d) => new Date(d.endsAt) > new Date(d.startsAt);
const endsAfterMessage = { message: 'La hora de fin debe ser posterior al inicio', path: ['endsAt'] };

export const idParamsSchema = z.object({ id: z.uuid({ error: 'Identificador inválido' }) });

export const createAvailabilitySchema = z
  .object({ startsAt: futureDate, endsAt: isoWithZone })
  .refine(endsAfterStarts, endsAfterMessage)
  .refine((d) => new Date(d.endsAt) - new Date(d.startsAt) <= MAX_SLOT_MS, {
    message: 'Un bloque no puede durar más de 8 horas',
    path: ['endsAt'],
  });

export const searchParticipantsQuerySchema = z.object({
  q: z.string().trim().min(2, 'Escribe al menos 2 letras').optional(),
});

export const createAppointmentSchema = z
  .object({
    title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(100, 'El título no puede superar 100 caracteres'),
    notes: z.string().trim().max(1000, 'Las notas no pueden superar 1000 caracteres').default(''),
    location: z.string().trim().max(200, 'El lugar no puede superar 200 caracteres').default(''),
    startsAt: futureDate,
    endsAt: isoWithZone,
    participantIds: z
      .array(z.uuid({ error: 'Identificador de invitado inválido' }), { error: 'Elige al menos un invitado' })
      .min(1, 'Elige al menos un invitado')
      .max(30, 'Máximo 30 invitados'),
  })
  .refine(endsAfterStarts, endsAfterMessage);

export const listAppointmentsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past']).default('upcoming'),
});
