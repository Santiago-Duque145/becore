import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Spinner } from '../ui/index.js';

// Sin sesión → /login, guardando la ruta de origen para volver después de entrar
export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-dvh pt-20">
        <Spinner />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
