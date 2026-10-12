import { EmptyState, LinkButton } from '../components/ui/index.js';

// Marcador para las pestañas nuevas cuya pantalla todavía no existe (Mis eventos y Avisos llegan en R7)
export default function ProximamentePage({ title }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-ink md:text-[22px]">{title}</h1>
      <EmptyState
        title="Muy pronto verás esto aquí"
        description="Estamos terminando esta sección. Mientras tanto, mira lo que se viene."
        action={
          <LinkButton to="/eventos" variant="secondary" size="sm">
            Ver eventos
          </LinkButton>
        }
      />
    </div>
  );
}
