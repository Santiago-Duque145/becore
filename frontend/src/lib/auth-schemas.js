import { z } from 'zod';
import { PASSWORD_MIN } from './password-strength.js';

const email = z.email('Escribe un correo válido');
const newPassword = z.string().min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Escribe tu contraseña'),
});

// Sin rol: se elige en el paso 1 del onboarding (auth-onboarding §5)
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre no puede superar 80 caracteres'),
  email,
  password: newPassword,
});

export const recoverSchema = z.object({ email });

export const newPasswordSchema = z.object({ password: newPassword });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'El nombre no puede superar 80 caracteres'),
});
