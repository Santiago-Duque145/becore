import { SearchIcon } from '../components/icons/index.js';
import { EmptyState, LinkButton } from '../components/ui/index.js';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <EmptyState
        icon={SearchIcon}
        title="No encontramos esta página."
        description="Puede que el enlace esté mal escrito o que la página ya no exista."
        action={
          <LinkButton to="/descubre" variant="secondary" size="sm">
            Volver a eventos
          </LinkButton>
        }
        className="w-full max-w-md"
      />
    </main>
  );
}
