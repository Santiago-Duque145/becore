import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { AUTH_MESSAGES } from '../../lib/auth-errors.js';
import { destinationAfterAuth, forgetFromPath, readRememberedFromPath } from '../../lib/auth-redirect.js';
import { Spinner, useToast } from '../../components/ui/index.js';

const WAIT_MS = 10_000;

// Vuelta de Google y de los enlaces de confirmación de correo (auth-onboarding §4):
// "Entrando…", espera la sesión y aplica la misma regla de redirección que el login.
export default function AuthCallbackPage() {
  const { session, profile, loading, getUrlAuthError } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [from] = useState(readRememberedFromPath);
  const [urlChecked, setUrlChecked] = useState(false);
  const failed = useRef(false);

  useEffect(() => {
    let active = true;
    forgetFromPath();
    function fail(message) {
      if (!active || failed.current) return;
      failed.current = true;
      toast.error(message);
      navigate('/login', { replace: true });
    }

    getUrlAuthError().then((error) => {
      if (error) fail(error.message);
      else if (active) setUrlChecked(true);
    });
    // Si la sesión no aparece (enlace sin datos, bloqueo de almacenamiento…), no se queda girando
    const timer = setTimeout(() => fail(AUTH_MESSAGES.googleFailed), WAIT_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // Se ejecuta una vez al llegar del proveedor
  }, []);

  if (urlChecked && session && !loading) return <Navigate to={destinationAfterAuth(profile, from)} replace />;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg md:bg-hero">
      <Spinner label="Entrando" />
    </main>
  );
}
