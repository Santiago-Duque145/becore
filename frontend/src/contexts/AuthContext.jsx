import { createContext, useContext, useEffect, useState } from 'react';
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

  async function fetchProfile() {
    try {
      const { data } = await api.get('/me');
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchProfile().finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) fetchProfile();
      else setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp({ fullName, email, password, role }) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) throw new Error(translateAuthError(error));
  }

  async function signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error));
  }

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
