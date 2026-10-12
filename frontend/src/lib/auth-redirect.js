import { homePathFor } from '../layouts/navigation.js';

// A dónde va el usuario después de entrar (auth-onboarding §4):
// onboarding pendiente → /bienvenida; si no, la ruta de la que venía o el inicio de su rol.

const FROM_KEY = 'becore:auth-from';
const AUTH_PATHS = ['/login', '/ingresar', '/registro', '/recuperar', '/nueva-contrasena', '/auth/callback', '/bienvenida'];

// Solo rutas internas de la app: evita redirecciones abiertas (?from=https://…) y volver a una pantalla de auth
export function safeFromPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return null;
  const pathname = path.split(/[?#]/)[0];
  if (AUTH_PATHS.includes(pathname)) return null;
  return path;
}

export function destinationAfterAuth(profile, from) {
  if (profile && profile.onboardingCompleted === false) return '/bienvenida';
  return safeFromPath(from) ?? homePathFor(profile?.role);
}

// Google y los enlaces de correo salen de la app: la ruta de origen se guarda en sessionStorage
// (por pestaña) y /auth/callback la lee y luego la borra. Si el almacenamiento falla, se va al inicio.
export function rememberFromPath(from) {
  try {
    const safe = safeFromPath(from);
    if (safe) sessionStorage.setItem(FROM_KEY, safe);
    else sessionStorage.removeItem(FROM_KEY);
  } catch {
    /* sin almacenamiento: se usa el inicio del rol */
  }
}

// Solo lee (StrictMode puede llamar dos veces al inicializador de useState); se borra con forgetFromPath
export function readRememberedFromPath() {
  try {
    return safeFromPath(sessionStorage.getItem(FROM_KEY));
  } catch {
    return null;
  }
}

export function forgetFromPath() {
  try {
    sessionStorage.removeItem(FROM_KEY);
  } catch {
    /* nada que borrar */
  }
}

// Ruta de origen que deja ProtectedRoute en location.state
export function fromState(location) {
  const from = location.state?.from;
  if (!from) return null;
  return safeFromPath(`${from.pathname ?? ''}${from.search ?? ''}${from.hash ?? ''}`);
}
