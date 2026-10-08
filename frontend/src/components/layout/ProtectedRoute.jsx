import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Spinner } from '../ui/Feedback.jsx';

export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-dvh bg-navy-900 pt-20 text-gray-200">
        <Spinner />
      </div>
    );
  }
  if (!session) return <Navigate to="/ingresar" replace />;
  return children;
}
