import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Escribe un correo válido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre no puede superar 80 caracteres'),
    email: z.email('Escribe un correo válido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
    role: z.enum(['organizer', 'participant'], { error: 'Elige si eres organizador o participante' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre no puede superar 80 caracteres'),
});
