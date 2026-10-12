import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';
import { AUTH_MESSAGES, AuthUiError, toAuthUiError } from '../lib/auth-errors.js';
import { rememberFromPath } from '../lib/auth-redirect.js';

const AuthContext = createContext(null);

// Los enlaces de Google y de los correos vuelven a la misma IP o dominio desde donde se abrió la app
// (localhost o la IP de la Wi-Fi), por eso se arman con window.location.origin (auth-onboarding §4).
const redirectUrl = (path) => `${window.location.origin}${path}`;

// GET /auth/v1/settings es público: dice si Google está activo antes de sacar al usuario de la app
async function isGoogleEnabled() {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    });
    if (!res.ok) return true; // si no se puede saber, se intenta y el callback maneja el error
    const settings = await res.json();
    return settings.external?.google === true;
  } catch (error) {
    throw toAuthUiError(error);
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(null);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/me');
      setProfile(data);
      return data;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  const reloadProfile = useCallback(async () => {
    setLoading(true);
    try {
      return await loadProfile();
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    // INITIAL_SESSION llega al suscribirse, así que no hace falta getSession().
    // El perfil se pide solo cuando cambia el usuario (no en cada TOKEN_REFRESHED) y fuera del callback
    // para no bloquear el cliente de Auth. Mientras llega, loading=true: así ninguna pantalla decide
    // a dónde ir con el perfil del usuario anterior.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        userIdRef.current = null;
        setProfile(null);
        setLoading(false);
        return;
      }
      if (newSession.user.id === userIdRef.current) return;
      userIdRef.current = newSession.user.id;
      setLoading(true);
      setTimeout(() => loadProfile().finally(() => setLoading(false)), 0);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  async function signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw toAuthUiError(error);
  }

  // Sin rol (auth-onboarding §5). Devuelve needsConfirmation si Supabase pide confirmar el correo.
  async function signUp({ fullName, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: redirectUrl('/auth/callback') },
    });
    if (error) throw toAuthUiError(error);
    // Con confirmación activa, Supabase no revela si el correo ya existía: devuelve un usuario sin identidades
    if (data.user && data.user.identities?.length === 0) {
      throw new AuthUiError(AUTH_MESSAGES.alreadyRegistered, 'user_already_exists');
    }
    return { needsConfirmation: !data.session };
  }

  async function signInWithGoogle(from) {
    if (!(await isGoogleEnabled())) throw new AuthUiError(AUTH_MESSAGES.googleUnavailable, 'provider_disabled');
    rememberFromPath(from);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl('/auth/callback') },
    });
    if (error) throw toAuthUiError(error);
  }

  async function requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl('/nueva-contrasena'),
    });
    if (error) throw toAuthUiError(error);
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw toAuthUiError(error);
  }

  // Error que trajo la URL al volver de Google o de un enlace de correo (cancelado, vencido…), o null.
  // initialize() devuelve el mismo resultado de la primera lectura de la URL.
  async function getUrlAuthError() {
    const { error } = await supabase.auth.initialize();
    return error ? toAuthUiError(error) : null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        setProfile,
        loading,
        reloadProfile,
        signIn,
        signUp,
        signInWithGoogle,
        requestPasswordReset,
        updatePassword,
        getUrlAuthError,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
