import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLoaderVisibility } from '../../hooks/useLoaderTiming.js';
import { FullScreenLoader } from '../ui/index.js';

// Sin sesión → /login, guardando la ruta de origen para volver después de entrar.
// Mientras se valida la sesión (arranque de la app): fondo vacío los primeros 300 ms y luego el BrandLoader (P7).
export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const loaderVisible = useLoaderVisibility(loading);
  if (loaderVisible) return <FullScreenLoader immediate />;
  if (loading) return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
