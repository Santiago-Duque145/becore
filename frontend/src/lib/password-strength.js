// Indicador simple de fuerza de contraseña (auth-onboarding §5): débil / buena / fuerte.
// Orientativo: la regla real es solo el mínimo de 8 caracteres.

export const PASSWORD_MIN = 8;

export function passwordStrength(password = '') {
  if (!password) return null;
  if (password.length < PASSWORD_MIN) return 'weak';
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length >= 12 && kinds >= 3) return 'strong';
  if (kinds >= 2) return 'good';
  return 'weak';
}
