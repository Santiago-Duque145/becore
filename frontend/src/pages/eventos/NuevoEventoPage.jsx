import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCreateEvent } from '../../hooks/useEvent.js';
import { EventForm } from '../../components/events/EventForm.jsx';

export default function NuevoEventoPage() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  async function handleSubmit(payload) {
    const event = await createEvent.mutateAsync({ ...payload, status: 'published' });
    toast.success('Evento publicado.');
    navigate(`/eventos/${event.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 font-display text-2xl font-bold text-navy-900">Crear evento</h1>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <EventForm submitLabel="Publicar evento" onSubmit={handleSubmit} onCancel={() => navigate('/eventos')} />
      </div>
    </div>
  );
}
