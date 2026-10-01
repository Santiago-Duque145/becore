import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';

export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/ingresar" replace />;
  return children;
}
