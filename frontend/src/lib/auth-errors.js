// Errores de Supabase Auth → mensajes en español (auth-onboarding §4 y §5, skill §5).
// Se usa el código del error (auth-js ≥ 2.43); el texto en inglés queda como respaldo.

export const AUTH_MESSAGES = {
  invalidCredentials: 'Correo o contraseña incorrectos.',
  alreadyRegistered: 'Ese correo ya tiene cuenta. ¿Quieres iniciar sesión?',
  emailNotConfirmed: 'Aún no confirmas tu correo. Abre el enlace que te enviamos (revisa también spam).',
  network: 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.',
  tooManyEmails: 'Ya te enviamos varios correos. Espera unos minutos e inténtalo de nuevo.',
  tooManyRequests: 'Hiciste muchos intentos seguidos. Espera un momento e inténtalo de nuevo.',
  weakPassword: 'Esa contraseña es muy fácil de adivinar. Prueba con una más larga.',
  samePassword: 'Esa ya es tu contraseña. Escribe una nueva.',
  invalidEmail: 'Escribe un correo válido.',
  emailNotAuthorized: 'Por ahora no podemos enviar correos a esa dirección. Prueba con otro correo.',
  linkExpired: 'Este enlace ya venció o ya se usó. Pide uno nuevo.',
  googleCancelled: 'Cancelaste el inicio con Google. Puedes intentarlo de nuevo cuando quieras.',
  googleUnavailable: 'El acceso con Google todavía no está disponible. Entra con tu correo por ahora.',
  googleFailed: 'No pudimos entrar con Google. Inténtalo de nuevo.',
  generic: 'No pudimos completar la acción. Inténtalo de nuevo.',
};

const BY_CODE = {
  invalid_credentials: AUTH_MESSAGES.invalidCredentials,
  user_already_exists: AUTH_MESSAGES.alreadyRegistered,
  email_exists: AUTH_MESSAGES.alreadyRegistered,
  email_not_confirmed: AUTH_MESSAGES.emailNotConfirmed,
  over_email_send_rate_limit: AUTH_MESSAGES.tooManyEmails,
  over_request_rate_limit: AUTH_MESSAGES.tooManyRequests,
  weak_password: AUTH_MESSAGES.weakPassword,
  same_password: AUTH_MESSAGES.samePassword,
  email_address_invalid: AUTH_MESSAGES.invalidEmail,
  validation_failed: AUTH_MESSAGES.invalidEmail,
  email_address_not_authorized: AUTH_MESSAGES.emailNotAuthorized,
  otp_expired: AUTH_MESSAGES.linkExpired,
  provider_disabled: AUTH_MESSAGES.googleUnavailable,
  access_denied: AUTH_MESSAGES.googleCancelled,
};

const BY_TEXT = [
  ['Invalid login credentials', AUTH_MESSAGES.invalidCredentials],
  ['User already registered', AUTH_MESSAGES.alreadyRegistered],
  ['Email not confirmed', AUTH_MESSAGES.emailNotConfirmed],
  ['provider is not enabled', AUTH_MESSAGES.googleUnavailable],
  ['Failed to fetch', AUTH_MESSAGES.network],
  ['NetworkError', AUTH_MESSAGES.network],
];

export function isNetworkError(error) {
  return error?.name === 'AuthRetryableFetchError' || error?.status === 0 || error instanceof TypeError;
}

export function translateAuthError(error) {
  if (!error) return AUTH_MESSAGES.generic;
  if (isNetworkError(error)) return AUTH_MESSAGES.network;
  // Los errores que vuelven en la URL (OAuth, enlaces de correo) traen el código en details
  const code = error.code ?? error.details?.code ?? error.details?.error;
  if (code && BY_CODE[code]) return BY_CODE[code];
  const text = error.message ?? '';
  const match = BY_TEXT.find(([needle]) => text.includes(needle));
  return match ? match[1] : AUTH_MESSAGES.generic;
}

// Error con el mensaje ya traducido y el código original, para que la pantalla decida (p. ej. mostrar un enlace)
export class AuthUiError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AuthUiError';
    this.code = code;
  }
}

export function toAuthUiError(error) {
  const code = isNetworkError(error) ? 'network' : (error?.code ?? error?.details?.code ?? error?.details?.error);
  return new AuthUiError(translateAuthError(error), code);
}
