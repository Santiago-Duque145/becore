import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Divider, GoogleButton, useToast } from '../ui/index.js';

// Divisor "o continúa con" + "Continuar con Google" (auth-onboarding §2 y §4).
// Reemplaza los botones Organizador / Participante del mockup.
// onStart / onError: /registro recuerda la casilla de la política antes de salir hacia Google (y la olvida si falla)
export function GoogleSignIn({ from, disabled, onStart, onError }) {
  const { signInWithGoogle } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    onStart?.();
    try {
      await signInWithGoogle(from);
      // Si todo va bien, el navegador sale hacia Google: el botón queda cargando
    } catch (error) {
      onError?.();
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <>
      <Divider className="my-[22px]">o continúa con</Divider>
      <GoogleButton loading={loading} disabled={disabled} onClick={handleClick} />
    </>
  );
}
