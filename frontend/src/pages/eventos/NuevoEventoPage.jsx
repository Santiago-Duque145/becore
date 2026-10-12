import { useNavigate } from 'react-router';
import { useCreateEvent } from '../../hooks/useEvent.js';
import { EventForm } from '../../components/events/EventForm.jsx';
import { useToast } from '../../components/ui/index.js';

export default function NuevoEventoPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createEvent = useCreateEvent();

  async function handleSubmit(payload) {
    const event = await createEvent.mutateAsync({ ...payload, status: 'published' });
    toast.success('Evento publicado.');
    navigate(`/eventos/${event.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 font-display text-xl font-semibold text-ink md:text-[22px]">Crear evento</h1>
      <div className="rounded-card border border-line bg-panel p-5">
        <EventForm submitLabel="Publicar evento" onSubmit={handleSubmit} onCancel={() => navigate('/eventos')} />
      </div>
    </div>
  );
}
