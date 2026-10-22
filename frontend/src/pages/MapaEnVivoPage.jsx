import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useEvents } from '../hooks/useEvents.js';
import { useRealtimeOrganizerEvents } from '../hooks/useRealtimeOrganizerEvents.js';
import { SearchIcon } from '../components/icons/index.js';
import { CapacityBar, Chip, EmptyState, ErrorState, Input, LinkButton, Skeleton } from '../components/ui/index.js';
import { formatDate } from '../lib/format.js';
import { hasCoordinates, isActiveEvent } from '../lib/map.js';
import { CATEGORY_FILTERS, matchesSearch } from './descubre/descubre-filters.js';

// Leaflet pesa: el mapa se descarga solo al entrar en esta página
const EventsMap = lazy(() => import('../components/map/EventsMap.jsx').then((m) => ({ default: m.EventsMap })));

const MAP_HEIGHT = 'h-[55dvh] min-h-[320px] lg:h-[calc(100dvh-13rem)]';

// "Mapa en vivo" del organizador (desktop-panel-organizador.html, sin la "estela convergente"): sus eventos
// activos como pines con el cupo actualizándose en tiempo real, lista lateral filtrable y ficha del elegido.
export default function MapaEnVivoPage() {
  const { profile } = useAuth();
  useRealtimeOrganizerEvents(profile?.id);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useEvents({
    scope: 'upcoming',
    organizer: 'me',
    pageSize: 50,
  });
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Activos: publicados o en curso (los borradores y cancelados no están en el mapa)
  const active = (data?.pages.flatMap((page) => page.data) ?? []).filter(isActiveEvent);
  const events = active.filter((e) => (!category || e.category === category) && matchesSearch(e, search));
  const selected = events.find((e) => e.id === selectedId);
  const unlocated = events.filter((e) => !hasCoordinates(e)).length;

  return (
    <div className="flex flex-col">
      <header className="mb-5 md:mb-6">
        <h1 className="font-display text-[21px] font-semibold text-ink md:text-[22px]">Mapa en vivo</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" aria-hidden="true" />
          Tus eventos activos, con el cupo al instante
        </p>
      </header>

      {isError && <ErrorState message={error.message} onRetry={refetch} />}

      {!isError && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[320px]" aria-label="Tus eventos activos">
            <label htmlFor="live-search" className="sr-only">
              Buscar entre tus eventos
            </label>
            <Input id="live-search" type="search" icon={SearchIcon} placeholder="Buscar entre tus eventos" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map(({ value, label }) => (
                <Chip key={value || 'all'} selected={category === value} onClick={() => setCategory(value)}>
                  {label}
                </Chip>
              ))}
            </div>

            {selected && (
              <section aria-label="Evento seleccionado" className="rounded-card border border-accent/30 bg-panel p-4">
                <h2 className="text-sm font-semibold text-ink">{selected.title}</h2>
                <p className="mt-0.5 mb-3 text-xs text-ink-muted first-letter:uppercase">{formatDate(selected.startsAt)}</p>
                <CapacityBar confirmedCount={selected.confirmedCount} capacity={selected.capacity} label="Cupo en vivo" live />
                <div className="mt-3 flex flex-wrap gap-2">
                  <LinkButton to={`/eventos/${selected.id}`} size="sm" variant="secondary">
                    Ver evento
                  </LinkButton>
                  <LinkButton to={`/eventos/${selected.id}/asistentes`} size="sm">
                    Asistentes
                  </LinkButton>
                </div>
              </section>
            )}

            {isPending ? (
              <div className="flex flex-col gap-2" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <EmptyState
                title={active.length === 0 ? 'No tienes eventos activos.' : 'Ningún evento coincide.'}
                description={active.length === 0 ? 'Publica un evento y aparecerá aquí.' : 'Prueba con otra categoría o palabra.'}
                action={
                  active.length === 0 && (
                    <LinkButton to="/eventos/nuevo" size="sm">
                      Crear evento
                    </LinkButton>
                  )
                }
              />
            ) : (
              <ul className="max-h-[40dvh] divide-y divide-line overflow-y-auto rounded-card border border-line bg-panel lg:max-h-[calc(100dvh-26rem)]">
                {events.map((event) => (
                  <li key={event.id} className={event.id === selectedId ? 'bg-field' : undefined}>
                    <button
                      type="button"
                      aria-pressed={event.id === selectedId}
                      onClick={() => setSelectedId(event.id === selectedId ? null : event.id)}
                      className="focus-ring flex min-h-14 w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left"
                    >
                      <span className="text-[13.5px] font-semibold text-ink">{event.title}</span>
                      <span className="text-xs text-ink-muted">
                        {event.confirmedCount} de {event.capacity} confirmados
                        {event.status === 'in_progress' && ' · En curso'}
                        {!hasCoordinates(event) && ' · sin ubicación'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {unlocated > 0 && (
              <p className="text-xs text-ink-muted">
                {unlocated === 1 ? '1 evento no tiene' : `${unlocated} eventos no tienen`} ubicación en el mapa. Márcala al editarlos.
              </p>
            )}
          </aside>

          <div className="min-w-0 flex-1">
            <Suspense fallback={<Skeleton className={MAP_HEIGHT} />}>
              <EventsMap events={events} selectedId={selectedId} onSelect={setSelectedId} className={MAP_HEIGHT} label="Mapa en vivo de tus eventos" />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
