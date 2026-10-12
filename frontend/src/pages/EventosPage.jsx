import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useEvents } from '../hooks/useEvents.js';
import { CATEGORY_OPTIONS } from '../lib/format.js';
import { EventCard, EventCardSkeleton } from '../components/events/EventCard.jsx';
import { Button, Chip, EmptyState, ErrorState, Input, LinkButton } from '../components/ui/index.js';

const SCOPES = [
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Pasados' },
];

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
        <h1 className="font-display text-xl font-semibold text-ink md:text-[22px]">Descubre eventos</h1>
        {profile?.role === 'organizer' && (
          <LinkButton to="/eventos/nuevo" className="hidden md:inline-flex">
            Crear evento
          </LinkButton>
        )}
      </div>

      <div role="tablist" aria-label="Periodo" className="flex gap-2">
        {SCOPES.map(({ value, label }) => (
          <Chip key={value} role="tab" selected={scope === value} onClick={() => setScope(value)}>
            {label}
          </Chip>
        ))}
      </div>

      <div className="-mx-[22px] flex gap-2 overflow-x-auto px-[22px] py-1.5 md:mx-0 md:px-0" role="group" aria-label="Categoría">
        <Chip selected={category === ''} onClick={() => setCategory('')}>
          Todos
        </Chip>
        {CATEGORY_OPTIONS.map(({ value, label }) => (
          <Chip key={value} selected={category === value} onClick={() => setCategory(value)}>
            {label}
          </Chip>
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
                size="sm"
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
              profile?.role === 'organizer' && (
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {hasNextPage && (
            <Button
              variant="secondary"
              className="self-center"
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
            >
              Ver más
            </Button>
          )}
        </>
      )}
    </div>
  );
}
