import { lazy, Suspense, useEffect, useId, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useEvents } from '../../hooks/useEvents.js';
import { useEventSearch } from '../../hooks/useEventSearch.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { useRecommendedEvents } from '../../hooks/useRecommendedEvents.js';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { hasCoordinates, sortByDistance, withDistance } from '../../lib/map.js';
import { SearchIcon, SparklesIcon } from '../../components/icons/index.js';
import { EventCard, EventCardSkeleton } from '../../components/events/EventCard.jsx';
import { NearMeButton } from '../../components/events/NearMeButton.jsx';
import { Button, Chip, EmptyState, ErrorState, Input, LinkButton, Skeleton } from '../../components/ui/index.js';
import { CATEGORY_FILTERS, SEARCH_PLACEHOLDER, descubreRequest, emptyTitle, matchesSearch } from './descubre-filters.js';
import { LiveTicker } from './LiveTicker.jsx';
import { MapEventList } from './MapEventList.jsx';
import { ParaTiCarousel, ParaTiSkeleton } from './ParaTiCarousel.jsx';
import { UpcomingAppointmentsPanel } from './UpcomingAppointmentsPanel.jsx';

// Leaflet pesa: el mapa se descarga solo al entrar en la vista de mapa
const EventsMap = lazy(() => import('../../components/map/EventsMap.jsx').then((m) => ({ default: m.EventsMap })));

// /descubre (mobile-descubre.html y desktop-descubre.html) con lista o mapa (?vista=mapa), "Cerca de mí" (P6)
// y orden por cercanía (?orden=cerca). La ubicación solo vive en el navegador: nunca se envía ni se guarda.
// Categoría (?cat=) y búsqueda (?q=) viven en la URL: el buscador de la barra superior de escritorio
// escribe el mismo ?q= y al recargar se conserva el filtro. Desde 2 letras la búsqueda la hace la API (IA7: lenguaje
// natural, con respaldo clásico) y sus resultados reemplazan la lista y los pines del mapa.
export default function DescubrePage() {
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const category = params.get('cat') ?? '';
  const query = params.get('q') ?? '';
  const view = params.get('vista') === 'mapa' ? 'mapa' : 'lista';
  const byDistance = params.get('orden') === 'cerca';
  const geo = useGeolocation();
  const [selectedId, setSelectedId] = useState(null); // pin resaltado en el mapa
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const showSidePanel = useMediaQuery('(min-width: 1024px)');
  const searchId = useId();
  const isOrganizer = profile?.role === 'organizer';
  // En escritorio el participante busca desde la barra superior; el organizador (barra lateral) aquí
  const showInlineSearch = !isDesktop || isOrganizer;

  const mapView = view === 'mapa';
  // Misma petición que precarga el arranque (lib/startup-prefetch.js)
  const { search: apiSearch, filters, showParaTi } = descubreRequest(params);
  const recommended = useRecommendedEvents(showParaTi);
  const list = useEvents(filters, { enabled: !apiSearch });
  const search = useEventSearch(query, category);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = list;
  const { isError, error, refetch } = apiSearch ? search : list;
  // CLS: mientras pueda haber "Para ti", la lista no se pinta hasta que llegan las dos respuestas. Así el carrusel nunca
  // empuja tarjetas ya pintadas, y si viene vacío su skeleton desaparece a la vez que llegan las tarjetas.
  const isPending = apiSearch ? search.isPending : list.isPending || (showParaTi && recommended.isPending);
  const paraTi = showParaTi && !isPending ? recommended.data : null;
  // LCP: la primera portada visible (la de "Para ti" si hay, si no la primera de la lista) se pide con prioridad alta
  const paraTiFirst = paraTi?.events?.length > 0;

  // En el mapa se cargan todos los eventos de una vez (sin "Ver más")
  useEffect(() => {
    if (!apiSearch && mapView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [apiSearch, mapView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const matching = apiSearch ? search.events : (data?.pages.flatMap((page) => page.data) ?? []).filter((e) => matchesSearch(e, query));
  // Distancia calculada aquí, en el navegador; sin ubicación todo funciona igual sin distancias
  const withKm = withDistance(matching, geo.position);
  const events = byDistance && geo.position ? sortByDistance(withKm) : withKm;
  const unlocated = events.filter((e) => !hasCoordinates(e)).length;

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
            <div className="hidden md:block">
              <LinkButton to="/eventos/nuevo" variant="secondary" size="sm">
                Crear evento
              </LinkButton>
            </div>
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
              placeholder={SEARCH_PLACEHOLDER}
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

        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <div role="group" aria-label="Vista" className="flex gap-2">
            <Chip selected={!mapView} onClick={() => setParam('vista', '')}>
              Lista
            </Chip>
            <Chip selected={mapView} onClick={() => setParam('vista', 'mapa')}>
              Mapa
            </Chip>
          </div>
          {geo.position && (
            <Chip selected={byDistance} onClick={() => setParam('orden', byDistance ? '' : 'cerca')}>
              Más cerca primero
            </Chip>
          )}
          <NearMeButton geo={geo} />
        </div>

        {apiSearch && search.mode === 'semantic' && !isPending && !isError && (
          <p className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-soft">
            <SparklesIcon size={14} />
            Búsqueda inteligente
          </p>
        )}

        {isPending && (
          <div aria-busy="true" aria-label="Cargando eventos">
            {showParaTi && <ParaTiSkeleton />}
            <div className="grid gap-3.5 md:grid-cols-2 md:gap-[18px] xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        <ParaTiCarousel events={paraTi?.events} emptyReason={paraTi?.emptyReason} priorityFirst />

        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isPending && !isError && events.length === 0 && (
          <EmptyState
            title={emptyTitle(category, query)}
            description={query.trim() ? 'Prueba con otras palabras.' : undefined}
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

        {mapView && !isPending && !isError && (
          <section aria-label="Eventos en el mapa">
            <Suspense fallback={<Skeleton className="h-[60dvh] min-h-[320px] md:h-[520px]" />}>
              <EventsMap events={events} userPosition={geo.position} selectedId={selectedId} onSelect={setSelectedId} className="h-[60dvh] min-h-[320px] md:h-[520px]" />
            </Suspense>
            {unlocated > 0 && (
              <p className="mt-2 text-xs text-ink-muted">
                {unlocated === 1 ? '1 evento no tiene' : `${unlocated} eventos no tienen`} ubicación en el mapa; aparecen en la lista de abajo.
              </p>
            )}
            {events.length > 0 && <MapEventList events={events} selectedId={selectedId} onSelect={setSelectedId} />}
          </section>
        )}

        {!mapView && events.length > 0 && (
          <>
            <h2 className="sr-only">Próximos eventos</h2>
            <ul className="grid gap-3.5 md:grid-cols-2 md:gap-[18px] xl:grid-cols-3">
              {events.map((event, index) => (
                <li key={event.id} className="flex">
                  <EventCard
                    event={event}
                    priority={index === 0 && !paraTiFirst}
                    onOpen={apiSearch ? search.onOpen(event.id) : undefined}
                    className="w-full"
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        {!apiSearch && !mapView && hasNextPage && !isError && (
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
