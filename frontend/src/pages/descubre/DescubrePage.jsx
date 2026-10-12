import { useId } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useEvents } from '../../hooks/useEvents.js';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { SearchIcon } from '../../components/icons/index.js';
import { EventCard, EventCardSkeleton } from '../../components/events/EventCard.jsx';
import { Button, Chip, EmptyState, ErrorState, Input, LinkButton } from '../../components/ui/index.js';
import { CATEGORY_FILTERS, emptyTitle, matchesSearch } from './descubre-filters.js';
import { LiveTicker } from './LiveTicker.jsx';
import { ParaTiCarousel } from './ParaTiCarousel.jsx';
import { UpcomingAppointmentsPanel } from './UpcomingAppointmentsPanel.jsx';

// /descubre (mobile-descubre.html y desktop-descubre.html, sin distancia, mapa ni "Cerca de ti").
// Categoría (?cat=) y búsqueda (?q=) viven en la URL: el buscador de la barra superior de escritorio
// escribe el mismo ?q= y al recargar se conserva el filtro.
export default function DescubrePage() {
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const category = params.get('cat') ?? '';
  const query = params.get('q') ?? '';
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const showSidePanel = useMediaQuery('(min-width: 1024px)');
  const searchId = useId();
  const isOrganizer = profile?.role === 'organizer';
  // En escritorio el participante busca desde la barra superior; el organizador (barra lateral) aquí
  const showInlineSearch = !isDesktop || isOrganizer;

  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useEvents({
    scope: 'upcoming',
    ...(category && { category }),
  });
  const events = (data?.pages.flatMap((page) => page.data) ?? []).filter((e) => matchesSearch(e, query));

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const firstName = profile?.fullName?.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="lg:flex lg:items-start lg:gap-7">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-start justify-between gap-3 md:mb-5">
          <div>
            <h1 className="font-display text-[19px] font-semibold text-ink md:text-[22px]">
              <span className="block font-sans text-xs font-normal text-ink-muted md:inline md:font-display md:text-[22px] md:font-semibold md:text-ink">
                Hola,
              </span>{' '}
              {firstName}
            </h1>
            <p className="mt-1 hidden text-[13px] text-ink-muted md:block">Descubre los eventos de tu comunidad en Medellín</p>
          </div>
          {isOrganizer && (
            <LinkButton to="/eventos/nuevo" variant="secondary" size="sm" className="hidden md:inline-flex">
              Crear evento
            </LinkButton>
          )}
        </div>

        {showInlineSearch && (
          <div className="mb-3.5">
            <label htmlFor={searchId} className="sr-only">
              Buscar eventos
            </label>
            <Input
              id={searchId}
              type="search"
              icon={SearchIcon}
              placeholder="Buscar eventos"
              value={query}
              onChange={(e) => setParam('q', e.target.value)}
              enterKeyHint="search"
            />
          </div>
        )}

        <div className="mb-3.5">
          <LiveTicker />
        </div>

        <div
          role="group"
          aria-label="Categoría"
          className="-mx-[22px] mb-4 flex gap-2 overflow-x-auto px-[22px] py-1.5 md:mx-0 md:mb-[22px] md:gap-2.5 md:px-0"
        >
          {CATEGORY_FILTERS.map(({ value, label }) => (
            <Chip key={value || 'all'} selected={category === value} onClick={() => setParam('cat', value)}>
              {label}
            </Chip>
          ))}
        </div>

        {!category && !query && <ParaTiCarousel />}

        {isPending && (
          <div className="grid gap-3.5 md:grid-cols-2 md:gap-[18px] xl:grid-cols-3" aria-busy="true" aria-label="Cargando eventos">
            {Array.from({ length: 6 }, (_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isPending && !isError && events.length === 0 && (
          <EmptyState
            title={emptyTitle(category, query)}
            description={query ? 'Prueba con otra palabra.' : undefined}
            action={
              query ? (
                <Button variant="secondary" size="sm" onClick={() => setParam('q', '')}>
                  Quitar búsqueda
                </Button>
              ) : (
                !category &&
                isOrganizer && (
                  <LinkButton to="/eventos/nuevo" size="sm">
                    Crear el primero
                  </LinkButton>
                )
              )
            }
          />
        )}

        {events.length > 0 && (
          <>
            <h2 className="sr-only">Próximos eventos</h2>
            <ul className="grid gap-3.5 md:grid-cols-2 md:gap-[18px] xl:grid-cols-3">
              {events.map((event) => (
                <li key={event.id} className="flex">
                  <EventCard event={event} className="w-full" />
                </li>
              ))}
            </ul>
          </>
        )}

        {hasNextPage && !isError && (
          <div className="mt-5 flex justify-center">
            <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
              Ver más
            </Button>
          </div>
        )}
      </div>

      {showSidePanel && (
        <aside className="w-[300px] shrink-0" aria-label="Tu agenda">
          <UpcomingAppointmentsPanel />
        </aside>
      )}
    </div>
  );
}
