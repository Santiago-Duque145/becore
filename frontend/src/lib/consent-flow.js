// Dónde se pide aceptar la política de datos. El consentimiento es obligatorio para todos: no hay "Ahora no".
//   'none'   → ya aceptó (o aún no hay perfil).
//   'auto'   → acaba de marcar la casilla en /registro (correo): la app guarda la aceptación sola, no se vuelve a pedir.
//   'step'   → onboarding pendiente (p. ej. entró por Google): es el primer paso de /bienvenida.
//   'dialog' → cuenta vieja (onboarding completo): diálogo modal; su única salida es aceptar o "Salir".
// Quien tiene el onboarding pendiente nunca ve el diálogo.
export function consentMode(profile, hasPendingMark = false) {
  if (!profile || profile.dataConsentAccepted !== false) return 'none';
  if (profile.onboardingCompleted) return 'dialog';
  return hasPendingMark ? 'auto' : 'step';
}
