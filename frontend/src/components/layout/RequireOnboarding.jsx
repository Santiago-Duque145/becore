import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ConsentGate } from '../preferences/ConsentGate.jsx';
import { ErrorState } from '../ui/index.js';

// Rutas donde un onboarding pendiente no redirige (auth-onboarding §7)
const EXEMPT_PATHS = ['/bienvenida', '/auth/callback', '/nueva-contrasena'];

// Va dentro de ProtectedRoute: con sesión pero onboarding pendiente → /bienvenida
export function RequireOnboarding({ children }) {
  const { profile, reloadProfile } = useAuth();
  const { pathname } = useLocation();

  if (!profile) {
    return (
      <div className="min-h-dvh px-4 pt-20">
        <ErrorState
          title="No pudimos cargar tu perfil"
          message="Revisa tu internet e inténtalo de nuevo."
          onRetry={reloadProfile}
          className="mx-auto max-w-md"
        />
      </div>
    );
  }
  if (profile.onboardingCompleted === false && !EXEMPT_PATHS.includes(pathname)) {
    return <Navigate to="/bienvenida" replace />;
  }
  return <ConsentGate>{children}</ConsentGate>;
}
