import { useAuth } from '../../contexts/AuthContext.jsx';
import { UsersIcon } from '../icons/index.js';
import { EmptyState, LinkButton } from '../ui/index.js';

export function RoleRoute({ role, children }) {
  const { profile } = useAuth();
  if (profile?.role !== role) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Esta sección es solo para organizadores"
        description="No tienes permiso para ver esta página."
        action={
          <LinkButton to="/eventos" variant="secondary" size="sm">
            Volver a eventos
          </LinkButton>
        }
        className="mx-auto max-w-2xl"
      />
    );
  }
  return children;
}
