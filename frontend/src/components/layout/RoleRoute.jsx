import { useAuth } from '../../contexts/AuthContext.jsx';
import { LinkButton } from '../ui/Button.jsx';

export function RoleRoute({ role, children }) {
  const { profile } = useAuth();
  if (profile?.role !== role) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="font-display text-6xl font-bold text-teal-500">403</p>
        <p className="font-display text-lg font-semibold text-navy-900">Esta sección es solo para organizadores</p>
        <p className="max-w-sm text-gray-500">No tienes permiso para ver esta página.</p>
        <LinkButton to="/eventos" variant="secondary">
          Volver a eventos
        </LinkButton>
      </div>
    );
  }
  return children;
}
