import { useAuth } from '../../contexts/AuthContext.jsx';

export function RoleRoute({ role, children }) {
  const { profile } = useAuth();
  if (profile?.role !== role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <p className="text-gray-200 text-lg font-display font-semibold">Acceso restringido</p>
        <p className="text-gray-500">No tienes permiso para ver esta página.</p>
      </div>
    );
  }
  return children;
}
