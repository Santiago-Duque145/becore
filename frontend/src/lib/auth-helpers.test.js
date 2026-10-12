import { describe, it, expect } from 'vitest';
import { AUTH_MESSAGES, translateAuthError } from './auth-errors.js';
import { passwordStrength } from './password-strength.js';
import { destinationAfterAuth, safeFromPath } from './auth-redirect.js';

describe('translateAuthError', () => {
  it('traduce por código de Supabase', () => {
    expect(translateAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      AUTH_MESSAGES.invalidCredentials,
    );
    expect(translateAuthError({ code: 'user_already_exists' })).toBe(AUTH_MESSAGES.alreadyRegistered);
    expect(translateAuthError({ code: 'email_not_confirmed' })).toBe(AUTH_MESSAGES.emailNotConfirmed);
  });

  it('reconoce la red caída', () => {
    expect(translateAuthError({ name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' })).toBe(
      AUTH_MESSAGES.network,
    );
    expect(translateAuthError(new TypeError('Failed to fetch'))).toBe(AUTH_MESSAGES.network);
  });

  it('lee el código de los errores que vuelven en la URL (Google cancelado)', () => {
    const error = { name: 'AuthImplicitGrantRedirectError', message: 'The user denied', details: { error: 'access_denied' } };
    expect(translateAuthError(error)).toBe(AUTH_MESSAGES.googleCancelled);
  });

  it('usa el texto en inglés como respaldo y nunca lo muestra', () => {
    expect(translateAuthError({ message: 'Email not confirmed' })).toBe(AUTH_MESSAGES.emailNotConfirmed);
    expect(translateAuthError({ message: 'Something odd happened' })).toBe(AUTH_MESSAGES.generic);
  });
});

describe('passwordStrength', () => {
  it('sin texto no muestra nada', () => {
    expect(passwordStrength('')).toBeNull();
  });

  it('menos de 8 caracteres o un solo tipo es débil', () => {
    expect(passwordStrength('Ab1!')).toBe('weak');
    expect(passwordStrength('abcdefghij')).toBe('weak');
  });

  it('8 o más con dos tipos es buena', () => {
    expect(passwordStrength('partido31')).toBe('good');
  });

  it('12 o más con tres tipos es fuerte', () => {
    expect(passwordStrength('PartidoDel31oct')).toBe('strong');
  });
});

describe('destinationAfterAuth', () => {
  it('onboarding pendiente → /bienvenida aunque venga de otra ruta', () => {
    expect(destinationAfterAuth({ role: 'participant', onboardingCompleted: false }, '/citas')).toBe('/bienvenida');
  });

  it('vuelve a la ruta de origen si es interna', () => {
    expect(destinationAfterAuth({ role: 'participant', onboardingCompleted: true }, '/eventos/abc?x=1')).toBe(
      '/eventos/abc?x=1',
    );
  });

  it('sin origen va al inicio de su rol', () => {
    expect(destinationAfterAuth({ role: 'organizer', onboardingCompleted: true }, null)).toBe('/panel');
    expect(destinationAfterAuth({ role: 'participant', onboardingCompleted: true })).toBe('/descubre');
  });

  it('rechaza orígenes externos y pantallas de auth', () => {
    expect(safeFromPath('https://malo.com')).toBeNull();
    expect(safeFromPath('//malo.com/x')).toBeNull();
    expect(safeFromPath('/login')).toBeNull();
    expect(safeFromPath('/auth/callback#access_token=x')).toBeNull();
  });
});
