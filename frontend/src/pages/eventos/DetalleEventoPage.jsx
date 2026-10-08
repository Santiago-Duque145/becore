import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, CalendarClock, MapPin, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCancelEvent, useEvent, usePublishEvent } from '../../hooks/useEvent.js';
import { formatDate } from '../../lib/format.js';
import { CapacityBar } from '../../components/events/CapacityBar.jsx';
import { CategoryChip, StatusBadges } from '../../components/events/EventBadges.jsx';
import { Button, LinkButton } from '../../components/ui/Button.jsx';
import { ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export default function DetalleEventoPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { data: event, isPending, isError, error, refetch } = useEvent(id);
  const cancelEvent = useCancelEvent(id);
  const publishEvent = usePublishEvent(id);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (isPending) return <Skeleton className="h-96" />;
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
  const canJoin = profile?.role === 'participant' && event.status === 'published' && !event.isPast;

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
      <Link to="/eventos" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a eventos
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category={event.category} />
          <StatusBadges event={event} />
        </div>
        <h1 className="font-display text-2xl font-bold text-navy-900">{event.title}</h1>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <p className="flex items-start gap-2 text-navy-900">
          <CalendarClock size={18} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
          <span className="capitalize">
            {formatDate(event.startsAt)}
            {event.endsAt && <span className="normal-case"> · hasta {formatDate(event.endsAt)}</span>}
          </span>
        </p>
        <p className="flex items-start gap-2 text-navy-900">
          <MapPin size={18} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
          <span>{event.location}</span>
        </p>
        <p className="flex items-start gap-2 text-navy-900">
          <UserRound size={18} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
          <span>Organiza {event.organizer.fullName}</span>
        </p>
        <CapacityBar confirmedCount={event.confirmedCount} capacity={event.capacity} />
        <p className="text-sm text-gray-500">
          {event.isFull ? 'Sin cupos disponibles' : `${event.availableSpots} cupos disponibles`}
        </p>
      </section>

      {event.description && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-display text-lg font-semibold text-navy-900">Sobre el evento</h2>
          <p className="whitespace-pre-line text-navy-900">{event.description}</p>
        </section>
      )}

      {event.status === 'cancelled' && (
        <p role="status" className="rounded-xl bg-orange-500/10 p-4 font-medium text-orange-500">
          Este evento fue cancelado.
        </p>
      )}

      {canJoin && (
        // Placeholder: el botón real llega con S2-02
        <Button disabled className="w-full">
          Confirmar asistencia
        </Button>
      )}

      {isOwner && (
        <section aria-label="Acciones del organizador" className="flex flex-col gap-2 md:flex-row md:flex-wrap">
          {event.status === 'draft' && canModify && (
            <Button onClick={handlePublish} disabled={publishEvent.isPending}>
              {publishEvent.isPending ? 'Publicando…' : 'Publicar evento'}
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
        <p className="mb-5 text-gray-500">
          El evento quedará cancelado y esta acción no se puede deshacer. Los confirmados verán que ya no se realiza.
        </p>
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={() => setConfirmingCancel(false)}>
            Mantener evento
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={cancelEvent.isPending}>
            {cancelEvent.isPending ? 'Cancelando…' : 'Sí, cancelar evento'}
          </Button>
        </div>
      </Modal>
    </article>
  );
}
