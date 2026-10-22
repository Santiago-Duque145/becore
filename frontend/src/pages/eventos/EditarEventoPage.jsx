import { useNavigate, useParams } from 'react-router';
import { useEvent, usePublishEvent, useUpdateEvent } from '../../hooks/useEvent.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { EventForm } from '../../components/events/EventForm.jsx';
import { ErrorState, Skeleton, useToast } from '../../components/ui/index.js';
import { eventToFormValues } from '../../lib/event-schema.js';
import { LOCATION_MISSING_NOTICE, eventPoint, hasCoordinates } from '../../lib/map.js';

const DRAFT_ACTIONS = [
  { intent: 'draft', label: 'Guardar borrador', variant: 'secondary' },
  { intent: 'publish', label: 'Publicar', variant: 'primary' },
];
const PUBLISHED_ACTIONS = [{ intent: 'save', label: 'Guardar cambios', variant: 'primary' }];

export default function EditarEventoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { profile } = useAuth();
  const { data: event, isPending, isError, error, refetch } = useEvent(id);
  const updateEvent = useUpdateEvent(id);
  const publishEvent = usePublishEvent(id);

  if (isPending) return <Skeleton className="mx-auto h-96 max-w-5xl" />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
  if (event.organizer.id !== profile.id) {
    return <ErrorState message="Solo el organizador de este evento puede editarlo." />;
  }

  const isDraft = event.status === 'draft';

  // Borrador: guardar o guardar y publicar. Publicado: guardar cambios (no se puede despublicar).
  async function handleSubmit(payload, intent) {
    const saved = await updateEvent.mutateAsync(payload);
    if (intent === 'publish') {
      await publishEvent.mutateAsync();
      toast.success('Evento publicado.');
    } else {
      toast.success(isDraft ? 'Guardamos el borrador.' : 'Guardamos los cambios del evento.');
    }
    if (!hasCoordinates(saved)) toast.info(LOCATION_MISSING_NOTICE);
    navigate(`/eventos/${id}`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-5 font-display text-xl font-semibold text-ink md:text-[22px]">
        {isDraft ? 'Editar borrador' : 'Editar evento'}
      </h1>
      <EventForm
        initialValues={eventToFormValues(event)}
        actions={isDraft ? DRAFT_ACTIONS : PUBLISHED_ACTIONS}
        keepDuration={Boolean(event.endsAt)}
        initialCoverUrl={event.coverUrl}
        initialPlace={hasCoordinates(event) ? eventPoint(event) : null}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/eventos/${id}`)}
      />
    </div>
  );
}
