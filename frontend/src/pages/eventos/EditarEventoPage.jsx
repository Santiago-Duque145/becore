import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { useEvent, useUpdateEvent } from '../../hooks/useEvent.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { EventForm } from '../../components/events/EventForm.jsx';
import { ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { isoToBogotaInput } from '../../lib/format.js';

export default function EditarEventoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: event, isPending, isError, error, refetch } = useEvent(id);
  const updateEvent = useUpdateEvent(id);

  if (isPending) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
  if (event.organizer.id !== profile.id) {
    return <ErrorState message="Solo el organizador de este evento puede editarlo." />;
  }

  const initialValues = {
    title: event.title,
    description: event.description,
    category: event.category,
    location: event.location,
    startsAt: isoToBogotaInput(event.startsAt),
    endsAt: event.endsAt ? isoToBogotaInput(event.endsAt) : '',
    capacity: event.capacity,
  };

  async function handleSubmit(payload) {
    await updateEvent.mutateAsync(payload);
    toast.success('Guardamos los cambios del evento.');
    navigate(`/eventos/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 font-display text-2xl font-bold text-navy-900">Editar evento</h1>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <EventForm
          initialValues={initialValues}
          submitLabel="Guardar cambios"
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/eventos/${id}`)}
        />
      </div>
    </div>
  );
}
