import { useAuth } from '../contexts/AuthContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { useOrganizerDashboard } from '../hooks/useOrganizerDashboard.js';
import { PlusIcon } from '../components/icons/index.js';
import { EmptyState, ErrorState, LinkButton, Skeleton } from '../components/ui/index.js';
import { LiveActivityPanel } from '../components/organizer/LiveActivityPanel.jsx';
import {
  OrganizerEventsCards,
  OrganizerEventsTable,
} from '../components/organizer/OrganizerEvents.jsx';
import { statTags } from '../components/organizer/organizer-ui.js';
import { cn } from '../lib/cn.js';

const monthFormatter = new Intl.DateTimeFormat('es-CO', {
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Bogota',
});

const TAG_TONES = {
  accent: 'bg-accent/15 text-accent-soft',
  success: 'bg-success/15 text-success',
  culture: 'bg-culture/15 text-culture',
  action: 'bg-action/15 text-action',
};

function StatCard({ label, value, tag, tone }) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-white/[0.06] bg-panel px-4 py-4 md:px-5 md:py-[18px]">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="font-display text-[22px] font-semibold text-ink tabular-nums md:text-[26px]">
        {value}
      </p>
      <p
        className={cn(
          'w-fit rounded-full px-2 py-[3px] text-[11px] font-semibold',
          TAG_TONES[tone],
        )}
      >
        {tag}
      </p>
    </div>
  );
}

// /panel (desktop-panel-organizador.html, sin mini-mapa ni "van en camino"):
// métricas, tabla de mis eventos y actividad en vivo. Móvil: métricas 2×2, tarjetas y la actividad debajo.
export default function PanelPage() {
  const { profile } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { data, isPending, isError, error, refetch } = useOrganizerDashboard();

  if (profile?.role !== 'organizer') {
    return (
      <EmptyState
        title="Este panel es para organizadores"
        description="Tus eventos están en Mis eventos."
        action={
          <LinkButton to="/mis-eventos" variant="secondary" size="sm">
            Ver mis eventos
          </LinkButton>
        }
      />
    );
  }

  const tags = data && statTags(data);

  return (
    <div className="flex flex-col">
      <header className="mb-6 flex items-start justify-between gap-4 md:mb-7">
        <div>
          <h1 className="font-display text-[21px] font-semibold text-ink md:text-[22px]">
            Panel del organizador
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted first-letter:uppercase">
            {monthFormatter.format(new Date())}
          </p>
        </div>
        {/* En móvil se crea desde el "+" de la cabecera. El hidden va en un contenedor: en el botón
            perdería contra su propio inline-flex (skill §4) */}
        <div className="hidden md:block">
          <LinkButton to="/eventos/nuevo">
            <PlusIcon size={16} /> Crear evento
          </LinkButton>
        </div>
      </header>

      {isError && <ErrorState message={error.message} onRetry={refetch} />}

      {!isError && (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
              {isPending ? (
                Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[118px]" />)
              ) : (
                <>
                  <StatCard
                    label="Eventos activos"
                    value={data.totals.upcomingEvents}
                    tag={tags.active}
                    tone="accent"
                  />
                  <StatCard
                    label="Confirmados"
                    value={data.totals.confirmed}
                    tag={tags.confirmed}
                    tone="success"
                  />
                  <StatCard
                    label="Cupos ocupados"
                    value={`${Math.round(data.totals.occupancyRate * 100)} %`}
                    tag={tags.occupancy}
                    tone="culture"
                  />
                  <StatCard
                    label="Cancelaciones"
                    value={data.totals.cancelled}
                    tag={tags.cancelled}
                    tone="action"
                  />
                </>
              )}
            </div>

            <section
              aria-labelledby="mis-eventos-panel"
              className="overflow-hidden rounded-card border border-white/[0.06] bg-panel"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4 md:px-[22px] md:py-[18px]">
                <h2
                  id="mis-eventos-panel"
                  className="font-display text-[15px] font-semibold text-ink"
                >
                  Mis eventos
                </h2>
                <span className="text-xs text-ink-muted">Últimos 30 días y próximos</span>
              </div>
              {isPending && (
                <div className="flex flex-col gap-3 p-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              )}
              {data?.events.length === 0 && (
                <EmptyState
                  className="m-4"
                  title="Aún no tienes eventos."
                  description="¡Crea el primero y compártelo con tu comunidad!"
                  action={
                    <LinkButton to="/eventos/nuevo" size="sm">
                      Crear evento
                    </LinkButton>
                  }
                />
              )}
              {data?.events.length > 0 &&
                (isDesktop ? (
                  <OrganizerEventsTable events={data.events} />
                ) : (
                  <OrganizerEventsCards events={data.events} />
                ))}
            </section>
          </div>

          <aside className="w-full shrink-0 lg:w-[280px]" aria-label="Actividad">
            <LiveActivityPanel events={data?.events ?? []} />
          </aside>
        </div>
      )}
    </div>
  );
}
