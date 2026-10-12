import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { CalendarIcon, ChevronLeftIcon, MapPinIcon, UserIcon } from '../../components/icons/index.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCancelEvent, useEvent, usePublishEvent } from '../../hooks/useEvent.js';
import { formatDate } from '../../lib/format.js';
import { AttendanceButton } from '../../components/events/AttendanceButton.jsx';
import { CategoryChip, StatusBadges } from '../../components/events/EventBadges.jsx';
import {
  Button,
  CapacityBar,
  ErrorState,
  LinkButton,
  Modal,
  Skeleton,
  useToast,
} from '../../components/ui/index.js';

export default function DetalleEventoPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const toast = useToast();
  const { data: event, isPending, isError, error, refetch } = useEvent(id);
  const cancelEvent = useCancelEvent(id);
  const publishEvent = usePublishEvent(id);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (isPending) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (isError) {
    return error.code === 'EVENT_NOT_FOUND' ? (
      <ErrorState message="El evento no existe o ya no está disponible." />
    ) : (
      <ErrorState message={error.message} onRetry={refetch} />
    );
  }

  const isOwner = event.organizer.id === profile?.id;
  const isActive = event.status === 'draft' || event.status === 'published' || event.status === 'in_progress';
  const canModify = isOwner && isActive && !event.isPast;

  function handleCancel() {
    cancelEvent.mutate(undefined, {
      onSuccess: () => {
        toast.success('Cancelaste el evento.');
        setConfirmingCancel(false);
      },
      onError: (err) => {
        toast.error(err.message);
        setConfirmingCancel(false);
      },
    });
  }

  function handlePublish() {
    publishEvent.mutate(undefined, {
      onSuccess: () => toast.success('Evento publicado.'),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        to="/eventos"
        className="focus-ring inline-flex min-h-11 items-center gap-1 self-start rounded-field text-sm font-semibold text-accent hover:text-accent-soft"
      >
        <ChevronLeftIcon size={16} /> Volver a eventos
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category={event.category} />
          <StatusBadges event={event} />
        </div>
        <h1 className="font-display text-xl font-semibold text-ink md:text-[22px]">{event.title}</h1>
      </header>

      <section className="flex flex-col gap-3 rounded-card border border-line bg-panel p-5">
        <p className="flex items-start gap-2 text-sm text-ink">
          <CalendarIcon size={18} className="mt-0.5 shrink-0 text-accent-soft" />
          <span className="capitalize">
            {formatDate(event.startsAt)}
            {event.endsAt && <span className="normal-case"> · hasta {formatDate(event.endsAt)}</span>}
          </span>
        </p>
        <p className="flex items-start gap-2 text-sm text-ink">
          <MapPinIcon size={18} className="mt-0.5 shrink-0 text-accent-soft" />
          <span>{event.location}</span>
        </p>
        <p className="flex items-start gap-2 text-sm text-ink">
          <UserIcon size={18} className="mt-0.5 shrink-0 text-accent-soft" />
          <span>Organiza {event.organizer.fullName}</span>
        </p>
        <CapacityBar confirmedCount={event.confirmedCount} capacity={event.capacity} className="mt-1" />
        <p className="text-xs text-ink-muted">
          {event.isFull ? 'Sin cupos disponibles' : `${event.availableSpots} cupos disponibles`}
        </p>
      </section>

      {event.description && (
        <section className="rounded-card border border-line bg-panel p-5">
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Sobre el evento</h2>
          <p className="text-[13px] leading-relaxed whitespace-pre-line text-ink-muted">{event.description}</p>
        </section>
      )}

      {event.status === 'cancelled' && (
        <p role="status" className="rounded-field border border-action/30 bg-action/10 p-4 text-sm font-semibold text-action">
          Este evento fue cancelado.
        </p>
      )}

      <AttendanceButton event={event} />

      {isOwner && (
        <section aria-label="Acciones del organizador" className="flex flex-col gap-2 md:flex-row md:flex-wrap">
          {event.status === 'draft' && canModify && (
            <Button onClick={handlePublish} loading={publishEvent.isPending}>
              Publicar evento
            </Button>
          )}
          {canModify && (
            <LinkButton to={`/eventos/${event.id}/editar`} variant="secondary">
              Editar
            </LinkButton>
          )}
          <LinkButton to={`/eventos/${event.id}/asistentes`} variant="secondary">
            Ver asistentes
          </LinkButton>
          {canModify && (
            <Button variant="danger" onClick={() => setConfirmingCancel(true)}>
              Cancelar evento
            </Button>
          )}
        </section>
      )}

      <Modal open={confirmingCancel} title="¿Cancelar este evento?" onClose={() => setConfirmingCancel(false)}>
        <p className="mb-5 text-sm text-ink-muted">
          El evento quedará cancelado y esta acción no se puede deshacer. Los confirmados verán que ya no se realiza.
        </p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={() => setConfirmingCancel(false)}>
            Mantener evento
          </Button>
          <Button variant="danger" onClick={handleCancel} loading={cancelEvent.isPending}>
            Sí, cancelar evento
          </Button>
        </div>
      </Modal>
    </article>
  );
}
