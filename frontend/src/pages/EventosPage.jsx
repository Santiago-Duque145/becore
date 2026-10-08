import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useEvents } from '../hooks/useEvents.js';
import { CATEGORY_OPTIONS } from '../lib/format.js';
import { EventCard, EventCardSkeleton } from '../components/events/EventCard.jsx';
import { EmptyState, ErrorState } from '../components/ui/Feedback.jsx';
import { Button, LinkButton } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Field.jsx';

const SCOPES = [
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Pasados' },
];

const chipClass = (active) =>
  `min-h-[44px] rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 ${
    active ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 hover:bg-gray-200'
  }`;

export default function EventosPage() {
  const { profile } = useAuth();
  const [scope, setScope] = useState('upcoming');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters = {
    scope,
    ...(category && { category }),
    ...(from && { from }),
    ...(to && { to }),
  };
  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useEvents(filters);
  const events = data?.pages.flatMap((page) => page.data) ?? [];
  const hasFilters = Boolean(category || from || to);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-navy-900">Descubre eventos</h1>
        {profile?.role === 'organizer' && (
          <LinkButton to="/eventos/nuevo" className="hidden md:inline-flex">
            Crear evento
          </LinkButton>
        )}
      </div>

      <div role="tablist" aria-label="Periodo" className="flex gap-2">
        {SCOPES.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={scope === value}
            onClick={() => setScope(value)}
            className={chipClass(scope === value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Categoría">
        <button className={chipClass(category === '')} aria-pressed={category === ''} onClick={() => setCategory('')}>
          Todos
        </button>
        {CATEGORY_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            className={chipClass(category === value)}
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:max-w-md">
        <Input label="Desde" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Hasta" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
      </div>

      {isPending && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorState message={error.message} onRetry={refetch} />}

      {!isPending && !isError && events.length === 0 && (
        <EmptyState
          title={
            hasFilters
              ? 'No hay eventos con esos filtros.'
              : scope === 'upcoming'
                ? 'Todavía no hay eventos próximos.'
                : 'Todavía no hay eventos pasados.'
          }
          description={hasFilters ? 'Prueba quitando algún filtro.' : undefined}
          action={
            hasFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setCategory('');
                  setFrom('');
                  setTo('');
                }}
              >
                Quitar filtros
              </Button>
            ) : (
              scope === 'upcoming' &&
              profile?.role === 'organizer' && <LinkButton to="/eventos/nuevo">Crear el primero</LinkButton>
            )
          }
        />
      )}

      {events.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {hasNextPage && (
            <Button variant="secondary" className="self-center" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Cargando…' : 'Ver más'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
