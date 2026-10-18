// Quien marca la casilla de la política en /registro (correo o Google) ya aceptó: la app lo recuerda unos
// minutos para guardar la aceptación en la API al volver con sesión, sin mostrar el diálogo otra vez.
// Si la pestaña cambia (p. ej. enlace de confirmación de correo), se pierde y se muestra el diálogo.
const PENDING_KEY = 'becore.consent.pending';
const DISMISSED_KEY = 'becore.consent.dismissed';
const PENDING_TTL_MS = 10 * 60 * 1000;

function safe(action, fallback) {
  try {
    return action();
  } catch {
    return fallback; // almacenamiento bloqueado (modo privado, etc.)
  }
}

export function markConsentPending() {
  safe(() => sessionStorage.setItem(PENDING_KEY, String(Date.now() + PENDING_TTL_MS)));
}

export function clearConsentPending() {
  safe(() => sessionStorage.removeItem(PENDING_KEY));
}

// true una sola vez si la marca existe y no venció
export function takeConsentPending() {
  return safe(() => {
    const expiresAt = Number(sessionStorage.getItem(PENDING_KEY));
    sessionStorage.removeItem(PENDING_KEY);
    return expiresAt > Date.now();
  }, false);
}

// "Ahora no": el diálogo no vuelve a abrirse en esta sesión del navegador
export const isConsentDismissed = () => safe(() => sessionStorage.getItem(DISMISSED_KEY) === '1', false);
export const dismissConsent = () => safe(() => sessionStorage.setItem(DISMISSED_KEY, '1'));
