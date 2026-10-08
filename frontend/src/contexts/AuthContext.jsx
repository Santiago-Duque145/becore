import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';

function translateAuthError(error) {
  const msg = error?.message ?? '';
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos';
  if (msg.includes('User already registered')) return 'Ese correo ya tiene una cuenta. Inicia sesión';
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 8 caracteres';
  if (msg.includes('Unable to validate email address')) return 'Escribe un correo válido';
  if (msg.includes('INVALID_ROLE') || msg.includes('Database error saving new user'))
    return 'Elige si eres organizador o participante';
  return 'No pudimos completar la acción, intenta de nuevo';
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/me');
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // INITIAL_SESSION llega al suscribirse, así que no hace falta getSession().
    // El perfil se pide fuera del callback para no bloquear el cliente de Auth.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setTimeout(() => loadProfile().finally(() => setLoading(false)), 0);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  async function signUp({ fullName, email, password, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) throw new Error(translateAuthError(error));
    if (!data.session) throw new Error('No pudimos completar la acción, intenta de nuevo');
    await loadProfile();
  }

  async function signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error));
    await loadProfile();
  }

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, profile, setProfile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
