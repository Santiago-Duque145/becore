import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { AUTH_MESSAGES } from '../../lib/auth-errors.js';
import { destinationAfterAuth, forgetFromPath, readRememberedFromPath } from '../../lib/auth-redirect.js';
import { useLoaderVisibility } from '../../hooks/useLoaderTiming.js';
import { ErrorState, FullScreenLoader, useToast } from '../../components/ui/index.js';

const WAIT_MS = 10_000;

// Vuelta de Google y de los enlaces de confirmación de correo (auth-onboarding §4):
// "Entrando…", espera la sesión y aplica la misma regla de redirección que el login.
export default function AuthCallbackPage() {
  const { session, profile, loading, getUrlAuthError, reloadProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [from] = useState(readRememberedFromPath);
  const [urlChecked, setUrlChecked] = useState(false);
  const failed = useRef(false);
  const hasSession = useRef(false); // con sesión abierta, un perfil que no carga no es un fallo de Google
  hasSession.current = Boolean(session);

  useEffect(() => {
    let active = true;
    forgetFromPath();
    function fail(message) {
      if (!active || failed.current || (hasSession.current && message === AUTH_MESSAGES.googleFailed)) return;
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

  // BrandLoader (P7) a los 300 ms y mínimo 500 ms: no se redirige mientras se está viendo
  const settled = urlChecked && session && !loading;
  const loaderVisible = useLoaderVisibility(!settled);

  if (settled && !loaderVisible && profile) {
    return <Navigate to={destinationAfterAuth(profile, from)} replace />;
  }

  // La sesión de Google es válida pero GET /me falló (servidor o base de datos): se dice y se deja reintentar
  if (settled && !loaderVisible) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-4 md:bg-hero">
        <ErrorState
          title="No pudimos cargar tu perfil"
          message="Tu cuenta de Google entró bien, pero el servidor no respondió. Inténtalo de nuevo."
          onRetry={reloadProfile}
          className="w-full max-w-md"
        />
      </main>
    );
  }

  // Sin aviso de "tardando": a los 10 s esta pantalla ya vuelve sola al login con el error
  return (
    <main>
      {loaderVisible ? <FullScreenLoader immediate slowAfter={null} /> : <div className="min-h-dvh bg-bg" aria-busy="true" />}
    </main>
  );
}
