import { z } from 'zod';
import { DAYS, INTEREST_SLUGS, MAX_MOTIVATIONS, MAX_ZONE_LENGTH, MOTIVATIONS, TIME_SLOTS } from '../constants/preferences.js';

export const patchMeSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre no puede superar 80 caracteres').trim(),
});

// Lista cerrada sin repetidos; vacía por defecto porque cualquier paso se puede omitir
const closedList = (values, message) =>
  z
    .array(z.enum(values, { error: message }))
    .default([])
    .transform((items) => [...new Set(items)]);

// Cuerpo de PUT /me/preferences (auth-onboarding.md §7). `role` no se acepta aquí: se descarta.
export const preferencesSchema = z.object({
  interests: closedList(INTEREST_SLUGS, 'Ese gusto no está en la lista'),
  days: closedList(DAYS, 'Ese día no está en la lista'),
  timeSlots: closedList(TIME_SLOTS, 'Esa franja no está en la lista'),
  motivations: closedList(MOTIVATIONS, 'Esa opción no está en la lista').refine((items) => items.length <= MAX_MOTIVATIONS, {
    message: `Elige máximo ${MAX_MOTIVATIONS} opciones`,
  }),
  zone: z
    .string()
    .trim()
    .max(MAX_ZONE_LENGTH, `La zona no puede superar ${MAX_ZONE_LENGTH} caracteres`)
    .nullish()
    .transform((zone) => zone || null),
});

// Cuerpo de PUT /me/onboarding: lo mismo más el rol elegido en el paso 1
export const onboardingSchema = preferencesSchema.extend({
  role: z.enum(['organizer', 'participant'], { error: 'Elige si quieres organizar o participar' }),
});
